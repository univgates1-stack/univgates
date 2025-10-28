import { useMemo, useEffect, useState, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, userData, isLoading } = useUserRole();
  const { i18n } = useTranslation();
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isTurkish = i18n.language.split('-')[0] === 'tr';
  const translateText = useCallback(
    (english: string, turkish: string) => (isTurkish ? turkish : english),
    [isTurkish]
  );

  const navigation = useMemo(() => {
    if (role === 'university_official') {
      return [
        { name: translateText('Home', 'Ana Sayfa'), href: '/dashboard', icon: Home },
        { name: translateText('University', 'Üniversite'), href: '/dashboard/universities', icon: School },
        { name: translateText('Programs', 'Programlar'), href: '/dashboard/programs', icon: GraduationCap },
        { name: translateText('Applications', 'Başvurular'), href: '/dashboard/applications', icon: FileText },
        { name: translateText('Chat', 'Sohbetler'), href: '/dashboard/chat', icon: MessageSquare },
        { name: translateText('Profile', 'Profil'), href: '/dashboard/profile', icon: User },
      ];
    }

    if (role === 'administrator') {
      return [
        { name: translateText('Dashboard', 'Kontrol Paneli'), href: '/dashboard', icon: Home },
        { name: translateText('Users', 'Kullanıcılar'), href: '/dashboard/users', icon: User },
        { name: translateText('Universities', 'Üniversiteler'), href: '/dashboard/universities', icon: School },
        { name: translateText('Programs', 'Programlar'), href: '/dashboard/programs', icon: GraduationCap },
        { name: translateText('Applications', 'Başvurular'), href: '/dashboard/applications', icon: FileText },
        { name: translateText('Chat', 'Sohbetler'), href: '/dashboard/chat', icon: MessageSquare },
      ];
  }

  return [
    { name: translateText('Home', 'Ana Sayfa'), href: '/dashboard', icon: Home },
    { name: translateText('Universities', 'Üniversiteler'), href: '/dashboard/universities', icon: School },
    { name: translateText('Programs', 'Programlar'), href: '/dashboard/programs', icon: GraduationCap },
    { name: translateText('Applications', 'Başvurular'), href: '/dashboard/applications', icon: FileText },
    { name: translateText('Chat', 'Sohbetler'), href: '/dashboard/chat', icon: MessageSquare },
    { name: translateText('Profile', 'Profil'), href: '/dashboard/profile', icon: User },
  ];
}, [role, translateText]);

  useEffect(() => {
    let isActive = true;

    const loadAuthUser = async () => {
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

        if (!userError) {
          const preferredLanguage = userRecord?.language_preference;
          if (preferredLanguage && preferredLanguage !== i18n.language) {
            await i18n.changeLanguage(preferredLanguage);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error loading authenticated user:', error);
        }
      }
    };

    void loadAuthUser();

    return () => {
      isActive = false;
    };
  }, [i18n]);

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

  const desktopNavItems = useMemo(() => {
    return navigation.map((item) => {
      const isActive = location.pathname === item.href;
      const linkClasses = cn(
        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isSidebarCollapsed ? 'justify-center' : 'gap-3',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
      );

      if (isSidebarCollapsed) {
        return (
          <div key={item.name}>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Link to={item.href} className={linkClasses} aria-label={item.name}>
                  <item.icon className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
          </div>
        );
      }

      return (
        <div key={item.name}>
          <Link to={item.href} className={linkClasses} aria-label={item.name}>
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.name}</span>
          </Link>
        </div>
      );
    });
  }, [navigation, location.pathname, isSidebarCollapsed]);

  const mobileNavItems = useMemo(() => {
    return navigation.map((item) => {
      const isActive = location.pathname === item.href;
      return (
        <SheetClose asChild key={item.name}>
          <Link
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
            )}
            onClick={() => setIsMobileNavOpen(false)}
            aria-label={item.name}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.name}</span>
          </Link>
        </SheetClose>
      );
    });
  }, [navigation, location.pathname]);

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
        <div className="flex h-16 items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label={translateText('Open navigation', 'Menüyü aç')}
                >
                  <PanelLeftOpen className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-r bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs"
              >
                <div className="flex items-center gap-2 border-b border-border px-4 py-4">
                  <Logo
                    href="/"
                    className="gap-2"
                    imgClassName="w-8 h-8"
                    textClassName="text-lg font-semibold text-primary"
                  />
                </div>
                <ScrollArea className="h-[calc(100vh-4rem)] px-2 py-4">
                  <nav className="space-y-2">
                    {mobileNavItems}
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        className="mt-6 w-full justify-start gap-2"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{translateText('Sign out', 'Çıkış yap')}</span>
                      </Button>
                    </SheetClose>
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:inline-flex"
              aria-label={
                isSidebarCollapsed
                  ? translateText('Expand navigation', 'Menüyü genişlet')
                  : translateText('Collapse navigation', 'Menüyü daralt')
              }
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
            <Logo
              href="/"
              className="gap-2"
              imgClassName="w-8 h-8"
              textClassName="hidden sm:inline text-xl font-bold text-primary"
            />
          </div>
          
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label={translateText('Notifications', 'Bildirimler')}
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar className="h-9 w-9 border border-border">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="User avatar" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden items-center gap-2 sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              <span>{translateText('Sign out', 'Çıkış yap')}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="sm:hidden"
              aria-label={translateText('Sign out', 'Çıkış yap')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'hidden border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out lg:flex lg:min-h-[calc(100vh-4rem)] lg:flex-col',
            isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          )}
        >
          <ScrollArea className="h-full px-2 py-4">
            <nav className="space-y-2">{desktopNavItems}</nav>
          </ScrollArea>
        </aside>

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
