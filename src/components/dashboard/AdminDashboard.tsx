import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Building2,
  CheckCircle,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquare,
  RefreshCw,
  School,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  Clock,
  Mail,
  Phone,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { useTranslation } from 'react-i18next';

interface SystemStats {
  totalStudents: number;
  totalAgents: number;
  totalOfficials: number;
  totalUniversities: number;
  totalPrograms: number;
  totalApplications: number;
  pendingApprovals: number;
}

type UniversityOfficialRow = Database['public']['Tables']['university_officials']['Row'];
type AgentRow = Database['public']['Tables']['agents']['Row'];
type ApplicationRow = Database['public']['Tables']['applications']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type UniversityRow = Database['public']['Tables']['universities']['Row'];
type TranslationRow = Database['public']['Tables']['translations']['Row'];

type UniversityOfficialWithRelations = UniversityOfficialRow & {
  users?: Pick<UserRow, 'id' | 'first_name' | 'last_name' | 'email'> | null;
  universities?: Pick<UniversityRow, 'name'> | null;
};

type AgentWithRelations = AgentRow & {
  users?: Pick<UserRow, 'id' | 'first_name' | 'last_name' | 'email'> | null;
};

type ProgramNameContainer = {
  translations?: Array<Pick<TranslationRow, 'language_code' | 'translated_text'>> | null;
} | null;

type ProgramWithRelations = Database['public']['Tables']['programs']['Row'] & {
  universities?: Pick<UniversityRow, 'name'> | null;
  name?: ProgramNameContainer;
};

type StudentWithRelations = StudentRow & {
  users?: Pick<UserRow, 'first_name' | 'last_name'> | null;
};

type ApplicationWithRelations = ApplicationRow & {
  programs?: ProgramWithRelations | null;
  students?: StudentWithRelations | null;
};

interface PendingOfficial {
  recordId: string;
  userId: string;
  fullName: string;
  email: string;
  universityName: string;
  department: string | null;
  submittedAt: string | null;
  status: string;
}

interface PendingAgent {
  recordId: string;
  userId: string;
  fullName: string;
  email: string;
  institutionName: string | null;
  roleTitle: string | null;
  country: string | null;
  submittedAt: string | null;
  verificationStatus: string | null;
}

interface RecentApplication {
  id: string;
  studentName: string;
  programName: string;
  universityName: string | null;
  status: string;
  submittedAt: string | null;
}

interface ContactRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  interestedProgram: string | null;
  submittedAt: string;
}

