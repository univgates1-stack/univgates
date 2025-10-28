import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Briefcase, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LabelList } from 'recharts';

interface AgentRegistrationProps {
  onSuccess: () => void;
}

const AgentRegistration = ({ onSuccess }: AgentRegistrationProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    institutionName: '',
    roleTitle: '',
    companyNumber: '',
    country: '',
    phoneNumber: '',
    licenseNumber: '',
    experience: ''
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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'agent',
            institution_name: formData.institutionName,
            role_title: formData.roleTitle,
            company_number: formData.companyNumber,
            contact_phone: formData.phoneNumber,
            agency_license_number: formData.licenseNumber,
            country: formData.country,
            experience: formData.experience
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Registration Successful!',
        description: 'Your account is pending verification. You will receive an email once approved.',
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Agent Registration</CardTitle>
        <CardDescription>
          Connect students with their dream universities
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Agent accounts require verification. You'll receive an email once your account is approved (typically within 1-2 business days).
          </AlertDescription>
        </Alert>

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
              placeholder="Enter your business email"
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
            <Label htmlFor="institutionName">Institution Name</Label>
            <Input
              id="institutionName"
              value={formData.institutionName}
              onChange={(e) => setFormData(prev => ({ ...prev, institutionName: e.target.value }))}
              placeholder="Enter your institution name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleTitle">Role/Title</Label>
            <Input
              id="roleTitle"
              value={formData.roleTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, roleTitle: e.target.value }))}
              placeholder="e.g., Education Consultant, Agent Manager"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyNumber">Company Number</Label>
            <Input
              id="companyNumber"
              value={formData.companyNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, companyNumber: e.target.value }))}
              placeholder="Enter company registration number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usa">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="australia">Australia</SelectItem>
                <SelectItem value="turkey">Turkey</SelectItem>
                <SelectItem value="uae">UAE</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Contact Phone</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License/Registration Number (Optional)</Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
              placeholder="Enter license number if applicable"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))} required>
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-1">0-1 years</SelectItem>
                <SelectItem value="2-5">2-5 years</SelectItem>
                <SelectItem value="6-10">6-10 years</SelectItem>
                <SelectItem value="10+">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Agent Account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AgentRegistration;