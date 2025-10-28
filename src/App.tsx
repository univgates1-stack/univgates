import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RoleProvider } from "@/context/RoleContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import AcademicOnboarding from "./pages/AcademicOnboarding";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/dashboard/Home";
import Profile from "./pages/dashboard/Profile";
import Universities from "./pages/dashboard/Universities";
import Programs from "./pages/dashboard/Programs";
import Applications from "./pages/dashboard/Applications";
import Chat from "./pages/dashboard/Chat";
import Users from "./pages/dashboard/Users";
import AuthNew from "./pages/AuthNew";
import AuthUniversity from "./pages/AuthUniversity";
import UniversityOfficialOnboarding from "./pages/UniversityOfficialOnboarding";
import PendingReview from "./pages/PendingReview";
import RegistrationPending from "./pages/RegistrationPending";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import ComingSoon from "./pages/ComingSoon";

const queryClient = new QueryClient();

const mapMetadataRole = (value?: string | null): string | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === 'admin' || lower === 'administrator') return 'administrator';
  return lower;
};

const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProcessingRef = useRef(false);
  const isExchangingRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hash = location.hash ?? "";
    const code = params.get('code');
    const errorDescription = params.get('error_description');
    const hasTokenParams =
      params.has('access_token') ||
      params.has('refresh_token') ||
      params.has('expires_in') ||
      params.has('token_type');
    const hasTokenHash = hash.includes('access_token') || hash.includes('refresh_token');

    if (!code && !errorDescription && !hasTokenParams && !hasTokenHash) {
      return;
    }

    const handleExchange = async () => {
      if (isExchangingRef.current) return;
      isExchangingRef.current = true;

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Failed to exchange auth code for session:', error);
          }
        } else if (errorDescription) {
          console.error('Auth redirect returned an error:', errorDescription);
        }
      } catch (authError) {
        console.error('Error handling auth redirect:', authError);
      } finally {
        const sanitizedParams = new URLSearchParams(location.search);
        ['code', 'type', 'error_description', 'access_token', 'refresh_token', 'expires_in', 'token_type'].forEach((key) => sanitizedParams.delete(key));
        const sanitizedSearch = sanitizedParams.toString();
        const sanitizedHash = hasTokenHash ? '' : hash;

        navigate(
          {
            pathname: location.pathname,
            search: sanitizedSearch ? `?${sanitizedSearch}` : '',
            hash: sanitizedHash,
          },
          { replace: true }
        );

        isExchangingRef.current = false;
      }
    };

    handleExchange();
  }, [location, navigate]);

  useEffect(() => {
    const publicRoutes = ['/', '/auth', '/auth-new', '/auth-university', '/register/university-official', '/registration-pending', '/login', '/terms', '/privacy', '/cookies', '/coming-soon'];
    const pendingRoutes = ['/registration-pending', '/pending-review'];

    const matchesDestination = (dest: string, path: string) => {
      if (dest === '/dashboard') {
        return path === '/dashboard' || path.startsWith('/dashboard/');
      }
      if (dest === '/onboarding') {
        return path === '/onboarding' || path.startsWith('/onboarding/');
      }
      if (dest === '/academic-onboarding') {
        return path === '/academic-onboarding' || path.startsWith('/academic-onboarding/');
      }
      if (dest === '/university-onboarding') {
        return path === '/university-onboarding' || path.startsWith('/university-onboarding/');
      }
      if (dest === '/pending-review') {
        return path === '/pending-review';
      }
      if (dest === '/registration-pending') {
        return path === '/registration-pending';
      }
      return path === dest;
    };

    const redirectBasedOnRole = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (isProcessingRef.current) return;

      if (!session?.user) {
        if (!publicRoutes.includes(location.pathname)) {
          navigate('/auth', { replace: true });
        }
        return;
      }

      isProcessingRef.current = true;
      try {
        const userId = session.user.id;

        const [studentCheck, agentCheck, universityCheck, adminCheck] = await Promise.all([
          supabase.from('students').select('profile_completion_status').eq('user_id', userId).maybeSingle(),
          supabase.from('agents').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('university_officials').select('status, department').eq('user_id', userId).maybeSingle(),
          supabase.from('administrators').select('id').eq('user_id', userId).maybeSingle(),
        ]);

        const metadataRole = mapMetadataRole(session.user.user_metadata?.role as string | undefined);

        let userRole: string | null = null;
        let needsOnboarding = false;
        let isPendingReview = false;
        let studentOnboardingStage: 'personal' | 'academic' | null = null;

        if (adminCheck.data && !adminCheck.error) {
          userRole = 'administrator';
        } else if (universityCheck.data && !universityCheck.error) {
          userRole = 'university_official';
          needsOnboarding = !universityCheck.data.department;
          isPendingReview = universityCheck.data.status === 'pending';
        } else if (agentCheck.data && !agentCheck.error) {
          userRole = 'agent';
        } else if (studentCheck.data && !studentCheck.error) {
          userRole = 'student';
          const status = (studentCheck.data.profile_completion_status ?? '').toString().toLowerCase();
          if (!status || status === 'incomplete') {
            studentOnboardingStage = 'personal';
          } else if (['personal_completed', 'personal_complete', 'academic_pending', 'academic_incomplete'].includes(status)) {
            studentOnboardingStage = 'academic';
          } else {
            studentOnboardingStage = null;
          }
        }

        if (!userRole && metadataRole) {
          userRole = metadataRole;
          if (metadataRole === 'university_official') {
            needsOnboarding = true;
          }
          if (metadataRole === 'student') {
            studentOnboardingStage = studentOnboardingStage ?? 'personal';
          }
        }

        let destination = '/dashboard';

        if (userRole === 'university_official') {
          if (isPendingReview) {
            destination = '/pending-review';
          } else if (needsOnboarding) {
            destination = '/university-onboarding';
          }
        } else if (userRole === 'student') {
          if (studentOnboardingStage === 'personal') {
            destination = '/onboarding';
          } else if (studentOnboardingStage === 'academic') {
            destination = '/academic-onboarding';
          } else {
            destination = '/dashboard';
          }
        } else if (userRole === 'agent' || userRole === 'administrator') {
          destination = '/dashboard';
        } else {
          destination = '/onboarding';
        }

        const currentPath = location.pathname;
        const isAlreadyAtDestination = matchesDestination(destination, currentPath);

        if (!isAlreadyAtDestination) {
          navigate(destination, { replace: true });
        }
      } catch (error) {
        console.error('Error handling auth redirect:', error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      redirectBasedOnRole(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      redirectBasedOnRole(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Navigate to="/auth-new" replace />} />
            <Route path="/auth-new" element={<AuthNew />} />
            <Route path="/auth-university" element={<AuthUniversity />} />
            <Route path="/login" element={<Navigate to="/auth-new" replace />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              path="/register/university-official"
              element={<Navigate to="/auth-new?tab=register&type=university" replace />}
            />
            <Route path="/registration-pending" element={<RegistrationPending />} />
            <Route path="/university-onboarding" element={<UniversityOfficialOnboarding />} />
            <Route path="/pending-review" element={<PendingReview />} />
            <Route path="/academic-onboarding" element={<AcademicOnboarding />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/coming-soon" element={<ComingSoon />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Home />} />
              <Route path="profile" element={<Profile />} />
              <Route path="users" element={<Users />} />
              <Route path="universities" element={<Universities />} />
              <Route path="programs" element={<Programs />} />
              <Route path="applications" element={<Applications />} />
              <Route path="chat" element={<Chat />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;
