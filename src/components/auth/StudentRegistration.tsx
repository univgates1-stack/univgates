import { useState } from 'react';
<<<<<<< HEAD
import { Link } from 'react-router-dom';
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
<<<<<<< HEAD
import { Checkbox } from '@/components/ui/checkbox';
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, GraduationCap } from 'lucide-react';

interface StudentRegistrationProps {
  onSuccess: () => void;
}

const StudentRegistration = ({ onSuccess }: StudentRegistrationProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    interestedProgram: '',
    preferredCountry: ''
  });
<<<<<<< HEAD
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD

    if (!policiesAccepted) {
      toast({
        title: 'Action Required',
        description: 'Please confirm you have reviewed our Terms of Service, Privacy Policy, and Cookie Policy before continuing.',
        variant: 'destructive'
      });
      return;
    }

=======
    
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              role: 'student'
            }
        }
      });

      if (error) throw error;

      toast({
        title: 'Registration Successful!',
        description: 'Please check your email to verify your account.',
      });
      
      onSuccess();
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

  const handleGoogleSignUp = async () => {
<<<<<<< HEAD
    if (!policiesAccepted) {
      toast({
        title: 'Action Required',
        description: 'Please confirm you have reviewed our Terms of Service, Privacy Policy, and Cookie Policy before continuing.',
        variant: 'destructive'
      });
      return;
    }

=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            role: 'student'
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Google Sign Up Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Student Registration</CardTitle>
        <CardDescription>
          Join thousands of students finding their perfect university
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
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

          <div className="space-y-2">
            <Label htmlFor="interestedProgram">Interested Program (Optional)</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, interestedProgram: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="computer-science">Computer Science</SelectItem>
                <SelectItem value="business">Business Administration</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="medicine">Medicine</SelectItem>
                <SelectItem value="arts">Arts & Humanities</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredCountry">Preferred Study Country (Optional)</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, preferredCountry: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usa">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="australia">Australia</SelectItem>
                <SelectItem value="germany">Germany</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

<<<<<<< HEAD
          <div className="flex items-start space-x-3 rounded-md border p-4">
            <Checkbox
              id="student-policies"
              checked={policiesAccepted}
              onCheckedChange={(checked) => setPoliciesAccepted(Boolean(checked))}
            />
            <Label htmlFor="student-policies" className="text-sm font-normal leading-relaxed">
              I confirm that I have read and agree to the{' '}
              <Link to="/terms" className="underline">Terms of Service</Link>,{' '}
              <Link to="/privacy" className="underline">Privacy Policy</Link>, and{' '}
              <Link to="/cookies" className="underline">Cookie Policy</Link>.
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
            disabled={loading || !policiesAccepted}
=======
          <Button 
            type="submit" 
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
            disabled={loading}
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Student Account
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
<<<<<<< HEAD
            disabled={loading || !policiesAccepted}
=======
            disabled={loading}
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            onClick={handleGoogleSignUp}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

<<<<<<< HEAD
export default StudentRegistration;
=======
export default StudentRegistration;
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
