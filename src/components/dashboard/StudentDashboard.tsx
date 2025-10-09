import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  FileText,
  MessageSquare,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useTranslation } from 'react-i18next';

interface DashboardApplication {
  id: string;
  programName: string;
  universityName: string;
  status: string;
  submittedAt: string | null;
  deadline: string | null;
  requiresDocuments: boolean;
}

interface ProgramRecommendation {
  id: string;
  name: string;
  university: string;
  country: string | null;
  tuitionDisplay: string | null;
  applicationDeadline: string | null;
  languages: string[];
}

interface UpcomingDeadline {
  id: string;
  label: string;
  deadline: string;
  daysLeft: number;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { completionPercentage, isComplete, refreshProfileStatus } = useProfileCompletion();

  const [userName, setUserName] = useState('');
  const [applications, setApplications] = useState<DashboardApplication[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [recommendedPrograms, setRecommendedPrograms] = useState<ProgramRecommendation[]>([]);
  const [programsCount, setProgramsCount] = useState<number>(0);
  const [messagesCount, setMessagesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void refreshProfileStatus();
  }, [refreshProfileStatus]);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  useEffect(() => {
    deriveDeadlines(applications);
  }, [applications]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserName('');
        setApplications([]);
        setRecommendedPrograms([]);
        setProgramsCount(0);
        setMessagesCount(0);
        setUpcomingDeadlines([]);
        return;
      }

