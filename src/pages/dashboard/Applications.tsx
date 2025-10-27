import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus,
  Eye,
  Download,
  Upload,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useUserRole } from '@/hooks/useUserRole';
import { ApplicationDetailsDialog } from '@/components/ApplicationDetailsDialog';

interface Application {
  id: string;
  student_id: string;
  program_id: string;
  status: string;
  application_data: any;
  submitted_at: string | null;
  requires_documents: boolean;
  missing_fields: any;
  programs?: {
    id: string;
    name_id: string | null;
    university_id: string;
    required_documents?: any;
    universities?: {
      name: string;
    };
    name?: {
      translations?: Array<{
        language_code: string;
        translated_text: string;
      }>;
    };
  };
  students?: {
    id?: string;
    user_id: string;
    date_of_birth?: string;
    country_of_origin?: string;
    current_study_level?: string;
    users?: {
      first_name: string;
      last_name: string;
    };
  };
}

const Applications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { isComplete, completionPercentage, shouldShowModal } = useProfileCompletion();
  const { role } = useUserRole();

useEffect(() => {
  if (!role) return;
  fetchApplications();
}, [role]);

  useEffect(() => {
    const state = (location.state as { focusApplicationId?: string } | null) ?? null;
    if (!state?.focusApplicationId || applications.length === 0) {
      return;
    }

    const target = applications.find((app) => app.id === state.focusApplicationId);
    if (target) {
      setSelectedApplication(target);
      setShowDetailsDialog(true);
      navigate(location.pathname, { replace: true });
    }
  }, [applications, location, navigate]);

