import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Upload,
  Download,
  Banknote,
  Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { submitApplication } from '@/integrations/supabase/applications';
import { DocumentSelectionStep } from '@/components/DocumentSelectionStep';
import { OfferLetterUpload } from '@/components/OfferLetterUpload';
import { useUserRole } from '@/hooks/useUserRole';
import { OfferLettersSection } from '@/components/OfferLettersSection';

const DOCUMENTS_BUCKET = 'documents';

interface SharedDocument {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  is_verified: boolean;
  doc_type_id: string;
  document_types?: {
    name: string;
    description: string | null;
  } | null;
}

const DOCUMENT_DISPLAY_INFO: Record<string, { title: string; description?: string }> = {
  'Degree Certificate': {
    title: 'Degree Certificate',
    description: 'Proof of graduation from the previous institution.',
  },
  'Standardized Exams': {
    title: 'Standardized Exams',
    description: 'Standardized test scores (SAT, TOEFL, IELTS, etc.).',
  },
  'Academic Transcript': {
    title: 'Academic Transcript',
    description: 'Official record of academic performance.',
  },
  'Diploma/Certificate': {
    title: 'Diploma/Certificate',
    description: 'Diploma or certificate issued by the previous institution.',
  },
  'Nüfus Kayıt Örneği': {
    title: 'Nüfus Kayıt Örneği',
    description: 'Official population registry extract (Turkey).',
  },
  'Additional Documents': {
    title: 'Additional Documents',
    description: 'Any extra supporting materials submitted by the applicant.',
  },
  'Payment Receipt': {
    title: 'Payment Receipt',
    description: 'Proof of tuition payment submitted by the student.',
  },
};

const getDisplayInfoForDocument = (doc: SharedDocument) => {
  const typeName = doc.document_types?.name;

  if (typeName && DOCUMENT_DISPLAY_INFO[typeName]) {
    return {
      title: DOCUMENT_DISPLAY_INFO[typeName].title,
      description: DOCUMENT_DISPLAY_INFO[typeName].description ?? doc.document_types?.description ?? undefined,
      originalName: doc.file_name !== typeName ? doc.file_name : undefined,
    };
  }

  if (DOCUMENT_DISPLAY_INFO[doc.file_name]) {
    return {
      title: DOCUMENT_DISPLAY_INFO[doc.file_name].title,
      description: DOCUMENT_DISPLAY_INFO[doc.file_name].description,
    };
  }

  if (typeName) {
    return {
      title: typeName,
      description: doc.document_types?.description ?? undefined,
      originalName: doc.file_name !== typeName ? doc.file_name : undefined,
    };
  }

  return {
    title: DOCUMENT_DISPLAY_INFO['Additional Documents'].title,
    description: DOCUMENT_DISPLAY_INFO['Additional Documents'].description,
    originalName: doc.file_name,
  };
};

interface BankAccount {
  id: string;
  bank_name: string;
  branch_name: string | null;
  account_number: string;
  swift_code: string | null;
  iban: string | null;
}

