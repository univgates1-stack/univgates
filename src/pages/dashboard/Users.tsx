import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye, Loader2, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StudentInformationCard } from '@/components/ApplicationDetailsDialog';
import type { Database } from '@/integrations/supabase/types';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface UniversityOfficial extends User {
  type: 'official';
  status: string;
  department: string | null;
  authorized_person_name: string | null;
  authorized_person_email: string | null;
  contact_phone: string | null;
  direct_phone: string | null;
  position_title: string | null;
  university_id: string | null;
  official_id: string;
}

interface Agent extends User {
  type: 'agent';
  institution_name: string | null;
  role_title: string | null;
  verification_status: string;
  company_number: string | null;
  contact_phone: string | null;
  country: string | null;
  agency_license_number: string | null;
  company_name: string | null;
  agent_id: string;
}

interface Student extends User {
  type: 'student';
  profile_completion_status: string | null;
  date_of_birth: string | null;
  country_of_origin: string | null;
  current_study_level: string | null;
  student_id: string;
}

type SelectedUser = UniversityOfficial | Agent | Student;

interface UniversityOption {
  id: string;
  name: string;
}

type RawOfficialRecord = Database['public']['Tables']['university_officials']['Row'] & {
  users?: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'first_name' | 'last_name'> | null;
};

type RawAgentRecord = Database['public']['Tables']['agents']['Row'] & {
  users?: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'first_name' | 'last_name'> | null;
};

type RawStudentRecord = Database['public']['Tables']['students']['Row'] & {
  users?: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'first_name' | 'last_name'> | null;
};