      const [{ data: userRow, error: userError }, { data: studentRow, error: studentError }] = await Promise.all([
        supabase
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (userError) throw userError;
      if (studentError && studentError.code !== 'PGRST116') throw studentError;

      if (userRow) {
        const combined = [userRow.first_name, userRow.last_name].filter(Boolean).join(' ');
        setUserName((combined || userRow.email || user.email) ?? 'student');
      } else {
        setUserName(user.email ?? 'student');
      }

      const studentId = studentRow?.id ?? null;

      await Promise.all([
        fetchApplications(studentId),
        fetchRecommendedPrograms(),
        fetchProgramCount(),
        fetchMessageCount(user.id),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setApplications([]);
      setRecommendedPrograms([]);
      setProgramsCount(0);
      setMessagesCount(0);
      setUpcomingDeadlines([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async (studentId: string | null) => {
    if (!studentId) {
      setApplications([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          submitted_at,
          requires_documents,
          programs (
            id,
            application_deadline,
            tuition_fee,
            currency,
            languages,
            universities (
              name,
              countries ( name )
            ),
            name:translatable_strings!programs_name_id_fkey (
              translations ( language_code, translated_text )
            )
          )
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const mapped = (data ?? []).map((application) => {
        const program = application.programs;
        const programName = resolveProgramName(program);
        const universityName = program?.universities?.name ?? 'University';
        return {
          id: application.id,
          programName,
          universityName,
          status: application.status ?? 'pending',
          submittedAt: application.submitted_at,
          deadline: program?.application_deadline ?? null,
          requiresDocuments: Boolean(application.requires_documents),
        } satisfies DashboardApplication;
      });

      setApplications(mapped);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    }
  };

  const fetchRecommendedPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          id,
          application_deadline,
          tuition_fee,
          currency,
          languages,
          universities (
            name,
            countries ( name )
          ),
          name:translatable_strings!programs_name_id_fkey (
            translations ( language_code, translated_text )
          )
        `)
        .eq('is_active', true)
        .order('application_deadline', { ascending: true, nullsLast: true })
        .limit(4);

      if (error) throw error;

      const mapped = (data ?? []).map((program) => ({
        id: program.id,
        name: resolveProgramName(program),
        university: program.universities?.name ?? 'University',
        country: program.universities?.countries?.name ?? null,
        tuitionDisplay: formatTuition(program.tuition_fee, program.currency),
        applicationDeadline: program.application_deadline,
        languages: program.languages ?? [],
      }));

      setRecommendedPrograms(mapped);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setRecommendedPrograms([]);
    }
  };

  const fetchProgramCount = async () => {
    try {
      const { count } = await supabase
        .from('programs')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      setProgramsCount(count ?? 0);
    } catch (error) {
      console.error('Error counting programs:', error);
      setProgramsCount(0);
    }
  };

  const fetchMessageCount = async (userId: string) => {
    try {
      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_user_id', userId);

      setMessagesCount(count ?? 0);
    } catch (error) {
      console.error('Error counting messages:', error);
      setMessagesCount(0);
    }
  };

  const deriveDeadlines = (apps: DashboardApplication[]) => {
    const entries = apps
      .map((app) => {
        if (!app.deadline) return null;
        const deadlineDate = new Date(app.deadline);
        if (Number.isNaN(deadlineDate.getTime())) return null;
        const diff = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return null;
        return {
          id: app.id,
          label: `${app.programName} · ${app.universityName}`,
          deadline: deadlineDate.toISOString(),
          daysLeft: diff,
        } as UpcomingDeadline;
      })
      .filter(Boolean) as UpcomingDeadline[];

    entries.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    setUpcomingDeadlines(entries.slice(0, 3));
  };

  const resolveProgramName = (program: any): string => {
    const translations = program?.name?.translations as
      | Array<{ language_code: string; translated_text: string }>
      | undefined;
    if (translations?.length) {
      const english = translations.find((t) => t.language_code?.toLowerCase() === 'en');
      return english?.translated_text || translations[0]?.translated_text || 'Program';
    }
    return program?.name ?? 'Program';
  };

  const formatTuition = (amount: number | null, currency: string | null): string | null => {
    if (amount === null || amount === undefined || !currency) {
      return null;
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return `${amount} ${currency}`;
    }
  };

  const formatDate = useCallback((value: string | null) => {
    if (!value) return t('dashboard.student.deadlinesSection.noDate');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  }, [t]);

  const applicationsCount = applications.length;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground">
        <h1 className="text-3xl font-bold mb-2">
          {t('dashboard.student.heroTitle', { name: userName || t('dashboard.student.defaultName') })}
        </h1>
        <p className="text-primary-foreground/90 mb-4">
          {t('dashboard.student.heroSubtitle')}
        </p>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span>{t('dashboard.common.profileCompletion')}</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/onboarding')}
            disabled={isComplete}
          >
            {isComplete ? t('dashboard.common.viewProfile') : t('dashboard.common.completeProfile')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/programs')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{t('dashboard.student.quickActions.findPrograms')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.student.quickActions.programsAvailable', { count: programsCount })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/applications')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">{t('dashboard.student.quickActions.applications')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.student.quickActions.applicationsActive', { count: applicationsCount })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/chat')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">{t('dashboard.student.quickActions.messages')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.student.quickActions.messagesReceived', { count: messagesCount })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/programs')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">{t('dashboard.student.quickActions.resources')}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.student.quickActions.resourcesSubtitle')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{t('dashboard.student.applicationsSection.title')}</span>
            </CardTitle>
            <CardDescription>{t('dashboard.student.applicationsSection.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.length === 0 && (
                <div className="border rounded-lg p-6 text-center text-muted-foreground">
                  {t('dashboard.student.applicationsSection.empty')}
                </div>
              )}
              {applications.map((app) => (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{app.programName}</h3>
                      <p className="text-sm text-muted-foreground">{app.universityName}</p>
                    </div>
                    <Badge
                      variant={
                        app.status?.toLowerCase().includes('review')
                          ? 'default'
                          : app.status?.toLowerCase().includes('document')
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {app.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {t('dashboard.student.applicationsSection.submittedLabel')}{' '}
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                    </span>
                    <span>
                      {t('dashboard.student.applicationsSection.deadlineLabel')}{' '}
                      {app.deadline ? new Date(app.deadline).toLocaleDateString() : t('dashboard.common.noData')}
                    </span>
                  </div>
                  {app.requiresDocuments && (
                    <Button size="sm" className="mt-2" onClick={() => navigate('/dashboard/applications')}>
                      {t('dashboard.common.uploadDocuments')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{t('dashboard.student.deadlinesSection.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground bg-muted rounded-lg text-center">
                  {t('dashboard.student.deadlinesSection.empty')}
                </div>
              )}
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{deadline.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(deadline.deadline)}</p>
                  </div>
                  <Badge variant={deadline.daysLeft < 30 ? 'destructive' : 'secondary'}>
                    {t('dashboard.common.days', { count: deadline.daysLeft })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{t('dashboard.student.recommendedSection.title')}</span>
          </CardTitle>
          <CardDescription>{t('dashboard.student.recommendedSection.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedPrograms.length === 0 && (
              <div className="border rounded-lg p-6 text-center text-muted-foreground">
                {t('dashboard.student.recommendedSection.empty')}
              </div>
            )}
            {recommendedPrograms.map((program) => (
              <div key={program.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{program.name}</h3>
                    <p className="text-sm text-muted-foreground">{program.university}</p>
                  </div>
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-2 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{program.country ?? t('dashboard.common.locationOnRequest')}</span>
                  </div>
                  {program.tuitionDisplay && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>{program.tuitionDisplay}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(program.applicationDeadline)}</span>
                  </div>
                  {program.languages.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <GraduationCap className="h-3 w-3" />
                      <span>{program.languages.join(', ')}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1" onClick={() => navigate('/dashboard/programs')}>
                    {t('dashboard.common.viewDetails')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/chat')}>
                    {t('dashboard.common.askQuestion')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