const getPreferredTranslation = (container?: ProgramNameContainer) => {
  const translations = container?.translations;
  if (!translations || translations.length === 0) return null;
  const english = translations.find((item) => item.language_code?.toLowerCase() === 'en');
  return english?.translated_text ?? translations[0]?.translated_text ?? null;
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'approved':
    case 'accepted':
      return 'default' as const;
    case 'pending':
    case 'submitted':
    case 'under_review':
      return 'secondary' as const;
    case 'rejected':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalStudents: 0,
    totalAgents: 0,
    totalOfficials: 0,
    totalUniversities: 0,
    totalPrograms: 0,
    totalApplications: 0,
    pendingApprovals: 0,
  });
  const [pendingOfficials, setPendingOfficials] = useState<PendingOfficial[]>([]);
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [processingRequest, setProcessingRequest] = useState<{ type: 'official' | 'agent'; id: string } | null>(null);

  const loadDashboard = useCallback(
    async (options?: { initial?: boolean }) => {
      const isInitial = options?.initial ?? false;
      if (isInitial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const [
          studentsRes,
          agentsRes,
          officialsRes,
          universitiesRes,
          programsRes,
          applicationsRes,
          pendingOfficialsRes,
          pendingAgentsRes,
          contactFormsRes,
          recentApplicationsRes,
        ] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('agents').select('id', { count: 'exact', head: true }),
          supabase.from('university_officials').select('id', { count: 'exact', head: true }),
          supabase.from('universities').select('id', { count: 'exact', head: true }),
          supabase.from('programs').select('id', { count: 'exact', head: true }),
          supabase.from('applications').select('id', { count: 'exact', head: true }),
          supabase
            .from('university_officials')
            .select(
              `
                id,
                user_id,
                status,
                department,
                authorized_person_email,
                authorized_person_name,
                contact_phone,
                direct_phone,
                position_title,
                created_at,
                users:users!university_officials_user_id_fkey ( id, first_name, last_name, email ),
                universities:university_id ( name )
              `
            )
            .eq('status', 'pending')
            .order('created_at', { ascending: true }),
          supabase
            .from('agents')
            .select(
              `
                id,
                user_id,
                institution_name,
                role_title,
                country,
                verification_status,
                created_at,
                users:users!agents_user_id_fkey ( id, first_name, last_name, email )
              `
            )
            .eq('verification_status', 'pending')
            .order('created_at', { ascending: true }),
          supabase
            .from('contact_forms')
            .select('*')
            .order('submitted_at', { ascending: false }),
          supabase
            .from('applications')
            .select(
              `
                id,
                status,
                submitted_at,
                programs!inner (
                  id,
                  name_id,
                  universities ( name ),
                  name:translatable_strings!programs_name_id_fkey (
                    translations ( language_code, translated_text )
                  )
                ),
                students!inner (
                  id,
                  users (
                    first_name,
                    last_name
                  )
                )
              `
            )
            .order('submitted_at', { ascending: false, nullsFirst: false })
            .limit(6),
        ]);

        const requiredResponses = [
          studentsRes,
          agentsRes,
          officialsRes,
          universitiesRes,
          programsRes,
          applicationsRes,
        ] as const;

        const failedRequired = requiredResponses.find((response) => response.error);
        if (failedRequired?.error) {
          throw failedRequired.error;
        }

        let pendingOfficialCount = 0;
        if (pendingOfficialsRes.error) {
          console.error('Error loading pending university officials:', pendingOfficialsRes.error);
          setPendingOfficials([]);
        } else {
          const officialsData = (pendingOfficialsRes.data ?? []) as UniversityOfficialWithRelations[];
          const transformedOfficials: PendingOfficial[] = officialsData.map((item) => {
            const user = item.users ?? {};
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || 'Unnamed Official';
            return {
              recordId: item.id,
              userId: item.user_id,
              fullName,
              email: user.email ?? '—',
              universityName: item.universities?.name ?? 'Unassigned University',
              department: item.department ?? null,
              submittedAt: item.created_at ?? null,
              status: item.status ?? 'pending',
            } satisfies PendingOfficial;
          });

          pendingOfficialCount = transformedOfficials.length;
          setPendingOfficials(transformedOfficials);
        }

        let pendingAgentCount = 0;
        if (pendingAgentsRes.error) {
          console.error('Error loading pending agents:', pendingAgentsRes.error);
          setPendingAgents([]);
        } else {
          const agentsData = (pendingAgentsRes.data ?? []) as AgentWithRelations[];
          const transformedAgents: PendingAgent[] = agentsData.map((item) => {
            const user = item.users ?? {};
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || 'Unnamed Agent';
            return {
              recordId: item.id,
              userId: item.user_id,
              fullName,
              email: user.email ?? '—',
              institutionName: item.institution_name ?? null,
              roleTitle: item.role_title ?? null,
              country: item.country ?? null,
              submittedAt: item.created_at ?? null,
              verificationStatus: item.verification_status ?? 'pending',
            } satisfies PendingAgent;
          });

          pendingAgentCount = transformedAgents.length;
          setPendingAgents(transformedAgents);
        }

        if (contactFormsRes.error) {
          console.error('Error loading contact forms:', contactFormsRes.error);
          setContactRequests([]);
        } else {
          const contactData = (contactFormsRes.data ?? []) as Database['public']['Tables']['contact_forms']['Row'][];
          const formattedContacts: ContactRequest[] = contactData.map((entry) => ({
            id: entry.id,
            fullName: entry.full_name,
            email: entry.email,
            phone: entry.phone_number,
            interestedProgram: entry.interested_program,
            submittedAt: entry.submitted_at,
          }));
          setContactRequests(formattedContacts);
        }

        if (recentApplicationsRes.error) {
          console.error('Error loading recent applications:', recentApplicationsRes.error);
          setRecentApplications([]);
        } else {
          const applicationsData = (recentApplicationsRes.data ?? []) as ApplicationWithRelations[];
          const transformedApplications: RecentApplication[] = applicationsData.map((application) => {
            const program = application.programs ?? {};
            const programName = getPreferredTranslation(program.name) ?? 'Program';
            const studentUser = application.students?.users ?? {};
            const studentName = [studentUser.first_name, studentUser.last_name].filter(Boolean).join(' ').trim() || 'Student';

            return {
              id: application.id,
              status: application.status ?? 'draft',
              submittedAt: application.submitted_at ?? null,
              programName,
              universityName: program.universities?.name ?? null,
              studentName,
            } satisfies RecentApplication;
          });

          setRecentApplications(transformedApplications);
        }

        setSystemStats({
          totalStudents: studentsRes.count ?? 0,
          totalAgents: agentsRes.count ?? 0,
          totalOfficials: officialsRes.count ?? 0,
          totalUniversities: universitiesRes.count ?? 0,
          totalPrograms: programsRes.count ?? 0,
          totalApplications: applicationsRes.count ?? 0,
          pendingApprovals: pendingOfficialCount + pendingAgentCount,
        });
      } catch (error) {
        console.error('Error loading admin dashboard:', error);
        toast({
          title: 'Unable to load admin dashboard',
          description: error instanceof Error ? error.message : 'Please try refreshing the page.',
          variant: 'destructive',
        });
      } finally {
        if (isInitial) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadDashboard({ initial: true });
  }, [loadDashboard]);

  const statsTiles = useMemo(
    () => [
      {
        label: 'Students',
        value: systemStats.totalStudents,
        icon: GraduationCap,
        iconClass: 'bg-blue-100 text-blue-600',
      },
      {
        label: 'Agents',
        value: systemStats.totalAgents,
        icon: Users,
        iconClass: 'bg-purple-100 text-purple-600',
      },
      {
        label: 'University Officials',
        value: systemStats.totalOfficials,
        icon: ShieldCheck,
        iconClass: 'bg-emerald-100 text-emerald-600',
      },
      {
        label: 'Universities',
        value: systemStats.totalUniversities,
        icon: Building2,
        iconClass: 'bg-orange-100 text-orange-600',
      },
      {
        label: 'Programs',
        value: systemStats.totalPrograms,
        icon: BookOpen,
        iconClass: 'bg-amber-100 text-amber-600',
      },
      {
        label: 'Applications',
        value: systemStats.totalApplications,
        icon: FileText,
        iconClass: 'bg-sky-100 text-sky-600',
      },
    ],
    [systemStats]
  );

  const handleOfficialStatusChange = async (official: PendingOfficial, status: 'approved' | 'rejected') => {
    setProcessingRequest({ type: 'official', id: official.recordId });
    try {
      const { error } = await supabase
        .from('university_officials')
        .update({ status })
        .eq('id', official.recordId);

      if (error) throw error;

      toast({
        title: `University official ${status === 'approved' ? 'approved' : 'rejected'}`,
        description: official.fullName,
      });

      await loadDashboard();
    } catch (error) {
      console.error(`Error updating university official (${official.recordId})`, error);
      toast({
        title: 'Unable to update official status',
        description: error instanceof Error ? error.message : 'Please retry in a moment.',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleAgentStatusChange = async (agent: PendingAgent, status: 'approved' | 'rejected') => {
    setProcessingRequest({ type: 'agent', id: agent.recordId });
    try {
      const { error } = await supabase
        .from('agents')
        .update({ verification_status: status })
        .eq('id', agent.recordId);

      if (error) throw error;

      toast({
        title: `Agent ${status === 'approved' ? 'approved' : 'rejected'}`,
        description: agent.fullName,
      });

      await loadDashboard();
    } catch (error) {
      console.error(`Error updating agent (${agent.recordId})`, error);
      toast({
        title: 'Unable to update agent status',
        description: error instanceof Error ? error.message : 'Please retry in a moment.',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const isProcessing = (type: 'official' | 'agent', id: string) =>
    processingRequest?.type === type && processingRequest.id === id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Administration 🛡️</h1>
          <p className="text-muted-foreground">
            Monitor registrations, approve new partners, and keep UnivGates running smoothly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="py-2 px-3">
            Pending approvals: {systemStats.pendingApprovals}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboard()}
            disabled={loading || refreshing}
          >
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-lg border bg-card" aria-busy>
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">{t('dashboard.admin.loading')}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {statsTiles.map(({ label, value, icon: Icon, iconClass }) => (
              <Card key={label}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-full p-2 ${iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>Review and act on new university officials and agent requests.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="officials" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="officials">
                      University Officials ({pendingOfficials.length})
                    </TabsTrigger>
                    <TabsTrigger value="agents">
                      Agents ({pendingAgents.length})
                    </TabsTrigger>
                    <TabsTrigger value="contacts">
                      Contact Requests ({contactRequests.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="officials" className="space-y-3">
                    {pendingOfficials.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No university officials waiting for review.
                      </div>
                    ) : (
                      pendingOfficials.map((official) => (
                        <div key={official.recordId} className="rounded-lg border p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-primary" />
                                <span className="font-medium">{official.fullName}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{official.email}</p>
                              <div className="text-sm">
                                <span className="font-medium">University:</span>{' '}
                                {official.universityName}
                              </div>
                              {official.department ? (
                                <div className="text-sm text-muted-foreground">
                                  Department: {official.department}
                                </div>
                              ) : null}
                              <div className="text-xs text-muted-foreground">
                                Submitted {formatDate(official.submittedAt)}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={getStatusVariant(official.status)} className="capitalize">
                                {official.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate('/dashboard/users')}
                              >
                                View profile
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleOfficialStatusChange(official, 'approved')}
                                disabled={isProcessing('official', official.recordId)}
                              >
                                {isProcessing('official', official.recordId) ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOfficialStatusChange(official, 'rejected')}
                                disabled={isProcessing('official', official.recordId)}
                              >
                                {isProcessing('official', official.recordId) ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <UserX className="mr-2 h-4 w-4" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="agents" className="space-y-3">
                    {pendingAgents.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No agents awaiting approval right now.
                      </div>
                    ) : (
                      pendingAgents.map((agent) => (
                        <div key={agent.recordId} className="rounded-lg border p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-medium">{agent.fullName}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{agent.email}</p>
                              <div className="text-sm">
                                <span className="font-medium">Institution:</span>{' '}
                                {agent.institutionName ?? 'Not provided'}
                              </div>
                              {agent.roleTitle ? (
                                <div className="text-sm text-muted-foreground">
                                  Role: {agent.roleTitle}
                                </div>
                              ) : null}
                              <div className="text-xs text-muted-foreground">
                                Submitted {formatDate(agent.submittedAt)}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={getStatusVariant(agent.verificationStatus ?? 'pending')} className="capitalize">
                                {agent.verificationStatus ?? 'pending'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate('/dashboard/users')}
                              >
                                View profile
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAgentStatusChange(agent, 'approved')}
                                disabled={isProcessing('agent', agent.recordId)}
                              >
                                {isProcessing('agent', agent.recordId) ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAgentStatusChange(agent, 'rejected')}
                                disabled={isProcessing('agent', agent.recordId)}
                              >
                                {isProcessing('agent', agent.recordId) ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <UserX className="mr-2 h-4 w-4" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="contacts" className="space-y-3">
                    {contactRequests.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No contact submissions yet.
                      </div>
                    ) : (
                      contactRequests.map((contact) => (
                        <div key={contact.id} className="rounded-lg border p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                              <p className="font-semibold">{contact.fullName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <a href={`mailto:${contact.email}`} className="hover:underline">
                                  {contact.email}
                                </a>
                              </div>
                              {contact.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <a href={`tel:${contact.phone}`} className="hover:underline">
                                    {contact.phone}
                                  </a>
                                </div>
                              )}
                              {contact.interestedProgram && (
                                <p className="text-sm text-muted-foreground">
                                  Interested in: {contact.interestedProgram}
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Submitted {new Date(contact.submittedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Latest Applications
                </CardTitle>
                <CardDescription>Track recent submissions and jump straight into review.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentApplications.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No recent applications to review.
                  </div>
                ) : (
                  recentApplications.map((application) => (
                    <div key={application.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusVariant(application.status)} className="capitalize">
                              {application.status}
                            </Badge>
                            <span className="font-medium">{application.programName}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {application.universityName ?? 'University'} • {application.studentName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Submitted {formatDate(application.submittedAt)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/dashboard/applications', { state: { focusApplicationId: application.id } })}
                        >
                          View details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate('/dashboard/users')}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-muted-foreground">Approve accounts and update records</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate('/dashboard/universities')}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-green-100 p-2 text-green-600">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Universities</p>
                  <p className="text-sm text-muted-foreground">Edit profiles and onboard partners</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate('/dashboard/programs')}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Programs</p>
                  <p className="text-sm text-muted-foreground">Add or update academic offerings</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate('/dashboard/chat')}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-purple-100 p-2 text-purple-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Conversations</p>
                  <p className="text-sm text-muted-foreground">Chat as UnivGates or review threads</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