const fetchApplications = async () => {
  try {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

      if (role === 'student') {
        // Students see their own applications
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!student) {
          setApplications([]);
          return;
        }

        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            programs (
              id,
              name_id,
              university_id,
              required_documents,
              universities (
                name
              ),
              name:translatable_strings!programs_name_id_fkey (
                translations (
                  language_code,
                  translated_text
                )
              )
            ),
            students (
              user_id,
              users (
                first_name,
                last_name
              )
            )
          `)
          .eq('student_id', student.id)
          .order('submitted_at', { ascending: false, nullsFirst: false });

        if (error) throw error;
        setApplications(data || []);
      } else if (role === 'university_official') {
        // University officials see applications to their programs (without student contact info)
        const { data: official } = await supabase
          .from('university_officials')
          .select('university_id')
          .eq('user_id', user.id)
          .single();

        if (!official?.university_id) {
          setApplications([]);
          return;
        }

        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            programs!inner (
              id,
              name_id,
              university_id,
              required_documents,
              universities (
                name
              ),
              name:translatable_strings!programs_name_id_fkey (
                translations (
                  language_code,
                  translated_text
                )
              )
            ),
            students (
              id,
              user_id,
              date_of_birth,
              country_of_origin,
              current_study_level,
              users (
                first_name,
                last_name
              )
            )
          `)
          .neq('status', 'draft')
          .eq('programs.university_id', official.university_id)
          .order('submitted_at', { ascending: false, nullsFirst: false });

        if (error) throw error;
        setApplications(data || []);
      } else if (role === 'administrator') {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            programs!inner (
              id,
              name_id,
              university_id,
              required_documents,
              universities (
                name
              ),
              name:translatable_strings!programs_name_id_fkey (
                translations (
                  language_code,
                  translated_text
                )
              )
            ),
            students (
              id,
              user_id,
              date_of_birth,
              country_of_origin,
              current_study_level,
              users (
                first_name,
                last_name
              )
            )
          `)
          .order('submitted_at', { ascending: false, nullsFirst: false });

        if (error) throw error;
        setApplications(data || []);
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching applications:', error.message);
      } else {
        console.error('Error fetching applications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getApplicationProgress = (app: Application) => {
    if (app.status === 'submitted' || app.status === 'under_review') return 75;
    if (app.status === 'accepted') return 100;
    if (app.status === 'rejected') return 100;
    return 30;
  };

  const getStudentName = (app: Application) => {
    const user = app.students?.users;
    if (user && user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return 'Unknown Student';
  };

  const getProgramName = (app: Application) => {
    // Extract program name from translations
    const programs = app.programs as any;
    if (programs?.name?.translations) {
      const enTranslation = programs.name.translations.find((t: any) => t.language_code === 'en');
      return enTranslation?.translated_text || 'Unknown Program';
    }
    return app.application_data?.program_name || 'Unknown Program';
  };

  const getUniversityName = (app: Application) => {
    return app.programs?.universities?.name || 'Unknown University';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'submitted':
      case 'under_review':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'submitted':
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'under_review':
        return 'Under Review';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'submitted':
        return 'Submitted';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const filterApplicationsByStatus = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter(app => app.status.toLowerCase() === status.toLowerCase());
  };

  if (loading) {
    return <div>Loading applications...</div>;
  }

  const hasAcceptedApplication = role === 'student' && filterApplicationsByStatus('accepted').length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {role === 'university_official' ? 'Program Applications' : 'My Applications'}
          </h1>
          <p className="text-muted-foreground">
            {role === 'university_official' 
              ? 'Review and manage student applications'
              : 'Track and manage your university applications'
            }
          </p>
        </div>
        {role === 'student' && (
          <Button
            disabled={hasAcceptedApplication}
            onClick={() => {
              if (hasAcceptedApplication) return;
              if (!isComplete && shouldShowModal) {
                setShowProfileModal(true);
              } else {
                navigate('/dashboard/programs');
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        )}
      </div>

      {hasAcceptedApplication && role === 'student' && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          You have accepted an offer. Other applications have been withdrawn, and you can no longer create new applications.
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {role === 'university_official' ? 'Pending Review' : 'Under Review'}
                </p>
                <p className="text-2xl font-bold">
                  {filterApplicationsByStatus('submitted').length + filterApplicationsByStatus('under_review').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">
                  {filterApplicationsByStatus('accepted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {role === 'university_official' ? 'Rejected' : 'Draft'}
                </p>
                <p className="text-2xl font-bold">
                  {role === 'university_official' 
                    ? filterApplicationsByStatus('rejected').length
                    : filterApplicationsByStatus('draft').length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Applications</TabsTrigger>
          {role !== 'university_official' && (
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          )}
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {role === 'university_official' 
                    ? 'No applications received yet' 
                    : 'No applications yet. Start by applying to programs!'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => {
                const progress = getApplicationProgress(application);
                const missingFields = application.missing_fields || [];
                
                return (
                  <Card key={application.id} className="hover:shadow-soft transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{getProgramName(application)}</CardTitle>
                          <CardDescription className="mt-1">
                            {getUniversityName(application)}
                            {role === 'university_official' && (
                              <span className="block mt-1">
                                Student: {getStudentName(application)}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(application.status)}
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(application.status)}
                          >
                            {getStatusLabel(application.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Application Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {/* Application Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Submitted</p>
                            <p className="font-semibold">
                              {application.submitted_at 
                                ? new Date(application.submitted_at).toLocaleDateString()
                                : 'Not submitted'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-semibold">
                              {application.requires_documents ? 'Documents Required' : 'Complete'}
                            </p>
                          </div>
                        </div>

                        {/* Missing Fields */}
                        {missingFields.length > 0 && (
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm font-medium text-orange-800 mb-1">
                              Missing Information:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {missingFields.map((field: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs text-orange-700">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {application.status === 'draft' && role === 'student' && (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowDetailsDialog(true);
                              }}
                            >
                              Continue Application
                            </Button>
                          )}
                          {role === 'university_official' && (application.status === 'submitted' || application.status === 'under_review') && (
                            <>
                              <Button size="sm" variant="outline">
                                Accept
                              </Button>
                              <Button size="sm" variant="outline">
                                Request Documents
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/dashboard/chat')}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          {application.status === 'accepted' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download Offer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {role !== 'university_official' && (
          <TabsContent value="draft">
            <div className="space-y-4">
              {filterApplicationsByStatus('draft').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No draft applications
                  </CardContent>
                </Card>
              ) : (
                filterApplicationsByStatus('draft').map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{getProgramName(application)}</h3>
                          <p className="text-sm text-muted-foreground">{getUniversityName(application)}</p>
                        </div>
                        <Button size="sm">Continue</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        )}

        <TabsContent value="submitted">
          <div className="space-y-4">
            {filterApplicationsByStatus('submitted').length === 0 && filterApplicationsByStatus('under_review').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No submitted applications
                </CardContent>
              </Card>
            ) : (
              [...filterApplicationsByStatus('submitted'), ...filterApplicationsByStatus('under_review')].map((application) => (
                <Card key={application.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{getProgramName(application)}</h3>
                        <p className="text-sm text-muted-foreground">{getUniversityName(application)}</p>
                        {role === 'university_official' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Student: {getStudentName(application)}
                          </p>
                        )}
                      </div>
                      <Badge>{getStatusLabel(application.status)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="accepted">
          <div className="space-y-4">
            {filterApplicationsByStatus('accepted').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No accepted applications
                </CardContent>
              </Card>
            ) : (
              filterApplicationsByStatus('accepted').map((application) => {
                const paymentDueDate = application.application_data?.payment_due_date
                  ? new Date(application.application_data.payment_due_date).toLocaleDateString()
                  : null;

                return (
                <Card key={application.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{getProgramName(application)}</h3>
                        <p className="text-sm text-muted-foreground">{getUniversityName(application)}</p>
                        {role === 'university_official' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Student: {getStudentName(application)}
                          </p>
                        )}
                        {role === 'student' && paymentDueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Payment due by {paymentDueDate}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                        {role === 'student' && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Offer Letter
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        completionPercentage={completionPercentage}
        action="apply"
      />

      {selectedApplication && (
        <ApplicationDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          application={selectedApplication}
          userRole={role || 'student'}
          onStatusUpdate={fetchApplications}
        />
      )}
    </div>
  );
};

export default Applications;