function SharedDocumentsList({
  sharedDocumentIds,
  studentId,
  applicationId,
}: {
  sharedDocumentIds: string[];
  studentId: string;
  applicationId: string;
}) {
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { role } = useUserRole();

  useEffect(() => {
    fetchDocuments();
  }, [sharedDocumentIds, role]);

  const fetchDocuments = async () => {
    try {
      const createBaseQuery = () =>
        supabase
          .from('documents')
          .select(`
            id,
            file_name,
            file_url,
            uploaded_at,
            is_verified,
            doc_type_id,
            document_types ( name, description )
          `)
          .eq('student_id', studentId);

      const { data, error } = await (async () => {
        if (role === 'administrator') {
          const docMap = new Map<string, SharedDocument>();

          const { data: appDocs, error: appDocsError } = await createBaseQuery().eq('application_id', applicationId);

          if (appDocsError) return { data: null, error: appDocsError } as const;

          (appDocs as SharedDocument[] | null)?.forEach((doc) => docMap.set(doc.id, doc));

          if (sharedDocumentIds && sharedDocumentIds.length > 0) {
            const { data: sharedDocs, error: sharedDocsError } = await createBaseQuery().in(
              'id',
              sharedDocumentIds,
            );

            if (sharedDocsError) return { data: null, error: sharedDocsError } as const;

            (sharedDocs as SharedDocument[] | null)?.forEach((doc) => docMap.set(doc.id, doc));
          }

          return { data: Array.from(docMap.values()), error: null } as const;
        }

        if (!sharedDocumentIds || sharedDocumentIds.length === 0) {
          return { data: [], error: null } as const;
        }

        return await createBaseQuery().in('id', sharedDocumentIds);
      })();

      if (error) throw error;
      setDocuments((data as SharedDocument[]) || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: SharedDocument) => {
    try {
      // Extract path from URL or use directly if already a path
      let filePath = doc.file_url;
      
      // If it's a full URL, extract the path after /documents/
      if (doc.file_url.includes('/documents/')) {
        const urlParts = doc.file_url.split('/documents/');
        filePath = urlParts[1];
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to download the document.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Shared Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents have been shared yet</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const displayInfo = getDisplayInfoForDocument(doc);

              return (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="space-y-1">
                      <p className="font-medium">
                        {displayInfo.title}
                        {displayInfo.originalName && (
                          <span className="ml-2 text-xs text-muted-foreground">({displayInfo.originalName})</span>
                        )}
                      </p>
                      {displayInfo.description && (
                        <p className="text-sm text-muted-foreground">
                          {displayInfo.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.is_verified && (
                      <Badge variant="outline" className="text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StudentInfo {
  name: string;
  nationality: string | null;
  passport_number: string | null;
  email: string | null;
}

export function StudentInformationCard({ studentId, canViewEmail }: { studentId: string; canViewEmail: boolean }) {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentInfo();
  }, [studentId]);

  const fetchStudentInfo = async () => {
    try {
      // Fetch student with user_id
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', studentId)
        .maybeSingle();

      if (studentError) throw studentError;
      
      if (!student) {
        setStudentInfo(null);
        return;
      }

      // Fetch user information
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', student.user_id)
        .maybeSingle();

      if (userError) throw userError;

      // Fetch passport information
      const { data: passport, error: passportError } = await supabase
        .from('student_passports')
        .select('nationality, passport_number')
        .eq('student_id', studentId)
        .maybeSingle();

      // Don't throw on passport error, just log it
      if (passportError) console.log('No passport info:', passportError);

      setStudentInfo({
        name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown',
        nationality: passport?.nationality || null,
        passport_number: passport?.passport_number || null,
        email: user?.email ?? null,
      });
    } catch (error) {
      console.error('Failed to fetch student info:', error);
      setStudentInfo(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading student information...</p>
        </CardContent>
      </Card>
    );
  }

  if (!studentInfo) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No student information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Student Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Full Name</p>
          <p className="font-medium">{studentInfo.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Nationality</p>
          <p className="font-medium">{studentInfo.nationality || 'Not provided'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Passport Number</p>
          <p className="font-medium">{studentInfo.passport_number || 'Not provided'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">
            {canViewEmail
              ? studentInfo.email || 'Not provided'
              : 'Email will be visible after the payment receipt has been uploaded.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ApplicationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  userRole: string;
  onStatusUpdate?: () => void;
}

export function ApplicationDetailsDialog({
  open,
  onOpenChange,
  application,
  userRole,
  onStatusUpdate,
}: ApplicationDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [hasPaymentReceipt, setHasPaymentReceipt] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const sharedDocsKey = JSON.stringify(application.application_data?.shared_document_ids || []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'submitted':
      case 'under_review':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'draft':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStudentName = () => {
    const user = application.students?.users;
    if (user && user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return 'Unknown Student';
  };

  const getProgramName = () => {
    // Handle translatable strings
    if (application.programs?.name?.translations) {
      const translations = application.programs.name.translations;
      // Try to get English translation first, otherwise get the first available
      const enTranslation = translations.find((t: any) => t.language_code === 'en');
      const translation = enTranslation || translations[0];
      return translation?.translated_text || 'Unknown Program';
    }
    return application.application_data?.program_name || 'Unknown Program';
  };

  const getUniversityName = () => {
    return application.programs?.universities?.name || 'Unknown University';
  };

  const getProgress = () => {
    if (application.status === 'submitted' || application.status === 'under_review') return 75;
    if (application.status === 'accepted') return 100;
    if (application.status === 'rejected') return 100;
    return 30;
  };

  const applicationData = (application.application_data as Record<string, any> | null) ?? {};
  const paymentDueDate = applicationData.payment_due_date
    ? new Date(applicationData.payment_due_date)
    : null;

  const universityId =
    (application.programs as any)?.university_id ??
    applicationData.university_id ??
    null;

  const canViewStudentEmail =
    userRole === 'student' ||
    userRole === 'administrator' ||
    (userRole === 'university_official' && hasPaymentReceipt);

  useEffect(() => {
    if (application.status === 'accepted' && universityId) {
      fetchBankAccounts(universityId);
    } else {
      setBankAccounts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application.status, universityId]);

  useEffect(() => {
    let isActive = true;

    const checkPaymentReceipt = async () => {
      try {
        const sharedIds = Array.isArray(application.application_data?.shared_document_ids)
          ? application.application_data.shared_document_ids.filter((id: unknown): id is string => typeof id === 'string')
          : [];

        if (!application.student_id || sharedIds.length === 0) {
          if (isActive) {
            setHasPaymentReceipt(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('documents')
          .select('id, file_name, document_types ( name )')
          .in('id', sharedIds);

        if (error) throw error;

        const hasReceipt = (data || []).some((doc) => {
          const typeName = doc.document_types?.name?.toLowerCase();
          const fileName = doc.file_name?.toLowerCase();
          if (typeName && typeName.includes('payment receipt')) return true;
          if (fileName && fileName.includes('payment') && fileName.includes('receipt')) return true;
          return false;
        });

        if (isActive) {
          setHasPaymentReceipt(hasReceipt);
        }
      } catch (error) {
        console.error('Failed to verify payment receipt:', error);
        if (isActive) {
          setHasPaymentReceipt(false);
        }
      }
    };

    void checkPaymentReceipt();

    return () => {
      isActive = false;
    };
  }, [application.student_id, application.id, sharedDocsKey]);

  const fetchBankAccounts = async (targetUniversityId: string) => {
    setLoadingBankAccounts(true);
    try {
      const { data, error } = await supabase
        .from('university_bank_accounts')
        .select('id, bank_name, branch_name, account_number, swift_code, iban')
        .eq('university_id', targetUniversityId);

      if (error) throw error;

      setBankAccounts(data || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
      setBankAccounts([]);
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    try {
      await submitApplication(application.id);
      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully.',
      });
      onStatusUpdate?.();
      onOpenChange(false);
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

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      if (newStatus === 'accepted') {
        const { count: offerCount, error: offerError } = await supabase
          .from('offer_letters')
          .select('id', { count: 'exact', head: true })
          .eq('application_id', application.id);

        if (offerError) throw offerError;

        if (!offerCount) {
          toast({
            title: 'Offer letter required',
            description: 'Upload an offer letter before accepting this application.',
            variant: 'destructive',
          });
          return;
        }

        const { data: existingApp, error: fetchError } = await supabase
          .from('applications')
          .select('application_data, student_id')
          .eq('id', application.id)
          .single();

        if (fetchError) throw fetchError;

        const paymentDueDate = new Date();
        paymentDueDate.setDate(paymentDueDate.getDate() + 10);

        const existingData = (existingApp?.application_data as Record<string, any> | null) ?? {};

        const updatedData = {
          ...existingData,
          payment_due_date: paymentDueDate.toISOString(),
          payment_status: existingData.payment_status ?? 'pending_payment',
        };

        const { error: updateError } = await supabase
          .from('applications')
          .update({ status: newStatus, application_data: updatedData })
          .eq('id', application.id);

        if (updateError) throw updateError;

        if (existingApp?.student_id) {
          const { error: removeError } = await supabase
            .from('applications')
            .delete()
            .neq('id', application.id)
            .eq('student_id', existingApp.student_id);

          if (removeError) {
            console.error('Failed to remove other applications:', removeError);
          }
        }

        toast({
          title: 'Status Updated',
          description: 'Application accepted successfully. Other applications were withdrawn.',
        });
      } else {
        const { error } = await supabase
          .from('applications')
          .update({ status: newStatus })
          .eq('id', application.id);

        if (error) throw error;

        toast({
          title: 'Status Updated',
          description: `Application ${newStatus === 'rejected' ? 'rejected' : newStatus} successfully.`,
        });
      }

      onStatusUpdate?.();
      onOpenChange(false);
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

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', application.id);

      if (error) throw error;

      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been withdrawn successfully.',
      });
      onStatusUpdate?.();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon(application.status)}
            Application Details
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="student">Student Info</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="offers">Offer Letters</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Status and Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {application.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Progress: {getProgress()}%
                  </span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </CardContent>
            </Card>

            {/* Program Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Program Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="font-medium">{getProgramName()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">University</p>
                    <p className="font-medium">{getUniversityName()}</p>
                  </div>
                  {userRole === 'university_official' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Student</p>
                      <p className="font-medium">{getStudentName()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {application.submitted_at
                        ? new Date(application.submitted_at).toLocaleDateString()
                        : 'Not submitted'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {userRole === 'student' && application.status === 'accepted' && !hasPaymentReceipt && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="space-y-2">
                  <p className="text-sm font-semibold text-blue-900">
                    Upload your payment receipt
                  </p>
                  <p className="text-sm text-blue-800">
                    Your application has been accepted. To secure your seat, please upload your payment receipt in the
                    Documents tab so the university can confirm your payment.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Missing Fields */}
            {application.missing_fields && application.missing_fields.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-800">Missing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {application.missing_fields.map((field: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-orange-700">
                        {field}
                      </Badge>
                    ))}
                  </div>
                  {userRole === 'student' && (
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        navigate('/dashboard/profile');
                      }}
                    >
                      Complete Profile
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="student" className="space-y-4 mt-4">
            {(userRole === 'university_official' || userRole === 'student') ? (
              <StudentInformationCard
                studentId={application.student_id}
                canViewEmail={canViewStudentEmail}
              />
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">This section is not available for your role.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
            {userRole === 'student' && application.status === 'accepted' && !hasPaymentReceipt && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="space-y-2">
                  <p className="text-sm font-semibold text-blue-900">Payment receipt required</p>
                  <p className="text-sm text-blue-800">
                    Upload your payment receipt below. Once it is submitted, the university will review it to finalise your enrolment.
                  </p>
                </CardContent>
              </Card>
            )}
            {userRole === 'student' && (application.status === 'draft' || application.status === 'accepted') && (
              <DocumentSelectionStep
                studentId={application.student_id}
                applicationId={application.id}
                requiredDocuments={(() => {
                  const baseDocs = application.programs?.required_documents
                  ? Array.isArray(application.programs.required_documents)
                    ? application.programs.required_documents
                    : []
                  : [];
                if (application.status === 'accepted') {
                  return Array.from(new Set([...baseDocs, 'Payment Receipt']));
                }
                return baseDocs;
              })()}
              onSelectionChange={(_ids) => {
                onStatusUpdate?.();
              }}
              enableAutoWatermark
            />
            )}
            {(userRole === 'student'
              ? application.status !== 'draft'
              : true) && (
              <SharedDocumentsList
                sharedDocumentIds={application.application_data?.shared_document_ids || []}
                studentId={application.student_id}
                applicationId={application.id}
              />
            )}
          </TabsContent>

          <TabsContent value="offers" className="space-y-4 mt-4">
            <OfferLettersSection 
              applicationId={application.id} 
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="h-full w-px bg-border mt-2" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">Application Created</p>
                      <p className="text-sm text-muted-foreground">
                        {application.submitted_at
                          ? new Date(application.submitted_at).toLocaleString()
                          : 'Draft'}
                      </p>
                    </div>
                  </div>
                  {application.submitted_at && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">Application Submitted</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(application.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {application.status === 'accepted' && userRole === 'student' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Payment Instructions
                  </CardTitle>
                  <CardDescription>
                    Complete your enrollment by submitting the payment within 10 days of acceptance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border border-dashed p-4 bg-muted/40 text-sm text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5" />
                    <span>
                      {paymentDueDate
                        ? `Please upload your payment receipt in the Documents tab no later than ${paymentDueDate.toLocaleDateString()}.`
                        : 'Please upload your payment receipt in the Documents tab within 10 days of acceptance.'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Payment Accounts</h4>
                    {loadingBankAccounts ? (
                      <p className="text-sm text-muted-foreground">Loading payment information...</p>
                    ) : bankAccounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Payment details have not been published yet. Please contact your university official.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {bankAccounts.map((account) => (
                          <div key={account.id} className="rounded-md border p-3 text-sm space-y-1">
                            <p className="font-medium text-foreground">{account.bank_name}</p>
                            {account.branch_name && (
                              <p className="text-muted-foreground">Branch: {account.branch_name}</p>
                            )}
                            <p>Account Number: {account.account_number}</p>
                            {account.iban && <p>IBAN: {account.iban}</p>}
                            {account.swift_code && <p>SWIFT/BIC: {account.swift_code}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {userRole === 'student' && application.status === 'draft' && (
            <Button onClick={handleSubmitApplication} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
          {userRole === 'student' && application.status !== 'accepted' && (
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={loading}
            >
              {loading ? 'Withdrawing...' : 'Withdraw Application'}
            </Button>
          )}
          {userRole === 'university_official' && (application.status === 'submitted' || application.status === 'under_review') && (
            <>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('rejected')}
                disabled={loading}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleUpdateStatus('accepted')}
                disabled={loading}
              >
                Accept
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
