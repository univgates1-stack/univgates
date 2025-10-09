import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createApplication, checkProfileCompleteness } from '@/integrations/supabase/applications';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { ApplicationSubmissionDialog } from '@/components/ApplicationSubmissionDialog';

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programName: string;
  universityName: string;
  requiredDocuments?: any;
  acceptanceCriteria?: string;
}

export function ApplicationDialog({
  open,
  onOpenChange,
  programId,
  programName,
  universityName,
  requiredDocuments,
  acceptanceCriteria,
}: ApplicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [createdApplicationId, setCreatedApplicationId] = useState<string | null>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{
    isComplete: boolean;
    completionPercentage: number;
    missingFields: string[];
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      checkProfile();
    }
  }, [open]);

  const checkProfile = async () => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) throw new Error('Student profile not found');

      setStudentId(student.id);
      const status = await checkProfileCompleteness(student.id);
      setProfileStatus(status);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleApply = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      // Check if student already has an application for this program
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id, status')
        .eq('student_id', studentId)
        .eq('program_id', programId)
        .maybeSingle();

      if (existingApp) {
        toast({
          title: 'Application Already Exists',
          description: `You already have a ${existingApp.status} application for this program.`,
          variant: 'destructive',
        });
        onOpenChange(false);
        navigate('/dashboard/applications');
        return;
      }

      const application = await createApplication({
        programId,
        studentId,
        applicationData: {
          program_name: programName,
          university_name: universityName,
        },
        requiresDocuments: !profileStatus?.isComplete,
        missingFields: profileStatus?.missingFields || [],
      });

      // Open submission dialog directly
      setCreatedApplicationId(application.id);
      onOpenChange(false);
      setShowSubmissionDialog(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRequiredDocumentsList = () => {
    if (!requiredDocuments) return null;
    
    try {
      const docs = typeof requiredDocuments === 'string' 
        ? JSON.parse(requiredDocuments) 
        : requiredDocuments;
      
      if (Array.isArray(docs)) {
        return docs;
      }
      return null;
    } catch {
      return null;
    }
  };

  const documentsList = getRequiredDocumentsList();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to {programName}</DialogTitle>
          <DialogDescription>
            {universityName}
          </DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Checking your profile...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Completeness Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profile Completeness</span>
                <span className="text-sm text-muted-foreground">
                  {profileStatus?.completionPercentage}%
                </span>
              </div>
              <Progress value={profileStatus?.completionPercentage || 0} />
              
              {!profileStatus?.isComplete && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your profile is incomplete. The university may request additional documents.
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Missing information:</p>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {profileStatus?.missingFields.map((field) => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {profileStatus?.isComplete && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your profile is complete! You can proceed with the application.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Acceptance Criteria */}
            {acceptanceCriteria && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Acceptance Criteria
                </h3>
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                  {acceptanceCriteria}
                </div>
              </div>
            )}

            {/* Required Documents */}
            {documentsList && documentsList.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Required Documents
                </h3>
                <ul className="text-sm space-y-1 bg-muted p-4 rounded-lg">
                  {documentsList.map((doc: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!profileStatus?.isComplete && (
            <Button
              variant="secondary"
              onClick={() => {
                onOpenChange(false);
                navigate('/dashboard/profile');
              }}
            >
              Complete Profile
            </Button>
          )}
          <Button onClick={handleApply} disabled={loading || checking}>
            {loading ? 'Processing...' : 'Start Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {createdApplicationId && studentId && (
      <ApplicationSubmissionDialog
        open={showSubmissionDialog}
        onOpenChange={setShowSubmissionDialog}
        applicationId={createdApplicationId}
        studentId={studentId}
        requiredDocuments={documentsList || []}
        onSubmitted={() => {
          toast({
            title: 'Application Submitted',
            description: 'Your application has been submitted successfully.',
          });
          navigate('/dashboard/applications');
        }}
      />
    )}
    </>
  );
}
