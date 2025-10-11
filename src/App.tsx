import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isProcessing) return;

      const publicRoutes = ['/', '/auth', '/auth-new', '/auth-university', '/register/university-official', '/registration-pending', '/login', '/terms', '/privacy', '/cookies'];
      if (!session?.user) {
        if (!publicRoutes.includes(location.pathname)) {
          navigate('/auth');
        }
        return;
      }

      if (publicRoutes.includes(location.pathname)) {
        navigate('/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname, isProcessing]);

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
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />

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
