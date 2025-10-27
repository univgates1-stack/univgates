import { useMemo, useEffect, useState, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  GraduationCap,
  School,
  FileText,
  MessageSquare,
  User,
  LogOut,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Languages,
  Check,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { useTranslation } from 'react-i18next';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, userData, isLoading } = useUserRole();
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(() => i18n.language.split('-')[0] ?? 'en');
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigation = useMemo(() => {
    if (role === 'university_official') {
      return [
        { name: 'Home', href: '/dashboard', icon: Home },
        { name: 'University', href: '/dashboard/universities', icon: School },
        { name: 'Programs', href: '/dashboard/programs', icon: GraduationCap },
        { name: 'Applications', href: '/dashboard/applications', icon: FileText },
        { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
      ];
    }

    if (role === 'administrator') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Users', href: '/dashboard/users', icon: User },
        { name: 'Universities', href: '/dashboard/universities', icon: School },
        { name: 'Programs', href: '/dashboard/programs', icon: GraduationCap },
        { name: 'Applications', href: '/dashboard/applications', icon: FileText },
        { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
      ];
  }

  return [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Universities', href: '/dashboard/universities', icon: School },
    { name: 'Programs', href: '/dashboard/programs', icon: GraduationCap },
    { name: 'Applications', href: '/dashboard/applications', icon: FileText },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];
}, [role]);

  const languageOptions = useMemo(
    () => [
      { code: 'en', label: t('dashboard.common.languages.en'), flag: '🇺🇸' },
      { code: 'tr', label: t('dashboard.common.languages.tr'), flag: '🇹🇷' },
      { code: 'ar', label: t('dashboard.common.languages.ar'), flag: '🇸🇦' },
    ],
    [t]
  );

  useEffect(() => {
    setLanguage(i18n.language.split('-')[0] ?? 'en');
  }, [i18n.language]);

  useEffect(() => {
    let isActive = true;

    const loadLanguagePreference = async () => {
      try {
        const { data: authData, error } = await supabase.auth.getUser();
        if (error) {
          const message = error.message?.toLowerCase() ?? '';
          if (error.name === 'AuthSessionMissingError' || message.includes('auth session missing')) {
            return;
          }
          throw error;
        }

        const user = authData.user;
        if (!user || !isActive) return;
        setAuthUserId(user.id);

        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('language_preference')
          .eq('id', user.id)
          .maybeSingle();

        if (userError) return;

        const preferred = userRecord?.language_preference;
        if (preferred && preferred !== i18n.language.split('-')[0]) {
          await i18n.changeLanguage(preferred);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error loading language preference:', error);
        }
      }
    };

    void loadLanguagePreference();

    return () => {
      isActive = false;
    };
  }, [i18n]);

  const handleLanguageChange = useCallback(async (code: string) => {
    const normalized = code.split('-')[0];
    if (normalized === language) return;

    const previousLanguage = language;
    setIsUpdatingLanguage(true);
    try {
      await i18n.changeLanguage(normalized);
      if (authUserId) {
        const { error } = await supabase
          .from('users')
          .update({ language_preference: normalized })
          .eq('id', authUserId);

        if (error) {
          throw new Error(error.message);
        }
      }

      toast({ title: t('dashboard.common.languageUpdated') });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error updating language:', error);
      }
      await i18n.changeLanguage(previousLanguage);
      toast({
        title: t('dashboard.common.languageUpdateError'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingLanguage(false);
    }
  }, [authUserId, i18n, language, t, toast]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  useEffect(() => {
    if (isLoading || role !== 'university_official' || !authUserId) {
      return;
    }

    let cancelled = false;

    const evaluateAccess = async () => {
      try {
        let official = (userData ?? {}) as {
          status?: string | null;
          university_id?: string | null;
          department?: string | null;
        };

        if (!official.status || official.university_id === undefined || official.department === undefined) {
          const { data, error } = await supabase
            .from('university_officials')
            .select('status, university_id, department')
            .eq('user_id', authUserId)
            .maybeSingle();

          if (cancelled) return;

          if (error) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('Unable to load university official state:', error);
            }
            toast({
              title: 'Unable to verify onboarding status',
              description:
                'We could not verify your access. Please refresh the page or contact support if the issue continues.',
              variant: 'destructive',
            });
            if (!location.pathname.startsWith('/university-onboarding')) {
              navigate('/university-onboarding', { replace: true });
            }
            return;
          }

          official = {
            status: data?.status ?? official.status,
            university_id: data?.university_id ?? official.university_id,
            department: data?.department ?? official.department,
          };
        }

        const status = (official.status ?? '').toString().toLowerCase();
        const hasUniversity = Boolean(official.university_id);
        const hasDepartment = Boolean((official.department ?? '').toString().trim());
        const currentPath = location.pathname;
        const isOnboardingRoute = currentPath.startsWith('/university-onboarding');
        const isRegistrationPendingRoute = currentPath === '/registration-pending';
        const isPendingReviewRoute = currentPath === '/pending-review';

        if (status === 'pending') {
          if (!isRegistrationPendingRoute) {
            navigate('/registration-pending', { replace: true });
          }
          return;
        }

        if (status === 'rejected') {
          if (!isPendingReviewRoute) {
            navigate('/pending-review', { replace: true });
          }
          return;
        }

        const hasCompletedOnboarding = status === 'approved' && hasUniversity && hasDepartment;

        if (!hasCompletedOnboarding && !isOnboardingRoute && !isRegistrationPendingRoute && !isPendingReviewRoute) {
          navigate('/university-onboarding', { replace: true });
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Unexpected error while verifying university official access:', error);
        }
        toast({
          title: 'Unable to verify onboarding status',
          description: 'Please refresh the page or contact support if the issue continues.',
          variant: 'destructive',
        });
        if (!location.pathname.startsWith('/university-onboarding')) {
          navigate('/university-onboarding', { replace: true });
        }
      }
    };

    void evaluateAccess();

    return () => {
      cancelled = true;
    };
  }, [isLoading, role, userData, location.pathname, navigate, toast, authUserId]);

  useEffect(() => {
    let isMounted = true;

    const loadAvatar = async () => {
      if (role === 'university_official') {
        const universityId = (userData as { university_id?: string | null } | null)?.university_id ?? null;
        if (!universityId) {
          setAvatarUrl(null);
          return;
        }

        const { data } = await supabase
          .from('universities')
          .select('logo_url')
          .eq('id', universityId)
          .maybeSingle();

        if (!isMounted) return;
        setAvatarUrl(data?.logo_url ?? null);
      } else {
        setAvatarUrl(null);
      }
    };

    void loadAvatar();

    return () => {
      isMounted = false;
    };
  }, [role, userData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="inline-flex"
              aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
            <Logo
              href="/"
              className="gap-2"
              imgClassName="w-8 h-8"
              textClassName="hidden sm:inline text-xl font-bold text-primary"
              showText={!isSidebarCollapsed}
            />
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={isUpdatingLanguage}
                  aria-label={t('dashboard.common.languageSelector')}
                >
                  <Languages className="h-4 w-4" />
                  <span className="uppercase">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                {languageOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.code}
                    onSelect={(event) => {
                      event.preventDefault();
                      void handleLanguageChange(option.code);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <span>{option.flag}</span>
                      <span>{option.label}</span>
                    </span>
                    {language === option.code && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="User avatar" /> : <AvatarImage src="" />}
              <AvatarFallback>
                {role === 'administrator' ? 'A' : role === 'university_official' ? 'UO' : 'ST'}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-sidebar border-r min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out`}
        >
          <div className="p-3">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Profile Completion Prompt */}
      {role === 'student' && <ProfileCompletionPrompt />}
    </div>
  );
};

export default DashboardLayout;
