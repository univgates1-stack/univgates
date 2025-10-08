import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { DocumentSelectionStep } from '@/components/DocumentSelectionStep';
import { submitApplication } from '@/integrations/supabase/applications';
import { supabase } from '@/integrations/supabase/client';

interface ApplicationSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  studentId: string;
  requiredDocuments?: string[];
  onSubmitted: () => void;
}

export function ApplicationSubmissionDialog({
  open,
  onOpenChange,
  applicationId,
  studentId,
  requiredDocuments = [],
  onSubmitted,
}: ApplicationSubmissionDialogProps) {
  const { toast } = useToast();

  type Step = 'review' | 'documents';

  interface ProfileSummary {
    fullName: string;
    email: string;
    nationality: string;
    passportNumber: string;
  }

  const [currentStep, setCurrentStep] = useState<Step>('review');
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [confirmInformation, setConfirmInformation] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [documentsAutoSaving, setDocumentsAutoSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 2;
  const currentStepIndex = currentStep === 'review' ? 1 : 2;

  useEffect(() => {
    if (!open) return;

    setCurrentStep('review');
    setConfirmInformation(false);
    setSelectedDocumentIds([]);
    setDocumentsAutoSaving(false);
    fetchProfileSummary();
  }, [open, studentId]);

  const fetchProfileSummary = async () => {
    setLoadingProfile(true);
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          country_of_origin,
          users ( first_name, last_name, email )
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      const { data: passportData, error: passportError } = await supabase
        .from('student_passports')
        .select('passport_number')
        .eq('student_id', studentId)
        .maybeSingle();

      if (passportError) throw passportError;

      const firstName = studentData?.users?.first_name ?? '';
      const lastName = studentData?.users?.last_name ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Not provided';

      setProfileSummary({
        fullName,
        email: studentData?.users?.email ?? 'Not provided',
        nationality: studentData?.country_of_origin ?? 'Not provided',
        passportNumber: passportData?.passport_number ?? 'Not provided',
      });
    } catch (error: any) {
      console.error('Failed to fetch profile summary:', error);
      toast({
        title: 'Unable to load profile information',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedDocumentIds(ids);
  };

  const handleAutoSavingChange = (saving: boolean) => {
    setDocumentsAutoSaving(saving);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitApplication(applicationId);
      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully.',
      });
      onSubmitted();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Documents and Submit Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Step {currentStepIndex} of {totalSteps}</p>
            <h2 className="text-xl font-semibold">
              {currentStep === 'review' ? 'Confirm your personal details' : 'Share required documents'}
            </h2>
          </div>

          {currentStep === 'review' ? (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Review the details below before proceeding to document submission.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingProfile ? (
                  <p className="text-sm text-muted-foreground">Loading your profile information...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Full Name</p>
                        <p className="text-sm font-medium">{profileSummary?.fullName ?? 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{profileSummary?.email ?? 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Nationality</p>
                        <p className="text-sm font-medium">{profileSummary?.nationality ?? 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Passport Number</p>
                        <p className="text-sm font-medium">{profileSummary?.passportNumber ?? 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 flex items-start gap-2 bg-muted/40">
                      <Checkbox
                        checked={confirmInformation}
                        onCheckedChange={(checked) => setConfirmInformation(Boolean(checked))}
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground">
                        I confirm that the above information is accurate. I understand that providing incorrect
                        personal details may delay or invalidate my application.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <DocumentSelectionStep
              studentId={studentId}
              applicationId={applicationId}
              requiredDocuments={requiredDocuments}
              onSelectionChange={handleSelectionChange}
              onSavingChange={handleAutoSavingChange}
            />
          )}
        </div>

        {currentStep === 'review' ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setCurrentStep('documents')}
              disabled={!confirmInformation || loadingProfile}
            >
              Continue to Documents
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:space-x-2">
            <div className="flex-1 text-xs text-muted-foreground sm:text-right">
              {documentsAutoSaving
                ? 'Saving your latest changes...'
                : selectedDocumentIds.length === 0
                  ? 'Select at least one document to continue.'
                  : ''}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Save Draft
            </Button>
            <Button variant="outline" onClick={() => setCurrentStep('review')}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting ||
                documentsAutoSaving ||
                selectedDocumentIds.length === 0
              }
            >
              {documentsAutoSaving
                ? 'Waiting for auto-save...'
                : submitting
                  ? 'Submitting...'
                  : 'Submit Application'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
