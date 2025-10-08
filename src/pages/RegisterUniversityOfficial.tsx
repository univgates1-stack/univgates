import { useState } from 'react';
<<<<<<< HEAD
import Logo from '@/components/Logo';
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, School } from 'lucide-react';

const RegisterUniversityOfficial = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/university-onboarding`,
          data: {
            full_name: formData.fullName,
            role: 'university_official'
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      // Check if user needs email confirmation
      if (data.user && !data.session) {
        toast({
          title: 'Check Your Email!',
          description: 'Please check your email and click the confirmation link to activate your account.',
        });
      } else {
        toast({
          title: 'Registration Successful!',
          description: 'Redirecting to onboarding...',
        });
        
        // Small delay to ensure the user record is created
        setTimeout(() => {
          navigate('/university-onboarding');
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto">
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

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <School className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">University Official Registration</CardTitle>
            <CardDescription>
              Create your account to represent your institution
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create University Official Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default RegisterUniversityOfficial;
=======
export default RegisterUniversityOfficial;
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
