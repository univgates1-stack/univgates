import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RegistrationPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Registration Submitted</CardTitle>
          <CardDescription className="text-base">
            Your university official registration is under review
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Thank you for submitting your registration. Our team will review your application and university details.
            </p>
            <p className="text-muted-foreground">
              You will receive an email notification once your account has been approved and is ready to use.
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>• Verification of university affiliation</li>
              <li>• Review of submitted documents</li>
              <li>• Email confirmation upon approval</li>
              <li>• Access to your university dashboard</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Homepage
            </Button>
            <Button 
              onClick={() => window.location.href = 'mailto:support@univgates.com'}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationPending;