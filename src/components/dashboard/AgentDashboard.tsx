import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AgentData {
  id: string;
  verification_status: string;
  institution_name: string | null;
}

interface Student {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_completion_status: string;
}

const AgentDashboard = () => {
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setAgentData(agent);

      if (agent.verification_status === 'approved') {
        await fetchManagedStudents(agent.id);
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagedStudents = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_students')
        .select(`
          student_id,
          students!inner(
            id,
            user_id,
            profile_completion_status,
            users!inner(
              email,
              first_name,
              last_name
            )
          )
        `)
        .eq('agent_id', agentId);

      if (error) throw error;

      const studentsList = data?.map((item: any) => ({
        id: item.students.id,
        user_id: item.students.user_id,
        first_name: item.students.users.first_name,
        last_name: item.students.users.last_name,
        email: item.students.users.email,
        profile_completion_status: item.students.profile_completion_status
      })) || [];

      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching managed students:', error);
    }
  };

  const handleAddStudent = async () => {
    if (!agentData || !studentEmail) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', studentEmail)
        .single();

      if (userError || !userData) {
        toast({
          title: 'Student not found',
          description: 'No student found with this email address',
          variant: 'destructive',
        });
        return;
      }

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (studentError || !studentData) {
        toast({
          title: 'Not a student',
          description: 'This user is not registered as a student',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('agent_students')
        .insert({
          agent_id: agentData.id,
          student_id: studentData.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Student added successfully',
      });

      setAddStudentOpen(false);
      setStudentEmail('');
      await fetchManagedStudents(agentData.id);
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add student',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agentData || agentData.verification_status !== 'approved') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your agent account is pending verification. You will be able to access the full dashboard once your account is approved by an administrator.
              </AlertDescription>
            </Alert>
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">What happens next?</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Our team will review your registration details</li>
                <li>Verification typically takes 1-2 business days</li>
                <li>You'll receive an email notification once approved</li>
                <li>After approval, you can manage students and applications</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {agentData.institution_name || 'Agent'} 👋
        </h1>
        <p className="text-primary-foreground/90">
          Manage your students and help them achieve their academic goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Managed Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.filter(s => s.profile_completion_status === 'complete').length}
                </p>
                <p className="text-sm text-muted-foreground">Complete Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.filter(s => s.profile_completion_status === 'incomplete').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Students</CardTitle>
          <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Student</DialogTitle>
                <DialogDescription>
                  Enter the email address of the student you want to manage
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Student Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@email.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddStudent} className="w-full">
                  Add Student
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students added yet</p>
              <p className="text-sm">Click "Add Student" to start managing students</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Profile Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.profile_completion_status === 'complete'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {student.profile_completion_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dashboard/applications?student=${student.id}`)}
                      >
                        View Applications
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDashboard;