import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { RedirectHandler } from "@/components/RedirectHandler";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleDomainRedirect } from "@/utils/domainRedirect";
import { RoleProvider } from "@/context/RoleContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
import RegisterUniversityOfficial from "./pages/RegisterUniversityOfficial";
import UniversityOfficialOnboarding from "./pages/UniversityOfficialOnboarding";
import PendingReview from "./pages/PendingReview";
import RegistrationPending from "./pages/RegistrationPending";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient();

const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check domain and redirect if needed
    handleDomainRedirect();
    
    let isMounted = true;
    
    const handleAuthAndProfileCheck = async () => {
      if (isProcessing || !isMounted) return;

      // Skip auth check for public routes
      const publicRoutes = [
        '/', 
        '/auth', 
        '/auth-new', 
        '/auth-university',
        '/register/university-official',
        '/registration-pending',
        '/login'
      ];
      if (publicRoutes.includes(location.pathname)) return;

      setIsProcessing(true);

      try {
        // Check if URL contains access_token hash (from email confirmation)
        const hashFragment = window.location.hash;
        if (hashFragment.includes('access_token')) {
          // Clean up URL by removing hash fragment
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear potentially corrupted session data
          await supabase.auth.signOut();
          if (isMounted) navigate('/auth');
          return;
        }

        if (!data.session) {
          // No session, redirect to auth
          if (isMounted) navigate('/auth');
          return;
        }

        // Check user role and handle role-based redirects
        const onboardingRoutes = ['/dashboard', '/onboarding', '/university-onboarding', '/pending-review'];
        if (onboardingRoutes.some(route => location.pathname.startsWith(route) || location.pathname === route)) {
          // Check each role table to determine user role and redirect accordingly
          const [studentCheck, agentCheck, universityCheck, adminCheck] = await Promise.all([
            supabase.from('students').select('profile_completion_status').eq('user_id', data.session.user.id).maybeSingle(),
            supabase.from('agents').select('*').eq('user_id', data.session.user.id).maybeSingle(),
            supabase.from('university_officials').select('*').eq('user_id', data.session.user.id).maybeSingle(),
            supabase.from('administrators').select('*').eq('user_id', data.session.user.id).maybeSingle()
          ]);

          const metadataRoleRaw = (data.session.user.user_metadata?.role as string | undefined) || null;
          const metadataRole = metadataRoleRaw
            ? metadataRoleRaw.toLowerCase() === 'admin'
              ? 'administrator'
              : metadataRoleRaw
            : null;

          let userRole: string | null = null;
          let needsOnboarding = false;
          let isPendingReview = false;

          const approvedStatuses = ['approved', 'active'];
          const hasUniversityRecord = universityCheck.data && !universityCheck.error;
          const hasStudentRecord = studentCheck.data && !studentCheck.error;

          if (adminCheck.data && !adminCheck.error) {
            userRole = 'administrator';
          } else if (metadataRole === 'university_official') {
            userRole = 'university_official';
            if (hasUniversityRecord) {
              isPendingReview = universityCheck.data.status === 'pending';
              const isApproved = approvedStatuses.includes(universityCheck.data.status ?? '');
              needsOnboarding = isApproved ? false : !universityCheck.data.department;
            } else {
              needsOnboarding = true;
              isPendingReview = false;
            }
          } else if (hasUniversityRecord) {
            userRole = 'university_official';
            isPendingReview = universityCheck.data.status === 'pending';
            const isApproved = approvedStatuses.includes(universityCheck.data.status ?? '');
            needsOnboarding = isApproved ? false : !universityCheck.data.department;
          } else if (agentCheck.data && !agentCheck.error) {
            userRole = 'agent';
          } else if (hasStudentRecord) {
            userRole = 'student';
            needsOnboarding = studentCheck.data.profile_completion_status === 'incomplete';
          }

          if (!userRole && metadataRole) {
            userRole = metadataRole;
            if (metadataRole === 'university_official') {
              needsOnboarding = true;
            }
          }

          // If metadata says the user is a university official, never treat them as a student even if a student record exists
          if (metadataRole === 'university_official' && userRole === 'student') {
            userRole = 'university_official';
            needsOnboarding = !hasUniversityRecord;
            isPendingReview = hasUniversityRecord ? universityCheck.data?.status === 'pending' : false;
          }

          if (userRole === 'university_official') {
            if (isPendingReview && location.pathname !== '/pending-review') {
              if (isMounted) navigate('/pending-review');
              return;
            }

            if (needsOnboarding && location.pathname !== '/university-onboarding' && location.pathname !== '/pending-review') {
              if (isMounted) navigate('/university-onboarding');
              return;
            }
          }

          // Handle dashboard route redirects
          if (location.pathname.startsWith('/dashboard')) {
            if (userRole === 'student' && needsOnboarding) {
              if (isMounted) navigate('/onboarding');
              return;
            } else if (userRole === 'university_official' && needsOnboarding) {
              if (isMounted) navigate('/university-onboarding');
              return;
            } else if (userRole === 'university_official' && isPendingReview) {
              if (isMounted) navigate('/pending-review');
              return;
            }
          }
          
          // Handle onboarding route redirects
          if (location.pathname === '/onboarding') {
            if (userRole === 'student' && !needsOnboarding) {
              if (isMounted) navigate('/dashboard');
              return;
            } else if (userRole !== 'student') {
              // Non-students shouldn't be on student onboarding
              if (userRole === 'university_official' && needsOnboarding) {
                if (isMounted) navigate('/university-onboarding');
                return;
              } else {
                if (isMounted) navigate('/dashboard');
                return;
              }
            }
          }

          // Handle university onboarding route
          if (location.pathname === '/university-onboarding') {
            if (userRole !== 'university_official') {
              // Non-university officials shouldn't be on university onboarding
              if (userRole === 'student' && needsOnboarding) {
                if (isMounted) navigate('/onboarding');
                return;
              } else {
                if (isMounted) navigate('/dashboard');
                return;
              }
            } else if (!needsOnboarding) {
              if (isPendingReview) {
                if (isMounted) navigate('/pending-review');
              } else {
                if (isMounted) navigate('/dashboard');
              }
              return;
            }
          }

          // Handle pending review route
          if (location.pathname === '/pending-review') {
            if (userRole !== 'university_official' || !isPendingReview) {
              if (isMounted) navigate('/dashboard');
              return;
            }
          }
        }

        // Allow academic-onboarding for users with partial profiles
        if (location.pathname === '/academic-onboarding') {
          // No auth blocking for academic onboarding - users can access it after basic onboarding
        }

      } catch (error) {
        console.error('Error in auth handler:', error);
        // Clear potentially corrupted session data
        await supabase.auth.signOut();
        if (isMounted) navigate('/auth');
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    // Small delay to prevent rapid fire requests
    const timeoutId = setTimeout(handleAuthAndProfileCheck, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [navigate, location.pathname]);
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
<<<<<<< HEAD
=======
          <RedirectHandler />
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          <AuthHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth-new" element={<AuthNew />} />
            <Route path="/auth-university" element={<AuthUniversity />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/register/university-official" element={<RegisterUniversityOfficial />} />
            <Route path="/registration-pending" element={<RegistrationPending />} />
            <Route path="/university-onboarding" element={<UniversityOfficialOnboarding />} />
            <Route path="/pending-review" element={<PendingReview />} />
            <Route path="/academic-onboarding" element={<AcademicOnboarding />} />
<<<<<<< HEAD
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051

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
