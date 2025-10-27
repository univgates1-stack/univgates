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
import { CheckCircle, XCircle, Eye, Loader2, Search, RefreshCcw, ExternalLink } from 'lucide-react';
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

interface AddressInfo {
  address_type: string | null;
  street: string | null;
  street_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

interface PhoneInfo {
  phone_type: string | null;
  phone_number: string | null;
  is_primary: boolean | null;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  notes: string;
}

interface OfficialProgramSummary {
  id: string;
  name: string;
  tuition_fee: number | null;
  currency: string | null;
  minimum_gpa: number | null;
  languages: string[] | null;
  is_active: boolean | null;
  seats: number | null;
}

interface OnboardingStepRecord {
  step_number: number;
  is_complete: boolean | null;
  saved_data: unknown;
}

interface OfficialOnboardingDetails {
  official: {
    authorized_person_name: string | null;
    authorized_person_email: string | null;
    contact_phone: string | null;
    direct_phone: string | null;
    position_title: string | null;
    department: string | null;
    status: string | null;
  } | null;
  university: {
    id: string;
    name: string;
    website_url: string | null;
    general_contact_email: string | null;
    telephone_number: string | null;
    promotional_video_url: string | null;
    additional_notes: string | null;
    acceptance_criteria: string | null;
    required_documents: Record<string, boolean | string | null> | null;
    logo_public_url: string | null;
    country_name: string | null;
  } | null;
  campusAddress: AddressInfo | null;
  officeAddress: AddressInfo | null;
  phones: PhoneInfo[];
  bankAccounts: BankAccount[];
  materials: {
    id: string;
    file_type: string | null;
    uploaded_at: string | null;
    public_url: string | null;
  }[];
  programs: OfficialProgramSummary[];
  onboardingSteps: OnboardingStepRecord[];
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
  const [officialDetails, setOfficialDetails] = useState<OfficialOnboardingDetails | null>(null);
  const [officialDetailsLoading, setOfficialDetailsLoading] = useState(false);
  const [officialDetailsError, setOfficialDetailsError] = useState<string | null>(null);

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

