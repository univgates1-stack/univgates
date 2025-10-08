import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const ProfileCompletionPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already dismissed in this session
      const dismissed = sessionStorage.getItem('profile_prompt_dismissed');
      if (dismissed) {
        setIsDismissed(true);
        return;
      }

      // Check student profile completion
      const { data: student } = await supabase
        .from('students')
        .select('profile_completion_status, date_of_birth, country_of_origin, passport_number')
        .eq('user_id', user.id)
        .single();

      if (!student) return;

      // Show prompt if profile is incomplete
      const isIncomplete = 
        student.profile_completion_status === 'incomplete' ||
        !student.date_of_birth ||
        !student.country_of_origin ||
        !student.passport_number;

      setIsVisible(isIncomplete);
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('profile_prompt_dismissed', 'true');
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleComplete = () => {
    navigate('/dashboard/profile');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <Card className="fixed bottom-6 right-6 w-80 p-4 shadow-lg border-l-4 border-l-primary animate-in slide-in-from-bottom-5 z-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-foreground">Complete Your Profile</h4>
          <p className="text-sm text-muted-foreground">
            Finish your profile to make university applications easier and faster.
          </p>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleComplete}>
              Complete Now
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
};