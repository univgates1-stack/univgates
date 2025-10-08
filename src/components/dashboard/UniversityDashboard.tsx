<<<<<<< HEAD
import { useState, useEffect, useMemo } from 'react';
=======
import { useState, useEffect } from 'react';
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { School, Users, FileText, TrendingUp, MessageSquare, Calendar, Globe, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
<<<<<<< HEAD
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const UniversityDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
=======

const UniversityDashboard = () => {
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
  const [universityData, setUniversityData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [programStats, setProgramStats] = useState<any[]>([]);
<<<<<<< HEAD
  const displayName = useMemo(() => {
    const first = universityData?.users?.first_name as string | undefined;
    const last = universityData?.users?.last_name as string | undefined;
    const fullName = [first, last].filter(Boolean).join(' ').trim();
    return fullName || (universityData?.department as string | undefined) || t('dashboard.university.defaultTitle');
  }, [universityData, t]);

  const handleGoToApplications = () => navigate('/dashboard/applications');
  const handleGoToMessages = () => navigate('/dashboard/chat');
  const handleGoToAnalytics = () => navigate('/dashboard');
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchUniversityData();
      await fetchApplicationStats();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const fetchUniversityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: official } = await supabase
          .from('university_officials')
<<<<<<< HEAD
          .select('*, universities(*), users(first_name, last_name)')
=======
          .select('*, universities(*)')
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          .eq('user_id', user.id)
          .single();
        
        if (official) {
          setUniversityData(official);
          // Check if status is 'approved' or similar for verification
          setIsVerified(official.status === 'approved' || official.university_id !== null);
        }
      }
    } catch (error) {
      console.error('Error fetching university data:', error);
    }
  };

  const fetchApplicationStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get university official's university
      const { data: official } = await supabase
        .from('university_officials')
        .select('university_id')
        .eq('user_id', user.id)
        .single();

      if (!official || !official.university_id) return;

      // Fetch all applications for this university's programs
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          *,
          programs!inner(university_id),
          students!inner(
            id,
            users!inner(first_name, last_name)
          )
        `)
        .eq('programs.university_id', official.university_id);

      if (error) throw error;

      // Calculate stats
      const total = applications?.length || 0;
      const pending = applications?.filter(app => app.status === 'submitted' || app.status === 'under_review').length || 0;
      const approved = applications?.filter(app => app.status === 'accepted').length || 0;
      const rejected = applications?.filter(app => app.status === 'rejected').length || 0;

      setStats({
        totalApplications: total,
        pendingReview: pending,
        approved,
        rejected
      });

      // Get recent applications (last 5)
      const recent = applications
        ?.sort((a, b) => {
          const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
          const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5) || [];

      setRecentApplications(recent);

      // Fetch program stats with translatable names
      const { data: programs } = await supabase
        .from('programs')
        .select(`
          id, 
          name_id, 
          seats,
          translatable_strings!programs_name_id_fkey(
            id,
            translations(language_code, translated_text)
          )
        `)
        .eq('university_id', official.university_id);

      if (programs) {
        const programStatsData = programs.map(program => {
          const programApps = applications?.filter(app => app.program_id === program.id) || [];
          const capacity = program.seats || 50;
          const appCount = programApps.length;
          const fillRate = capacity > 0 ? Math.round((appCount / capacity) * 100) : 0;
          
          const translations = (program as any).translatable_strings?.translations || [];
          const enTranslation = translations.find((t: any) => t.language_code === 'en');
          const programName = enTranslation?.translated_text || 'Program';

          return {
            id: program.id,
            name: programName,
            applications: appCount,
            capacity,
            fillRate
          };
        });

        setProgramStats(programStatsData.slice(0, 4)); // Show top 4 programs
      }
    } catch (error) {
      console.error('Error fetching application stats:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
              <div>
<<<<<<< HEAD
                <h2 className="text-xl font-semibold text-amber-900">
                  {t('dashboard.university.pendingTitle')}
                </h2>
                <p className="text-amber-700 mt-1">
                  {t('dashboard.university.pendingDescription')}
                </p>
                <p className="text-amber-600 text-sm mt-2">
                  {t('dashboard.university.pendingNote')}
=======
                <h2 className="text-xl font-semibold text-amber-900">Account Pending Verification</h2>
                <p className="text-amber-700 mt-1">
                  Your university official account is currently under review. We need to verify your institutional affiliation before granting full access.
                </p>
                <p className="text-amber-600 text-sm mt-2">
                  Verification typically takes 2-3 business days. You will receive an email once approved.
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
<<<<<<< HEAD
            <CardTitle>{t('dashboard.university.requirementsTitle')}</CardTitle>
            <CardDescription>{t('dashboard.university.requirementsDescription')}</CardDescription>
=======
            <CardTitle>Verification Requirements</CardTitle>
            <CardDescription>Please ensure you have provided the following information</CardDescription>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
<<<<<<< HEAD
                <span>{t('dashboard.university.requirementsList.officialEmail')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>{t('dashboard.university.requirementsList.departmentInfo')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>{t('dashboard.university.requirementsList.identityVerification')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>{t('dashboard.university.requirementsList.affiliationCheck')}</span>
=======
                <span>Official university email address</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Department/faculty information</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>Identity verification (in progress)</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>Institutional affiliation check</span>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What You'll Get After Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Access to student applications</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Program management dashboard</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Direct communication with agents</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Analytics and reporting tools</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground">
        <h1 className="text-3xl font-bold mb-2">
<<<<<<< HEAD
          {t('dashboard.university.welcome', { name: displayName })}
=======
          Welcome, {universityData?.department || 'University Official'}! 🏛️
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
        </h1>
        <p className="text-primary-foreground/90">
          Manage applications and connect with prospective students from around the world.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Applications</span>
            </CardTitle>
            <CardDescription>Latest student applications requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No recent applications
                </p>
              ) : (
                recentApplications.map((app) => {
                  const studentName = app.students?.users 
                    ? `${app.students.users.first_name} ${app.students.users.last_name}`
                    : 'Unknown Student';
                  
                  const programStat = programStats.find(p => p.id === app.program_id);
                  const programName = programStat?.name || 'Program';
                  
                  return (
                    <div key={app.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{studentName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {programName}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            app.status === 'submitted' || app.status === 'under_review' ? 'default' : 
                            app.requires_documents ? 'destructive' : 'outline'
                          }
                        >
                          {app.status === 'submitted' ? 'Pending Review' : 
                           app.status === 'under_review' ? 'Under Review' :
                           app.requires_documents ? 'Documents Required' : app.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                        </span>
                        <div className="space-x-2">
<<<<<<< HEAD
                          <Button size="sm" variant="outline" onClick={handleGoToApplications}>
                            Review
                          </Button>
                          <Button size="sm" onClick={handleGoToApplications}>
=======
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                          <Button size="sm">
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                            Accept
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Program Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <School className="h-5 w-5" />
              <span>Program Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {programStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No program data available
                </p>
              ) : (
                programStats.map((program, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{program.name}</span>
                      <span className="text-muted-foreground">
                        {program.applications}/{program.capacity}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(program.fillRate, 100)} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{program.fillRate}% capacity</span>
                      <span className={program.fillRate > 100 ? 'text-red-600' : ''}>
                        {program.fillRate > 100 ? 'Oversubscribed' : 'Available'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<<<<<<< HEAD
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={handleGoToApplications}
          role="button"
          tabIndex={0}
        >
=======
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Review Applications</p>
                <p className="text-sm text-muted-foreground">{stats.pendingReview} pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

<<<<<<< HEAD
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={handleGoToMessages}
          role="button"
          tabIndex={0}
        >
=======
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Messages</p>
                <p className="text-sm text-muted-foreground">3 unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

<<<<<<< HEAD
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={handleGoToAnalytics}
          role="button"
          tabIndex={0}
        >
=======
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-sm text-muted-foreground">View reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default UniversityDashboard;
=======
export default UniversityDashboard;
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
