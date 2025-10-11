import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Star, Clock } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  completionPercentage?: number;
  action?: 'apply' | 'search' | 'view';
}

const ProfileCompletionModal = ({
  isOpen,
  onClose,
  completionPercentage = 30,
  action = 'apply'
}: ProfileCompletionModalProps) => {
  const navigate = useNavigate();
  const [remindLater, setRemindLater] = useState(false);

  const getActionMessage = () => {
    switch (action) {
      case 'apply':
        return 'apply to programs';
      case 'search':
        return 'get personalized university matches';
      case 'view':
        return 'access detailed program information';
      default:
        return 'continue';
    }
  };

  const handleCompleteNow = () => {
    navigate('/onboarding');
    onClose();
  };

  const handleRemindLater = () => {
    setRemindLater(true);
    // Store in localStorage to remember user's choice for this session
    localStorage.setItem('profile_completion_reminder', 'later');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Complete Your Profile</DialogTitle>
              <DialogDescription className="mt-1">
                Get matched with better programs and apply faster
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile Completion</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Complete your profile to {getActionMessage()} and unlock:
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Star className="h-4 w-4 text-primary" />
                <span>Personalized university recommendations</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>Faster application process</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>Better program matching</span>
              </div>
            </div>
          </div>

          {/* Missing Information */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Still needed:</p>
            <p className="text-xs text-muted-foreground">
              Academic information, documents, and contact details
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
          <Button variant="outline" onClick={handleRemindLater} className="w-full sm:w-auto">
            Remind Me Later
          </Button>
          <Button onClick={handleCompleteNow} className="w-full sm:w-auto">
            Complete Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionModal;