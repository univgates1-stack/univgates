// Central form data mapping utilities
import { supabase } from '@/integrations/supabase/client';

export interface MappedFormData {
  userData?: any;
  studentData?: any;
  agentData?: any;
  universityOfficialData?: any;
  addressData?: any;
  phoneData?: any;
}

export const mapOnboardingData = (formData: any, userId: string): MappedFormData => {
  const mapped: MappedFormData = {};

  // User data mapping
  if (formData.firstName || formData.lastName || formData.email) {
    mapped.userData = {
      id: userId,
      first_name: formData.firstName || '',
      last_name: formData.lastName || '',
      email: formData.email || ''
    };
  }

  // Student data mapping
  mapped.studentData = {
    user_id: userId,
    date_of_birth: formData.dateOfBirth ? 
      (formData.dateOfBirth instanceof Date ? 
        formData.dateOfBirth.toISOString().split('T')[0] : 
        formData.dateOfBirth
      ) : null,
    passport_number: formData.passportNumber || null,
    country_of_origin: formData.nationality || null,
    country_of_birth: formData.secondNationality || null,
    has_dual_citizenship: Boolean(formData.hasDualNationality),
    profile_completion_status: 'partial'
  };

  // Address data mapping (only if provided)
  if (formData.street || formData.city || formData.state || formData.postalCode || formData.country) {
    mapped.addressData = {
      user_id: userId,
      street: formData.street || '',
      city: formData.city || '',
      state: formData.state || '',
      postal_code: formData.postalCode || '',
      country: formData.country || '',
      address_type: 'primary'
    };
  }

  // Phone data mapping (only if provided)
  if (formData.phoneNumber || formData.countryCode) {
    mapped.phoneData = {
      user_id: userId,
      phone_number: formData.phoneNumber || '',
      country_code: formData.countryCode || '+90',
      phone_type: 'mobile',
      is_primary: true
    };
  }

  return mapped;
};

export const mapAcademicData = (formData: any, userId: string): MappedFormData => {
  const parsedGrade = typeof formData.graduationGrade === 'string'
    ? Number(formData.graduationGrade)
    : typeof formData.graduationGrade === 'number'
      ? formData.graduationGrade
      : null;

  const normalizedGrade = parsedGrade === null || Number.isNaN(parsedGrade)
    ? null
    : Math.max(0, Math.min(100, parsedGrade));

  return {
    studentData: {
      user_id: userId,
      graduated_school_name: formData.graduatedSchoolName,
      graduation_date: formData.graduationDate ? 
        formData.graduationDate.toISOString().split('T')[0] : null,
      degree_grade: normalizedGrade,
      profile_completion_status: 'complete'
    }
  };
};

export const saveFormData = async (mappedData: MappedFormData): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Save user data
    if (mappedData.userData) {
      const { error: userError } = await supabase
        .from('users')
        .upsert(mappedData.userData, { onConflict: 'id' });
      
      if (userError) throw userError;
    }

    // Save student data
    if (mappedData.studentData) {
      const { error: studentError } = await supabase
        .from('students')
        .upsert(mappedData.studentData, { onConflict: 'user_id' });
      
      if (studentError) throw studentError;
    }

    // Save agent data
    if (mappedData.agentData) {
      const { error: agentError } = await supabase
        .from('agents')
        .upsert(mappedData.agentData, { onConflict: 'user_id' });
      
      if (agentError) throw agentError;
    }

    // Save university official data
    if (mappedData.universityOfficialData) {
      const { error: universityOfficialError } = await supabase
        .from('university_officials')
        .upsert(mappedData.universityOfficialData, { onConflict: 'user_id' });
      
      if (universityOfficialError) throw universityOfficialError;
    }

    // Save address data
    if (mappedData.addressData) {
      const { error: addressError } = await supabase
        .from('addresses')
        .upsert(mappedData.addressData, { 
          onConflict: 'user_id,address_type',
          ignoreDuplicates: false 
        });
      
      if (addressError) throw addressError;
    }

    // Save phone data
    if (mappedData.phoneData) {
      const { error: phoneError } = await supabase
        .from('phones')
        .upsert(mappedData.phoneData, { 
          onConflict: 'user_id,phone_type',
          ignoreDuplicates: false 
        });
      
      if (phoneError) throw phoneError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error saving form data:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to save form data' 
    };
  }
};