const Users = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [universityOfficials, setUniversityOfficials] = useState<UniversityOfficial[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [savingDetails, setSavingDetails] = useState(false);
  const [officialForm, setOfficialForm] = useState({
    authorized_person_name: '',
    authorized_person_email: '',
    department: '',
    position_title: '',
    contact_phone: '',
    direct_phone: '',
    university_id: '',
  });
  const [agentForm, setAgentForm] = useState({
    institution_name: '',
    role_title: '',
    contact_phone: '',
    company_number: '',
    company_name: '',
    agency_license_number: '',
    country: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAllUsers();
    loadUniversities();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      const [officialsResponse, agentsResponse, studentsResponse] = await Promise.all([
        supabase
          .from('university_officials')
          .select('*, users:users!university_officials_user_id_fkey(id, email, first_name, last_name)'),
        supabase
          .from('agents')
          .select('*, users:users!agents_user_id_fkey(id, email, first_name, last_name)'),
        supabase
          .from('students')
          .select('*, users:users!students_user_id_fkey(id, email, first_name, last_name)')
      ]);

      if (officialsResponse.error) throw officialsResponse.error;
      if (agentsResponse.error) throw agentsResponse.error;
      if (studentsResponse.error) throw studentsResponse.error;

      const rawOfficials = (officialsResponse.data ?? []) as RawOfficialRecord[];
      const officials = rawOfficials.map((official) => ({
        type: 'official' as const,
        id: official.user_id,
        email: official.users?.email || '',
        first_name: official.users?.first_name,
        last_name: official.users?.last_name,
        status: official.status,
        department: official.department,
        authorized_person_name: official.authorized_person_name,
        authorized_person_email: official.authorized_person_email,
        contact_phone: official.contact_phone,
        direct_phone: official.direct_phone,
        position_title: official.position_title,
        university_id: official.university_id,
        official_id: official.id
      })) || [];

      const rawAgents = (agentsResponse.data ?? []) as RawAgentRecord[];
      const agentsList = rawAgents.map((agent) => ({
        type: 'agent' as const,
        id: agent.user_id,
        email: agent.users?.email || '',
        first_name: agent.users?.first_name,
        last_name: agent.users?.last_name,
        institution_name: agent.institution_name,
        role_title: agent.role_title,
        verification_status: agent.verification_status,
        company_number: agent.company_number,
        contact_phone: agent.contact_phone,
        country: agent.country,
        company_name: agent.company_name,
        agency_license_number: agent.agency_license_number,
        agent_id: agent.id
      })) || [];

      setUniversityOfficials(officials);
      setAgents(agentsList);
      const rawStudents = (studentsResponse.data ?? []) as RawStudentRecord[];
      const studentsList = rawStudents.map((student) => ({
        type: 'student' as const,
        id: student.user_id,
        email: student.users?.email || '',
        first_name: student.users?.first_name,
        last_name: student.users?.last_name,
        profile_completion_status: student.profile_completion_status,
        date_of_birth: student.date_of_birth,
        country_of_origin: student.country_of_origin,
        current_study_level: student.current_study_level,
        student_id: student.id,
      }));

      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOfficial = async (official: UniversityOfficial) => {
    try {
      const { error } = await supabase
        .from('university_officials')
        .update({ status: 'approved' })
        .eq('user_id', official.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'University official approved successfully',
      });
      
      fetchAllUsers();
    } catch (error) {
      console.error('Error approving official:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve official',
        variant: 'destructive',
      });
    }
  };

  const handleRejectOfficial = async (official: UniversityOfficial) => {
    try {
      const { error } = await supabase
        .from('university_officials')
        .update({ status: 'rejected' })
        .eq('user_id', official.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'University official rejected',
      });
      
      fetchAllUsers();
    } catch (error) {
      console.error('Error rejecting official:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject official',
        variant: 'destructive',
      });
    }
  };

  const handleApproveAgent = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ verification_status: 'approved' })
        .eq('user_id', agent.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Agent approved successfully',
      });
      
      fetchAllUsers();
    } catch (error) {
      console.error('Error approving agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve agent',
        variant: 'destructive',
      });
    }
  };

  const handleRejectAgent = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ verification_status: 'rejected' })
        .eq('user_id', agent.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Agent rejected',
      });
      
      fetchAllUsers();
    } catch (error) {
      console.error('Error rejecting agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject agent',
        variant: 'destructive',
      });
    }
  };

  const openOfficialDetails = (official: UniversityOfficial) => {
    setSelectedUser(official);
    setOfficialForm({
      authorized_person_name: official.authorized_person_name ?? '',
      authorized_person_email: official.authorized_person_email ?? '',
      department: official.department ?? '',
      position_title: official.position_title ?? '',
      contact_phone: official.contact_phone ?? '',
      direct_phone: official.direct_phone ?? '',
      university_id: official.university_id ?? '',
    });
    setViewDialogOpen(true);
  };

  const openAgentDetails = (agent: Agent) => {
    setSelectedUser(agent);
    setAgentForm({
      institution_name: agent.institution_name ?? '',
      role_title: agent.role_title ?? '',
      contact_phone: agent.contact_phone ?? '',
      company_number: agent.company_number ?? '',
      company_name: agent.company_name ?? '',
      agency_license_number: agent.agency_license_number ?? '',
      country: agent.country ?? '',
    });
    setViewDialogOpen(true);
  };

  const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const handleSaveOfficialDetails = async () => {
    if (!selectedUser || selectedUser.type !== 'official') {
      return;
    }

    setSavingDetails(true);
    try {
      const payload = {
        authorized_person_name: toNullable(officialForm.authorized_person_name),
        authorized_person_email: toNullable(officialForm.authorized_person_email),
        department: toNullable(officialForm.department),
        position_title: toNullable(officialForm.position_title),
        contact_phone: toNullable(officialForm.contact_phone),
        direct_phone: toNullable(officialForm.direct_phone),
        university_id: officialForm.university_id ? officialForm.university_id : null,
      };

      const { error } = await supabase
        .from('university_officials')
        .update(payload)
        .eq('id', selectedUser.official_id);

      if (error) throw error;

      toast({
        title: 'Official details updated',
        description: `${selectedUser.first_name ?? ''} ${selectedUser.last_name ?? ''}`.trim() || selectedUser.email,
      });

      setViewDialogOpen(false);
      await fetchAllUsers();
    } catch (error) {
      console.error('Error updating university official:', error);
      toast({
        title: 'Failed to update official',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSaveAgentDetails = async () => {
    if (!selectedUser || selectedUser.type !== 'agent') {
      return;
    }

    setSavingDetails(true);
    try {
      const payload = {
        institution_name: toNullable(agentForm.institution_name),
        role_title: toNullable(agentForm.role_title),
        contact_phone: toNullable(agentForm.contact_phone),
        company_number: toNullable(agentForm.company_number),
        company_name: toNullable(agentForm.company_name),
        agency_license_number: toNullable(agentForm.agency_license_number),
        country: toNullable(agentForm.country),
      };

      const { error } = await supabase
        .from('agents')
        .update(payload)
        .eq('id', selectedUser.agent_id);

      if (error) throw error;

      toast({
        title: 'Agent details updated',
        description: `${selectedUser.first_name ?? ''} ${selectedUser.last_name ?? ''}`.trim() || selectedUser.email,
      });

      setViewDialogOpen(false);
      await fetchAllUsers();
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: 'Failed to update agent',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const renderRoleSpecificDetails = (user: SelectedUser) => {
    if (user.type === 'official') {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="official-name">Authorized person name</Label>
              <Input
                id="official-name"
                value={officialForm.authorized_person_name}
                onChange={(event) =>
                  setOfficialForm((prev) => ({ ...prev, authorized_person_name: event.target.value }))
                }
                placeholder="Name of the authorized university contact"
              />
            </div>
            <div>
              <Label htmlFor="official-email">Authorized person email</Label>
              <Input
                id="official-email"
                type="email"
                value={officialForm.authorized_person_email}
                onChange={(event) =>
                  setOfficialForm((prev) => ({ ...prev, authorized_person_email: event.target.value }))
                }
                placeholder="Email for official correspondence"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="official-department">Department</Label>
              <Input
                id="official-department"
                value={officialForm.department}
                onChange={(event) =>
                  setOfficialForm((prev) => ({ ...prev, department: event.target.value }))
                }
                placeholder="Admissions, International Office, …"
              />
            </div>
            <div>
              <Label htmlFor="official-title">Position title</Label>
              <Input
                id="official-title"
                value={officialForm.position_title}
                onChange={(event) =>
                  setOfficialForm((prev) => ({ ...prev, position_title: event.target.value }))
                }
                placeholder="Director, Coordinator, …"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="official-phone">Primary phone</Label>
              <Input
                id="official-phone"
                value={officialForm.contact_phone}
                onChange={(event) =>
                  setOfficialForm((prev) => ({ ...prev, contact_phone: event.target.value }))
                }
                placeholder="+1 555 0100"
              />
            </div>
            <div>
              <Label htmlFor="official-direct-phone">Direct phone</Label>
              <Input
                id="official-direct-phone"
                value={officialForm.direct_phone}
                onChange={(event) =>
                  setOfficialForm((prev) => ({ ...prev, direct_phone: event.target.value }))
                }
                placeholder="Optional direct extension"
              />
            </div>
          </div>

          <div>
            <Label>Associated university</Label>
            <Select
              value={officialForm.university_id ? officialForm.university_id : 'unassigned'}
              onValueChange={(value) =>
                setOfficialForm((prev) => ({
                  ...prev,
                  university_id: value === 'unassigned' ? '' : value,
                }))
              }
            >
              <SelectTrigger id="official-university">
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (user.type === 'agent') {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="agent-institution">Institution / organisation</Label>
              <Input
                id="agent-institution"
                value={agentForm.institution_name}
                onChange={(event) =>
                  setAgentForm((prev) => ({ ...prev, institution_name: event.target.value }))
                }
                placeholder="Agency or institution name"
              />
            </div>
            <div>
              <Label htmlFor="agent-role">Role / title</Label>
              <Input
                id="agent-role"
                value={agentForm.role_title}
                onChange={(event) =>
                  setAgentForm((prev) => ({ ...prev, role_title: event.target.value }))
                }
                placeholder="Education consultant, Director, …"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="agent-phone">Contact number</Label>
              <Input
                id="agent-phone"
                value={agentForm.contact_phone}
                onChange={(event) =>
                  setAgentForm((prev) => ({ ...prev, contact_phone: event.target.value }))
                }
                placeholder="Primary contact number"
              />
            </div>
            <div>
              <Label htmlFor="agent-country">Country</Label>
              <Input
                id="agent-country"
                value={agentForm.country}
                onChange={(event) =>
                  setAgentForm((prev) => ({ ...prev, country: event.target.value }))
                }
                placeholder="Country of operation"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="agent-company-name">Company name</Label>
              <Input
                id="agent-company-name"
                value={agentForm.company_name}
                onChange={(event) =>
                  setAgentForm((prev) => ({ ...prev, company_name: event.target.value }))
                }
                placeholder="Registered company name"
              />
            </div>
            <div>
              <Label htmlFor="agent-company-number">Company number</Label>
              <Input
                id="agent-company-number"
                value={agentForm.company_number}
                onChange={(event) =>
                  setAgentForm((prev) => ({ ...prev, company_number: event.target.value }))
                }
                placeholder="Business registration number"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="agent-license">Agency licence / accreditation</Label>
            <Textarea
              id="agent-license"
              value={agentForm.agency_license_number}
              onChange={(event) =>
                setAgentForm((prev) => ({ ...prev, agency_license_number: event.target.value }))
              }
              placeholder="Enter licence information"
              className="min-h-[80px]"
            />
          </div>
        </div>
      );
    }

    if (user.type === 'student') {
      return (
        <StudentInformationCard studentId={user.student_id} canViewEmail />
      );
    }

    return null;
  };

  const loadUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      const formatted = (data ?? []) as { id: string; name: string }[];
      setUniversities(formatted.map((uni) => ({ id: uni.id, name: uni.name })));
    } catch (error) {
      console.error('Error loading universities list:', error);
    }
  };

  const filteredOfficials = universityOfficials.filter(
    (official) =>
      official.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      official.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      official.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAgents = agents.filter(
    (agent) =>
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(
    (student) =>
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage university officials, agents, and students</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="officials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="officials">
            University Officials ({universityOfficials.length})
          </TabsTrigger>
          <TabsTrigger value="agents">
            Agents ({agents.length})
          </TabsTrigger>
          <TabsTrigger value="students">
            Students ({students.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="officials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>University Officials</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOfficials.map((official) => (
                    <TableRow key={official.id}>
                      <TableCell>
                        {official.first_name} {official.last_name}
                      </TableCell>
                      <TableCell>{official.email}</TableCell>
                      <TableCell>{official.department || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            official.status === 'approved'
                              ? 'default'
                              : official.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {official.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openOfficialDetails(official)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {official.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveOfficial(official)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectOfficial(official)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        {agent.first_name} {agent.last_name}
                      </TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell>{agent.institution_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            agent.verification_status === 'approved'
                              ? 'default'
                              : agent.verification_status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {agent.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAgentDetails(agent)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {agent.verification_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveAgent(agent)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectAgent(agent)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Study Level</TableHead>
                    <TableHead>Profile Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.current_study_level || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.profile_completion_status === 'complete'
                              ? 'default'
                              : student.profile_completion_status === 'incomplete'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {student.profile_completion_status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(student);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review onboarding details</DialogTitle>
            <DialogDescription>
              Update profile information before approving or rejecting the account.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Full name</Label>
                  <Input
                    value={`${selectedUser.first_name ?? ''} ${selectedUser.last_name ?? ''}`.trim() || 'Not provided'}
                    disabled
                  />
                </div>
                <div>
                  <Label>Email address</Label>
                  <Input value={selectedUser.email} disabled />
                </div>
              </div>

              {renderRoleSpecificDetails(selectedUser)}
            </div>
          )}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              disabled={savingDetails}
            >
              Close
            </Button>
            {selectedUser && selectedUser.type !== 'student' && (
              <Button
                type="button"
                onClick={selectedUser.type === 'official' ? handleSaveOfficialDetails : handleSaveAgentDetails}
                disabled={savingDetails}
              >
                {savingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
