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

  useEffect(() => {
    const publicRoutes = ['/', '/auth', '/auth-new', '/auth-university', '/register/university-official', '/registration-pending', '/login', '/terms', '/privacy', '/cookies', '/coming-soon'];
    const pendingRoutes = ['/registration-pending', '/pending-review'];

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
          needsOnboarding = studentCheck.data.profile_completion_status === 'incomplete';
        }

        if (!userRole && metadataRole) {
          userRole = metadataRole;
          if (metadataRole === 'university_official') {
            needsOnboarding = true;
          }
          if (metadataRole === 'student') {
            needsOnboarding = true;
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
          destination = needsOnboarding ? '/onboarding' : '/dashboard';
        } else if (userRole === 'agent' || userRole === 'administrator') {
          destination = '/dashboard';
        } else {
          destination = '/onboarding';
        }

        if (location.pathname !== destination) {
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
