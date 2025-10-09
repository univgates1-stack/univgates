import { useState, useEffect, useCallback, useRef } from 'react';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

type UserRole = 'student' | 'agent';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const passwordMeetsRequirements = (password: string): boolean => PASSWORD_REGEX.test(password);

const passwordRequirements = [
  'Minimum 8 characters',
  'At least one uppercase letter',
  'At least one number',
  'At least one special character (!@#$%^&* etc.)',
];

const detectRecoveryContext = () => {
  const search = window.location.search;
  const hash = window.location.hash;
  return search.includes('mode=reset-password') || hash.includes('type=recovery');
};

const isAuthScreen = () => window.location.pathname.startsWith('/auth');

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyName?: string;
  contactPhone?: string;
  agencyLicenseNumber?: string;
  universityId?: string;
  department?: string;
}

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const recoveryRef = useRef<boolean>(detectRecoveryContext());
  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student'
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const isRecoveryContext = () => recoveryRef.current || detectRecoveryContext();

  const redirectAfterAuthentication = useCallback(
    async (authUser: User | null) => {
      if (!authUser || recoveryRef.current || isAuthScreen()) return;

      const rawMetadataRole = authUser.user_metadata?.role as string | undefined;
      const normalizedMetadataRole = rawMetadataRole?.toLowerCase();
      if (normalizedMetadataRole === 'administrator' || normalizedMetadataRole === 'admin') {
        navigate('/dashboard');
        return;
      }

      try {
        const { data: adminRecord, error } = await supabase
          .from('administrators')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking administrator role:', error);
        }

        if (adminRecord) {
          navigate('/dashboard');
          return;
        }

        navigate('/onboarding');
      } catch (roleError) {
        console.error('Failed to determine user role during sign-in:', roleError);
        navigate('/onboarding');
      }
    },
    [navigate]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modeFromQuery = searchParams.get('mode');
    if (modeFromQuery === 'reset-password') {
      setIsResetMode(true);
      recoveryRef.current = true;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hashParams.get('type') === 'recovery') {
      setIsResetMode(true);
      recoveryRef.current = true;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'PASSWORD_RECOVERY') {
          setIsResetMode(true);
          recoveryRef.current = true;
          return;
        }

        if (session?.user && event === 'SIGNED_IN' && !recoveryRef.current && !isAuthScreen()) {
          void redirectAfterAuthentication(session.user);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user && !recoveryRef.current && !isAuthScreen()) {
        void redirectAfterAuthentication(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [redirectAfterAuthentication, isResetMode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!passwordMeetsRequirements(signUpData.password)) {
      toast({
        title: 'Password is too weak',
        description: 'Use at least 8 characters, including an uppercase letter, a number, and a special character.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: signUpData.firstName,
            last_name: signUpData.lastName,
            role: signUpData.role,
            company_name: signUpData.companyName,
            contact_phone: signUpData.contactPhone,
            agency_license_number: signUpData.agencyLicenseNumber,
            university_id: signUpData.universityId,
            department: signUpData.department
          }
        }
      });

      if (error) {
        toast({
          title: 'Sign Up Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Sign Up Successful!',
          description: 'Please check your email to verify your account.',
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
          redirectTo: `${window.location.origin}/onboarding`
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
          redirectTo: window.location.origin,
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

  const handlePasswordResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (resetPassword !== resetConfirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please enter the same password in both fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordMeetsRequirements(resetPassword)) {
      toast({
        title: 'Password is too weak',
        description: 'Use at least 8 characters, including an uppercase letter, a number, and a special character.',
        variant: 'destructive',
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: resetPassword });
      if (error) {
        throw error;
      }

      toast({
        title: 'Password updated',
        description: 'You can now sign in with your new password.',
      });

      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      window.history.replaceState(null, '', url.toString());

      recoveryRef.current = false;
      setIsResetMode(false);
      setResetPassword('');
      setResetConfirmPassword('');

      window.location.href = '/auth';
    } catch (error) {
      toast({
        title: 'Unable to reset password',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (signUpData.role) {
      case 'agent':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={signUpData.companyName || ''}
                onChange={(e) => setSignUpData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={signUpData.contactPhone || ''}
                onChange={(e) => setSignUpData(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="Enter contact phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyLicenseNumber">Agency License Number</Label>
              <Input
                id="agencyLicenseNumber"
                value={signUpData.agencyLicenseNumber || ''}
                onChange={(e) => setSignUpData(prev => ({ ...prev, agencyLicenseNumber: e.target.value }))}
                placeholder="Enter license number"
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Agent accounts require approval. You'll receive an email once your account is verified.
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (isResetMode) {
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
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Set a New Password</CardTitle>
              <CardDescription className="text-center">
                Your password reset link is valid for a limited time. Choose a strong password below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter a new password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                  />
                </div>

                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {passwordRequirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>

                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={resetLoading}>
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>
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
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
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
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.35 2 1.86 6.48 1.86 12.07c0 4.9 3.58 8.97 8.26 9.85v-6.97H7.9v-2.88h2.22V9.86c0-2.2 1.32-3.41 3.34-3.41.97 0 1.97.17 1.97.17v2.16h-1.11c-1.09 0-1.43.68-1.43 1.38v1.66h2.44l-.39 2.88h-2.05V21.9c4.68-.88 8.26-4.95 8.26-9.83Z" />
                    </svg>
                    Continue with Facebook
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-0">
                <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
                <CardDescription className="text-center">
                  Join the UnivGates community
                </CardDescription>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={signUpData.firstName}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupEmail">Email</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Password</Label>
                    <div className="relative">
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Create a password"
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
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      {passwordRequirements.map((requirement) => (
                        <li key={requirement}>{requirement}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Label>Account Type</Label>
                    <RadioGroup
                      value={signUpData.role}
                      onValueChange={(value: UserRole) => setSignUpData(prev => ({ ...prev, role: value }))}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="student" />
                        <Label htmlFor="student" className="cursor-pointer">Student</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="agent" id="agent" />
                        <Label htmlFor="agent" className="cursor-pointer">Education Agent</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-sm text-muted-foreground">
                      University officials and administrators are invited by the system.
                    </p>
                  </div>

                  {renderRoleSpecificFields()}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

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
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.35 2 1.86 6.48 1.86 12.07c0 4.9 3.58 8.97 8.26 9.85v-6.97H7.9v-2.88h2.22V9.86c0-2.2 1.32-3.41 3.34-3.41.97 0 1.97.17 1.97.17v2.16h-1.11c-1.09 0-1.43.68-1.43 1.38v1.66h2.44l-.39 2.88h-2.05V21.9c4.68-.88 8.26-4.95 8.26-9.83Z" />
                  </svg>
                  Continue with Facebook
                </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
