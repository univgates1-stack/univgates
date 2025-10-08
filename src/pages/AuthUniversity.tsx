import { useState, useEffect } from 'react';
<<<<<<< HEAD
import Logo from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
=======
import { useNavigate } from 'react-router-dom';
import { handleAuthRedirect } from '@/utils/authUtils';
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import UniversityRegistration from '@/components/auth/UniversityRegistration';

const AuthUniversity = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegistrationSuccess = () => {
    toast({
      title: 'Registration Successful!',
      description: 'Please check your email to verify your account, then complete your university onboarding.',
    });
    // Optionally navigate to a pending verification page
    navigate('/pending-verification');
  };

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
<<<<<<< HEAD
      (event, session) => {
        if (session?.user && event === 'SIGNED_IN') {
          navigate('/dashboard');
=======
      async (event, session) => {
        if (session?.user && event === 'SIGNED_IN') {
          await handleAuthRedirect(session.user);
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
<<<<<<< HEAD
          <Logo
            className="inline-flex justify-center gap-3"
            imgClassName="w-12 h-12"
            textClassName="hidden sm:inline text-3xl font-bold text-slate-50"
          />
=======
          <a href="/" className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img 
              src="/UnivGates-Logo.png" 
              alt="UnivGates Logo" 
              className="w-12 h-12"
            />
            <span className="text-3xl font-bold text-slate-50">UnivGates</span>
          </a>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Registration Form */}
        <UniversityRegistration onSuccess={handleRegistrationSuccess} />
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default AuthUniversity;
=======
export default AuthUniversity;
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