  const fetchOfficialOnboardingDetails = async (official: UniversityOfficial) => {
    setOfficialDetailsLoading(true);
    setOfficialDetailsError(null);

    try {
      const { data: officialRecord, error: officialError } = await supabase
        .from('university_officials')
        .select(
          `
            id,
            user_id,
            university_id,
            bank_account_number,
            authorized_person_name,
            authorized_person_email,
            contact_phone,
            direct_phone,
            position_title,
            department,
            status,
            universities (
              id,
              name,
              website_url,
              general_contact_email,
              telephone_number,
              promotional_video_url,
              additional_notes,
              acceptance_criteria,
              required_documents,
              logo_url,
              country_id
            )
          `
        )
        .eq('id', official.official_id)
        .maybeSingle();

      if (officialError) {
        throw officialError;
      }

      if (!officialRecord) {
        throw new Error('Official record not found.');
      }

      const targetUserId = officialRecord.user_id;
      const targetUniversityId = officialRecord.university_id;

      const resolveEmptyList = () => Promise.resolve({ data: [] as any[], error: null } as any);
      const resolveEmptySingle = () => Promise.resolve({ data: null as any, error: null } as any);

      const [addressesResult, phonesResult, programsResult, materialsResult, countryResult, onboardingStepsResult] =
        await Promise.all([
          supabase
            .from('addresses')
            .select('address_type, street, street_2, city, state, postal_code, country')
            .eq('user_id', targetUserId),
          supabase
            .from('phones')
            .select('phone_type, phone_number, is_primary')
            .eq('user_id', targetUserId),
          targetUniversityId
            ? supabase
                .from('programs')
                .select(
                  `
                    id,
                    tuition_fee,
                    currency,
                    minimum_gpa,
                    languages,
                    is_active,
                    seats,
                    name:translatable_strings!programs_name_id_fkey(
                      translations(language_code, translated_text)
                    )
                  `
                )
                .eq('university_id', targetUniversityId)
            : resolveEmptyList(),
          targetUniversityId
            ? supabase
                .from('university_presentation_materials')
                .select('id, file_url, file_type, uploaded_at')
                .eq('university_id', targetUniversityId)
            : resolveEmptyList(),
          officialRecord?.universities?.country_id
            ? supabase.from('countries').select('name').eq('id', officialRecord.universities.country_id).maybeSingle()
            : resolveEmptySingle(),
          supabase
            .from('university_onboarding_steps')
            .select('step_number, is_complete, saved_data')
            .eq('official_id', official.official_id)
            .order('step_number'),
        ]);

      const errors = [
        addressesResult.error,
        phonesResult.error,
        programsResult.error,
        materialsResult.error,
        countryResult.error,
        onboardingStepsResult.error,
      ].filter(Boolean);

      if (errors.length) {
        throw errors[0];
      }

      const campusAddress =
        (addressesResult.data ?? []).find((address) => address.address_type === 'university_campus') ?? null;
      const officeAddress =
        (addressesResult.data ?? []).find((address) => address.address_type === 'official_office') ?? null;

      const phoneDetails = (phonesResult.data ?? []).map((phone) => ({
        phone_type: phone.phone_type,
        phone_number: phone.phone_number,
        is_primary: phone.is_primary,
      }));

      let bankAccounts: BankAccount[] = [];
      if (officialRecord.bank_account_number) {
        try {
          const parsed = JSON.parse(officialRecord.bank_account_number);
          if (Array.isArray(parsed)) {
            bankAccounts = parsed.map((entry) => ({
              bankName: entry?.bankName ?? '',
              accountNumber: entry?.accountNumber ?? '',
              iban: entry?.iban ?? '',
              swiftCode: entry?.swiftCode ?? '',
              notes: entry?.notes ?? '',
            }));
          }
        } catch (parseError) {
          console.error('Failed to parse bank accounts JSON:', parseError);
        }
      }

      const extractProgramName = (program: any) => {
        const translations = program?.name?.translations ?? [];
        const english = translations.find((translation: any) => translation.language_code === 'en');
        return english?.translated_text ?? translations[0]?.translated_text ?? 'Program name unavailable';
      };

      const programSummaries =
        programsResult.data?.map((program: any) => ({
          id: program.id,
          name: extractProgramName(program),
          tuition_fee: program.tuition_fee ?? null,
          currency: program.currency ?? null,
          minimum_gpa: program.minimum_gpa ?? null,
          languages: program.languages ?? null,
          is_active: program.is_active ?? null,
          seats: program.seats ?? null,
        })) ?? [];

      const materials =
        materialsResult.data?.map((item: any) => ({
          id: item.id,
          file_type: item.file_type,
          uploaded_at: item.uploaded_at,
          public_url: item.file_url,
        })) ?? [];

      setOfficialDetails({
        official: {
          authorized_person_name: officialRecord.authorized_person_name ?? null,
          authorized_person_email: officialRecord.authorized_person_email ?? null,
          contact_phone: officialRecord.contact_phone ?? null,
          direct_phone: officialRecord.direct_phone ?? null,
          position_title: officialRecord.position_title ?? null,
          department: officialRecord.department ?? null,
          status: officialRecord.status ?? null,
        },
        university: officialRecord.universities
          ? {
              id: officialRecord.universities.id,
              name: officialRecord.universities.name,
              website_url: officialRecord.universities.website_url,
              general_contact_email: officialRecord.universities.general_contact_email,
              telephone_number: officialRecord.universities.telephone_number,
              promotional_video_url: officialRecord.universities.promotional_video_url,
              additional_notes: officialRecord.universities.additional_notes,
              acceptance_criteria: officialRecord.universities.acceptance_criteria,
              required_documents: officialRecord.universities.required_documents,
              logo_public_url: officialRecord.universities.logo_url ?? null,
              country_name: countryResult.data?.name ?? null,
            }
          : null,
        campusAddress,
        officeAddress,
        phones: phoneDetails,
        bankAccounts,
        materials,
        programs: programSummaries,
        onboardingSteps: onboardingStepsResult.data ?? [],
      });
    } catch (error) {
      console.error('Failed to load official onboarding details:', error);
      setOfficialDetailsError(
        error instanceof Error ? error.message : 'Unable to load onboarding details at this time.'
      );
      setOfficialDetails(null);
    } finally {
      setOfficialDetailsLoading(false);
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
    setOfficialDetails(null);
    setOfficialDetailsError(null);
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
    void fetchOfficialOnboardingDetails(official);
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

  const handleDialogOpenChange = (open: boolean) => {
    setViewDialogOpen(open);
    if (!open) {
      setSelectedUser(null);
      setOfficialDetails(null);
      setOfficialDetailsError(null);
      setOfficialDetailsLoading(false);
    }
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
      const requiredDocsEntries =
        officialDetails?.university?.required_documents
          ? Object.entries(officialDetails.university.required_documents).filter(([key, value]) => {
              if (key === 'others') {
                return typeof value === 'string' && value.trim().length > 0;
              }
              if (typeof value === 'boolean') {
                return value;
              }
              return Boolean(value);
            })
          : [];

      const formatAddressLines = (address?: AddressInfo | null) => {
        if (!address) {
          return ['Not provided'];
        }
        const lines: string[] = [];
        const line1 = [address.street, address.street_2].filter(Boolean).join(', ');
        if (line1) lines.push(line1);
        const line2 = [address.city, address.state, address.postal_code].filter(Boolean).join(', ');
        if (line2) lines.push(line2);
        if (address.country) lines.push(address.country);
        return lines.length ? lines : ['Not provided'];
      };

      return (
        <div className="space-y-6">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Onboarding submission</p>
                <p className="text-sm text-muted-foreground">
                  These details come directly from the university official&apos;s onboarding form.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {officialDetailsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {user && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fetchOfficialOnboardingDetails(user)}
                    disabled={officialDetailsLoading}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh details
                  </Button>
                )}
              </div>
            </div>

          {officialDetailsError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {officialDetailsError}
              </div>
            ) : officialDetailsLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : officialDetails ? (
              <div className="space-y-5">
                {officialDetails.university && (
                  <div className="space-y-3 rounded-md border border-border/50 bg-background/60 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h4 className="text-sm font-semibold uppercase text-muted-foreground">University overview</h4>
                      {officialDetails.university.logo_public_url && (
                        <a
                          href={officialDetails.university.logo_public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                        >
                          View uploaded logo <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">University name</p>
                        <p className="text-sm font-medium">{officialDetails.university.name}</p>
                        {officialDetails.university.country_name && (
                          <p className="text-xs text-muted-foreground">{officialDetails.university.country_name}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Website</p>
                        {officialDetails.university.website_url ? (
                          <a
                            href={officialDetails.university.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {officialDetails.university.website_url}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not provided</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">General contact email</p>
                        <p className="text-sm">
                          {officialDetails.university.general_contact_email || (
                            <span className="text-muted-foreground">Not provided</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Primary phone</p>
                        <p className="text-sm">
                          {officialDetails.university.telephone_number || (
                            <span className="text-muted-foreground">Not provided</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Acceptance criteria</p>
                        <p className="text-sm whitespace-pre-line">
                          {officialDetails.university.acceptance_criteria?.trim() || (
                            <span className="text-muted-foreground">Not provided</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Promotional video</p>
                        {officialDetails.university.promotional_video_url ? (
                          <a
                            href={officialDetails.university.promotional_video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View video <ExternalLink className="ml-1 inline h-3 w-3 align-middle" />
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not provided</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1">Additional notes</p>
                      <p className="text-sm whitespace-pre-line">
                        {officialDetails.university.additional_notes?.trim() || (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1">Required documents</p>
                      {requiredDocsEntries.length ? (
                        <ul className="list-disc space-y-1 pl-5 text-sm">
                          {requiredDocsEntries.map(([key, value]) => (
                            <li key={key}>
                              {key === 'others'
                                ? `Other requirements: ${String(value)}`
                                : key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not provided</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-md border border-border/50 bg-background/60 p-4 space-y-3">
                  <h4 className="text-sm font-semibold uppercase text-muted-foreground">Official contact details</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Authorized person</p>
                      <p className="text-sm font-medium">
                        {officialDetails.official?.authorized_person_name ||
                          officialForm.authorized_person_name ||
                          'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Authorized email</p>
                      <p className="text-sm">
                        {officialDetails.official?.authorized_person_email ||
                          officialForm.authorized_person_email ||
                          'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Department</p>
                      <p className="text-sm">
                        {officialDetails.official?.department || officialForm.department || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Position title</p>
                      <p className="text-sm">
                        {officialDetails.official?.position_title || officialForm.position_title || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Primary phone</p>
                      <p className="text-sm">
                        {officialDetails.official?.contact_phone || officialForm.contact_phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Direct phone</p>
                      <p className="text-sm">
                        {officialDetails.official?.direct_phone || officialForm.direct_phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Status</p>
                      <p className="text-sm capitalize">
                        {officialDetails.official?.status || selectedUser?.status || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-border/50 bg-background/60 p-4 space-y-3">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground">Addresses</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Campus</p>
                        <div className="text-sm text-foreground">
                          {formatAddressLines(officialDetails.campusAddress).map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Office</p>
                        <div className="text-sm text-foreground">
                          {formatAddressLines(officialDetails.officeAddress).map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border border-border/50 bg-background/60 p-4 space-y-3">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground">Phone numbers</h4>
                    {officialDetails.phones.length ? (
                      <div className="space-y-2 text-sm">
                        {officialDetails.phones.map((phone, index) => (
                          <div key={`${phone.phone_type}-${index}`} className="flex items-center justify-between">
                            <span className="capitalize">{phone.phone_type || 'other'}</span>
                            <span className="font-medium">{phone.phone_number || 'Not provided'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No phone numbers saved.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-border/50 bg-background/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground">Bank accounts</h4>
                    <span className="text-xs text-muted-foreground">
                      {officialDetails.bankAccounts.length} account
                      {officialDetails.bankAccounts.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {officialDetails.bankAccounts.length ? (
                    <div className="space-y-3">
                      {officialDetails.bankAccounts.map((account, index) => (
                        <div
                          key={`${account.bankName}-${account.accountNumber}-${index}`}
                          className="rounded-md border border-border/40 bg-background p-3 text-sm"
                        >
                          <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                            <span>Account {index + 1}</span>
                            {account.swiftCode && <span>SWIFT: {account.swiftCode}</span>}
                          </div>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Bank</p>
                              <p className="font-medium">{account.bankName || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Account number</p>
                              <p className="font-medium">{account.accountNumber || 'Not provided'}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-xs text-muted-foreground">IBAN</p>
                              <p className="font-medium">{account.iban || 'Not provided'}</p>
                            </div>
                          </div>
                          {account.notes && (
                            <p className="mt-2 text-xs text-muted-foreground">Notes: {account.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No bank accounts captured.</p>
                  )}
                </div>

                <div className="rounded-md border border-border/50 bg-background/60 p-4 space-y-3">
                  <h4 className="text-sm font-semibold uppercase text-muted-foreground">
                    Programs ({officialDetails.programs.length})
                  </h4>
                  {officialDetails.programs.length ? (
                    <div className="space-y-2">
                      {officialDetails.programs.map((program) => (
                        <div
                          key={program.id}
                          className="rounded-md border border-border/40 bg-background px-3 py-2 text-sm"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-medium">{program.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {program.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {program.languages?.length ? (
                              <span>Languages: {program.languages.join(', ')}</span>
                            ) : null}
                            {program.tuition_fee !== null ? (
                              <span>
                                Tuition: {program.tuition_fee.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                                {program.currency || ''}
                              </span>
                            ) : null}
                            {program.minimum_gpa !== null ? <span>Min GPA: {program.minimum_gpa}</span> : null}
                            {typeof program.seats === 'number' ? <span>Seats: {program.seats}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No programs submitted during onboarding.</p>
                  )}
                </div>

                {officialDetails.materials.length ? (
                  <div className="rounded-md border border-border/50 bg-background/60 p-4 space-y-3">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground">Supporting materials</h4>
                    <ul className="space-y-2 text-sm">
                      {officialDetails.materials.map((file) => (
                        <li key={file.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{file.file_type || 'Document'}</p>
                            {file.uploaded_at && (
                              <p className="text-xs text-muted-foreground">
                                Uploaded {new Date(file.uploaded_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          {file.public_url ? (
                            <a
                              href={file.public_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                            >
                              Open <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unavailable</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No onboarding details were found for this university official.
              </p>
            )}
          </div>

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

      <Dialog open={viewDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
