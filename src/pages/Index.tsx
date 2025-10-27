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
          if (metadataRole === 'student') {
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
            if (metadataRole === 'student') {
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
        <CTASection />
        <TestimonialsSection />
        
        {/* Contact Section */}
        <section id="contact" className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
            <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-primary/50 via-secondary/40 to-accent/50 opacity-20 blur-3xl" />
            <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-secondary/20 opacity-40 blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-xl text-center lg:text-left space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    {t("landing.contactSection.title")}
                  </span>
                </h2>
                <p className="text-lg text-foreground/85">
                  {t("landing.contactSection.description")}
                </p>
              </div>
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-4 -z-10 rounded-[28px] bg-gradient-to-r from-primary/30 via-secondary/25 to-accent/30 opacity-60 blur-3xl" />
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
