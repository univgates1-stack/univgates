import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import ContactForm from "@/components/ContactForm";
import { useTranslation } from "react-i18next";

const mapMetadataRole = (value?: string | null): string | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === 'admin' || lower === 'administrator') return 'administrator';
  return lower;
};

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Handle OAuth callback and check for existing session
    const handleAuth = async () => {
      // Check for existing session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check user role and redirect accordingly
        const [studentCheck, agentCheck, universityCheck, adminCheck] = await Promise.all([
          supabase.from('students').select('profile_completion_status').eq('user_id', session.user.id).maybeSingle(),
          supabase.from('agents').select('*').eq('user_id', session.user.id).maybeSingle(),
          supabase.from('university_officials').select('*').eq('user_id', session.user.id).maybeSingle(),
          supabase.from('administrators').select('*').eq('user_id', session.user.id).maybeSingle()
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
        }

        if (userRole === 'university_official') {
          if (isPendingReview) {
            navigate('/pending-review');
          } else if (needsOnboarding) {
            navigate('/university-onboarding');
          } else {
            navigate('/dashboard');
          }
          return;
        }

        if (userRole === 'student') {
          if (needsOnboarding) {
            navigate('/onboarding');
          } else {
            navigate('/dashboard');
          }
          return;
        }

        if (userRole === 'agent' || userRole === 'administrator') {
          navigate('/dashboard');
          return;
        }

        // No role found, redirect to student onboarding as default
        navigate('/onboarding');
        return;
      }
    };

    // Set up auth state listener for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && event === 'SIGNED_IN') {
          // Same logic as above for auth state changes
          const [studentCheck, agentCheck, universityCheck, adminCheck] = await Promise.all([
            supabase.from('students').select('profile_completion_status').eq('user_id', session.user.id).maybeSingle(),
            supabase.from('agents').select('*').eq('user_id', session.user.id).maybeSingle(),
            supabase.from('university_officials').select('*').eq('user_id', session.user.id).maybeSingle(),
            supabase.from('administrators').select('*').eq('user_id', session.user.id).maybeSingle()
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
          }

          if (userRole === 'university_official') {
            if (isPendingReview) {
              navigate('/pending-review');
            } else if (needsOnboarding) {
              navigate('/university-onboarding');
            } else {
              navigate('/dashboard');
            }
          } else if (userRole === 'student') {
            if (needsOnboarding) {
              navigate('/onboarding');
            } else {
              navigate('/dashboard');
            }
          } else if (userRole === 'agent' || userRole === 'administrator') {
            navigate('/dashboard');
          } else {
            navigate('/onboarding');
          }
        }
      }
    );

    handleAuth();

    return () => subscription.unsubscribe();
  }, [navigate]);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
        
        {/* Contact Section */}
        <section id="contact" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("landing.contactSection.title")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("landing.contactSection.description")}
              </p>
            </div>
            <div className="flex justify-center">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
