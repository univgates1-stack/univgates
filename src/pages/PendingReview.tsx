import { useEffect } from 'react';
import Logo from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PendingReview = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is actually a university official with pending status
  const checkUserStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: official, error } = await supabase
      .from('university_officials')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !official) {
      navigate('/dashboard');
      return;
    }

    // For now, don't check status field until types are updated
    // if (official.status !== 'pending') {
    //   navigate('/dashboard');
    // }
  };

    checkUserStatus();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <Logo
            className="inline-flex justify-center gap-3"
            imgClassName="w-12 h-12"
            textClassName="hidden sm:inline text-3xl font-bold text-primary"
          />
        </div>

        <Card className="w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-warning/10 rounded-full">
                <Clock className="h-12 w-12 text-warning" />
              </div>
            </div>
            <CardTitle className="text-2xl">Account Under Review</CardTitle>
            <CardDescription className="text-base">
              Your application has been submitted successfully
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Application submitted</span>
              </div>
              
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
                <Clock className="h-5 w-5 text-warning" />
                <span>Under review by our team</span>
              </div>
              
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground opacity-50">
                <Mail className="h-5 w-5" />
                <span>Notification email (pending)</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <p className="text-sm text-muted-foreground text-left">
                Our team will review your university credentials and submitted information. 
                You'll receive an email notification once your account is approved and you can 
                access your dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Need to make changes or have questions?
              </p>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingReview;
