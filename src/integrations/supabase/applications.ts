import { supabase } from '@/integrations/supabase/client';

export interface CreateApplicationInput {
  programId: string;
  studentId: string;
  applicationData?: any;
  requiresDocuments?: boolean;
  missingFields?: string[];
}

export const createApplication = async (input: CreateApplicationInput) => {
  const {
    programId,
    studentId,
    applicationData = {},
    requiresDocuments = false,
    missingFields = [],
  } = input;

  const { data, error } = await supabase
    .from('applications')
    .insert({
      program_id: programId,
      student_id: studentId,
      status: 'draft',
      application_data: applicationData,
      requires_documents: requiresDocuments,
      missing_fields: missingFields,
      submitted_at: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create application');
  }

  return data;
};

export const submitApplication = async (applicationId: string) => {
  const { data, error } = await supabase
    .from('applications')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to submit application');
  }

  return data;
};

export const checkProfileCompleteness = async (studentId: string) => {
  // Fetch student data
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (studentError) throw studentError;

  const missingFields: string[] = [];

  // Check required fields
  if (!student.date_of_birth) missingFields.push('Date of Birth');
  if (!student.country_of_origin) missingFields.push('Country of Origin');
  if (!student.current_study_level) missingFields.push('Current Study Level');

  // Check passport
  const { data: passport } = await supabase
    .from('student_passports')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (!passport || !passport.passport_number) {
    missingFields.push('Passport Information');
  }

  // Check degrees
  const { data: degrees } = await supabase
    .from('student_degrees')
    .select('*')
    .eq('student_id', studentId);

  if (!degrees || degrees.length === 0) {
    missingFields.push('Academic History');
  }

  const isComplete = missingFields.length === 0;
  const completionPercentage = Math.round(
    ((6 - missingFields.length) / 6) * 100
  );

  return {
    isComplete,
    completionPercentage,
    missingFields,
  };
};
