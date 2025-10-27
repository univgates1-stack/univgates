import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, ArrowLeft, Facebook } from 'lucide-react';
import StudentRegistration from '@/components/auth/StudentRegistration';
import AgentRegistration from '@/components/auth/AgentRegistration';
import UniversityRegistration from '@/components/auth/UniversityRegistration';

const AuthNew = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registrationType, setRegistrationType] = useState<'student' | 'agent' | 'university' | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && event === 'SIGNED_IN') {
          navigate('/dashboard');
        }
      }
    );

    // Check if registration type is specified in URL params
    const type = searchParams.get('type') as 'student' | 'agent' | 'university';
    const tab = searchParams.get('tab') as 'student' | 'agent' | 'university';
    const registrationParam = type || tab;
    
    if (registrationParam) {
      setRegistrationType(registrationParam);
    }

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast({
          title: 'Google Sign In Failed',
          description: error.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: 'Facebook Sign In Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = () => {
    setRegistrationType(null);
    toast({
      title: 'Verify your email',
      description: 'We just sent you a verification link. Please confirm your email before signing in.',
    });
  };

  if (registrationType) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setRegistrationType(null)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>

          {registrationType === 'student' && (
            <StudentRegistration onSuccess={handleRegistrationSuccess} />
          )}
          {registrationType === 'agent' && (
            <AgentRegistration onSuccess={handleRegistrationSuccess} />
          )}
          {registrationType === 'university' && (
            <UniversityRegistration onSuccess={handleRegistrationSuccess} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo
            className="inline-flex justify-center gap-3"
            imgClassName="w-12 h-12"
            textClassName="hidden sm:inline text-3xl font-bold text-slate-50"
          />
        </div>

        <Card className="shadow-elegant border border-border">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="space-y-4 mt-0">
                <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                <CardDescription className="text-center">
                  Sign in to your UnivGates account
                </CardDescription>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginEmail">Email</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loginPassword">Password</Label>
                    <div className="relative">
                      <Input
                        id="loginPassword"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      disabled={loading}
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                      onClick={handleFacebookSignIn}
                    >
                      <Facebook className="mr-2 h-4 w-4" />
                      Continue with Facebook
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-0">
                <CardTitle className="text-2xl font-bold text-center">Choose Account Type</CardTitle>
                <CardDescription className="text-center">
                  Select the type of account you want to create
                </CardDescription>

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4"
                    onClick={() => setRegistrationType('student')}
                  >
                    <div className="text-left">
                      <div className="font-semibold">Student Account</div>
                      <div className="text-sm text-muted-foreground">
                        Find universities and apply to programs
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4"
                    onClick={() => navigate('/coming-soon')}
                  >
                    <div className="text-left">
                      <div className="font-semibold">Education Agent</div>
                      <div className="text-sm text-muted-foreground">
                        Help students with university applications
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4"
                    onClick={() => setRegistrationType('university')}
                  >
                    <div className="text-left">
                      <div className="font-semibold">University Official</div>
                      <div className="text-sm text-muted-foreground">
                        Represent your institution on the platform
                      </div>
                    </div>
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Administrators are invited by the system and cannot register publicly.
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AuthNew;
