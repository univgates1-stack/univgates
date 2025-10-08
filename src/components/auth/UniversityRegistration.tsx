import { useState } from 'react';
<<<<<<< HEAD
import { Link, useNavigate } from 'react-router-dom';
=======
import { useNavigate } from 'react-router-dom';
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
<<<<<<< HEAD
import { Checkbox } from '@/components/ui/checkbox';
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, School } from 'lucide-react';

interface UniversityRegistrationProps {
  onSuccess: () => void;
}

const UniversityRegistration = ({ onSuccess }: UniversityRegistrationProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/university-onboarding`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
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
        if (data.user) {
          try {
            const { data: officialCheck, error: officialCheckError } = await supabase
              .from('university_officials')
              .select('id')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (officialCheckError) {
              console.error('Failed to check existing university official profile:', officialCheckError);
            } else if (!officialCheck?.id) {
              const { error: createOfficialError } = await supabase
                .from('university_officials')
                .insert({
                  user_id: data.user.id,
                  authorized_person_name: `${formData.firstName} ${formData.lastName}`.trim(),
                  authorized_person_email: formData.email,
                  status: 'pending',
                });

              if (createOfficialError) {
                console.error('Failed to create university official profile:', createOfficialError);
              }
            }
          } catch (profileError) {
            console.error('Unexpected error while ensuring university official profile:', profileError);
          }
        }

        toast({
          title: 'Registration Successful!',
          description: 'Redirecting to onboarding...',
        });

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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <School className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">University Official Registration</CardTitle>
        <CardDescription>
          Represent your institution on our platform
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
                required
              />
            </div>
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

<<<<<<< HEAD
          <div className="flex items-start space-x-3 rounded-md border p-4">
            <Checkbox
              id="official-policies"
              checked={policiesAccepted}
              onCheckedChange={(checked) => setPoliciesAccepted(Boolean(checked))}
            />
            <Label htmlFor="official-policies" className="text-sm font-normal leading-relaxed">
              I confirm that I have read and agree to the{' '}
              <Link to="/terms" className="underline">Terms of Service</Link>,{' '}
              <Link to="/privacy" className="underline">Privacy Policy</Link>, and{' '}
              <Link to="/cookies" className="underline">Cookie Policy</Link>.
            </Label>
          </div>

=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
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

<<<<<<< HEAD
        <Button 
          type="submit" 
          className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
          disabled={loading || !policiesAccepted}
        >
=======
          <Button 
            type="submit" 
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
            disabled={loading}
          >
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UniversityRegistration;
