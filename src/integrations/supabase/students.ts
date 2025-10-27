import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { getOrCreateCountryId } from '@/utils/countryUtils';

type UserUpdate = Database['public']['Tables']['users']['Update'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];
type StudentUpdate = Database['public']['Tables']['students']['Update'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type AddressRow = Database['public']['Tables']['addresses']['Row'];
type AddressInsert = Database['public']['Tables']['addresses']['Insert'];
type AddressUpdate = Database['public']['Tables']['addresses']['Update'];
type PhoneRow = Database['public']['Tables']['phones']['Row'];
type PhoneInsert = Database['public']['Tables']['phones']['Insert'];
type PhoneUpdate = Database['public']['Tables']['phones']['Update'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentTypeRow = Database['public']['Tables']['document_types']['Row'];
type StudentExamDocumentRow = Database['public']['Tables']['student_exam_documents']['Row'];

type AddressSnapshot = AddressRow & {
  city?: {
    id: string;
    name: string | null;
    country?: {
      id: string;
      name: string | null;
    } | null;
  } | null;
};

export interface StudentProfileSnapshot {
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    profile_picture_url?: string | null;
    language_preference?: string | null;
  } | null;
  student: StudentRow | null;
  address: AddressSnapshot | null;
  phone: PhoneRow | null;
  examDocuments: StudentExamDocumentRow[];
}

export interface StudentOnboardingData {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | string | null;
  nationality?: string | null;
  hasDualNationality?: boolean | null;
  secondNationality?: string | null;
  passportNumber?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  profileCompletionStatus: string;
}

interface SaveStudentOnboardingOptions {
  userId: string;
  data: StudentOnboardingData;
  profilePictureFile?: File | null;
  nationalDocumentFile?: File | null;
  nationalDocumentTypeName?: string;
  passportDocumentFile?: File | null;
}

const PROFILE_BUCKET = 'profiles';
const DOCUMENTS_BUCKET = 'documents';

const uploadFile = async (bucket: string, path: string, file: File) => {
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const fetchStudentProfileSnapshot = async (userId: string): Promise<StudentProfileSnapshot> => {
  const [{ data: userData, error: userError }, { data: studentData, error: studentError }, { data: addressData, error: addressError }, { data: phoneData, error: phoneError }] = await Promise.all([
    supabase
      .from('users')
      .select('first_name, last_name, email, profile_picture_url, language_preference')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('addresses')
      .select(`
        *,
        city:cities (
          id,
          name,
          country:countries (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .eq('address_type', 'primary')
      .maybeSingle(),
    supabase
      .from('phones')
      .select('*')
      .eq('user_id', userId)
      .eq('phone_type', 'mobile')
      .maybeSingle(),
  ]);

  if (userError) throw new Error(userError.message);
  if (studentError) throw new Error(studentError.message);
  if (addressError && addressError.code !== 'PGRST116') throw new Error(addressError.message);
  if (phoneError && phoneError.code !== 'PGRST116') throw new Error(phoneError.message);

  let examDocuments: StudentExamDocumentRow[] = [];
  if (studentData?.id) {
    const { data: examData, error: examError } = await supabase
      .from('student_exam_documents')
      .select('*')
      .eq('student_id', studentData.id)
      .order('exam_date', { ascending: false });

    if (examError && examError.code !== 'PGRST116') {
      throw new Error(examError.message);
    }

    examDocuments = examData ?? [];
  }

  return {
    user: userData,
    student: studentData,
    address: (addressData as AddressSnapshot | null) ?? null,
    phone: phoneData ?? null,
    examDocuments,
  };
};

const ensureStudentRecord = async (userId: string): Promise<StudentRow> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) return data;

  const insertPayload: StudentInsert = {
    user_id: userId,
    profile_completion_status: 'incomplete',
  };

  const { data: newStudent, error: insertError } = await supabase
    .from('students')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return newStudent;
};

const upsertAddress = async (userId: string, address?: StudentOnboardingData['address']) => {
  if (!address) return;

  const hasValues = [address.street, address.city, address.state, address.postalCode, address.country]
    .some((value) => Boolean(value && value.trim()));

  if (!hasValues) return;

  if (address.country) {
    try {
      await getOrCreateCountryId(address.country);
    } catch (countryError) {
      console.warn('Failed to ensure country exists:', countryError);
    }
  }

  const { data: existing, error } = await supabase
    .from('addresses')
    .select('id')
    .eq('user_id', userId)
    .eq('address_type', 'primary')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  const payload = {
    user_id: userId,
    address_type: 'primary',
    street: address.street?.trim() || null,
    state: address.state?.trim() || null,
    postal_code: address.postalCode?.trim() || null,
    city: address.city?.trim() || null,
    country: address.country?.trim() || null,
  } as (AddressInsert & { city?: string | null; country?: string | null }) | (AddressUpdate & { city?: string | null; country?: string | null });

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('addresses')
      .update(payload)
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const { error: insertError } = await supabase
      .from('addresses')
      .insert(payload as AddressInsert);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
};

const upsertPhone = async (userId: string, countryCode?: string | null, phoneNumber?: string | null) => {
  const normalizedNumber = phoneNumber?.trim();
  const normalizedCode = countryCode?.trim();

  if (!normalizedNumber && !normalizedCode) {
    return;
  }

  const { data: existing, error } = await supabase
    .from('phones')
    .select('id')
    .eq('user_id', userId)
    .eq('phone_type', 'mobile')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  const payload: Partial<PhoneInsert & PhoneUpdate> = {
    user_id: userId,
    phone_type: 'mobile',
    phone_number: normalizedNumber || '',
    country_code: normalizedCode || null,
    is_primary: true,
  };

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('phones')
      .update(payload)
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const { error: insertError } = await supabase
      .from('phones')
      .insert(payload as PhoneInsert);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
};

const uploadNationalDocument = async (
  studentId: string,
  file: File,
  documentTypeName?: string,
) => {
  if (!documentTypeName) return;

  const { data: docType, error: docTypeError } = await supabase
    .from('document_types')
    .select('id')
    .eq('name', documentTypeName)
    .maybeSingle();

  if (docTypeError) {
    throw new Error(docTypeError.message);
  }

  if (!docType?.id) return;

  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .select('id')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (applicationError) {
    throw new Error(applicationError.message);
  }

  if (!application?.id) {
    console.warn('Skipping national document insert because no application is linked to the student.');
    return;
  }

  const fileExt = file.name.split('.').pop();
  const storagePath = `student-documents/${studentId}_${Date.now()}.${fileExt ?? 'pdf'}`;
  const publicUrl = await uploadFile(DOCUMENTS_BUCKET, storagePath, file);

  const documentPayload: DocumentInsert = {
    application_id: application.id,
    student_id: studentId,
    doc_type_id: docType.id,
    file_name: file.name,
    file_url: publicUrl,
    is_verified: false,
  };

  const { error: documentError } = await supabase
    .from('documents')
    .insert(documentPayload);

  if (documentError) {
    throw new Error(documentError.message);
  }
};

const uploadPassportDocument = async (
  studentId: string,
  userId: string,
  file: File,
  passportNumber?: string | null,
  nationality?: string | null,
) => {
  const fileExt = file.name.split('.').pop();
  const storagePath = `student-documents/${studentId}_passport_${Date.now()}.${fileExt ?? 'pdf'}`;
  const publicUrl = await uploadFile(DOCUMENTS_BUCKET, storagePath, file);

  // Get the passport document type
  const { data: docType } = await supabase
    .from('document_types')
    .select('id')
    .eq('name', 'Passport')
    .maybeSingle();

  // First, check if a passport record exists
  const { data: existingPassport, error: checkError } = await supabase
    .from('student_passports')
    .select('id, passport_doc_id')
    .eq('student_id', studentId)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(checkError.message);
  }

  // If there's an existing passport document, create a documents record and link it
  if (docType?.id) {
    const documentPayload: DocumentInsert = {
      student_id: studentId,
      doc_type_id: docType.id,
      file_name: file.name,
      file_url: publicUrl,
      is_verified: false,
    };

    const { data: newDocument, error: documentError } = await supabase
      .from('documents')
      .insert(documentPayload)
      .select('id')
      .single();

    if (documentError) {
      throw new Error(documentError.message);
    }

    // Upsert the student_passports record with nationality
    const passportPayload = {
      student_id: studentId,
      passport_number: passportNumber?.trim() || null,
      nationality: nationality?.trim() || null,
      passport_doc_id: newDocument.id,
    };

    if (existingPassport?.id) {
      const { error: updateError } = await supabase
        .from('student_passports')
        .update(passportPayload)
        .eq('id', existingPassport.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from('student_passports')
        .insert(passportPayload);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  }
};

const toIsoDate = (value?: Date | string | null) => {
  if (!value) {
    console.log('toIsoDate: received null/undefined');
    return null;
  }
  if (value instanceof Date) {
    const result = isNaN(value.getTime()) ? null : value.toISOString().split('T')[0];
    console.log('toIsoDate: Date object ->', result);
    return result;
  }
  const parsed = new Date(value);
  const result = isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
  console.log('toIsoDate: string parsed ->', result);
  return result;
};

export const saveStudentOnboarding = async ({
  userId,
  data,
  profilePictureFile,
  nationalDocumentFile,
  nationalDocumentTypeName,
  passportDocumentFile,
}: SaveStudentOnboardingOptions) => {
  console.log('Saving onboarding data:', {
    dateOfBirth: data.dateOfBirth,
    dateType: typeof data.dateOfBirth,
    nationality: data.nationality,
    passportNumber: data.passportNumber,
    country: data.address?.country,
  });

  if (data.nationality) {
    try {
      await getOrCreateCountryId(data.nationality);
    } catch (countryError) {
      console.warn('Failed to ensure nationality exists:', countryError);
    }
  }

  if (data.secondNationality) {
    try {
      await getOrCreateCountryId(data.secondNationality);
    } catch (countryError) {
      console.warn('Failed to ensure second nationality exists:', countryError);
    }
  }

  const studentRecord = await ensureStudentRecord(userId);

  const userUpdates: UserUpdate = {
    first_name: data.firstName,
    last_name: data.lastName,
  };

  if (profilePictureFile) {
    const fileExt = profilePictureFile.name.split('.').pop();
    const storagePath = `${userId}/profile_${Date.now()}.${fileExt ?? 'png'}`;
    const publicUrl = await uploadFile(PROFILE_BUCKET, storagePath, profilePictureFile);
    userUpdates.profile_picture_url = publicUrl;
  }

  const { error: userUpdateError } = await supabase
    .from('users')
    .update(userUpdates)
    .eq('id', userId);

  if (userUpdateError) {
    throw new Error(userUpdateError.message);
  }

  const dobValue = toIsoDate(data.dateOfBirth);
  console.log('Final date of birth value being saved:', dobValue);

  const studentUpdates: StudentUpdate = {
    date_of_birth: dobValue,
    country_of_origin: data.nationality ?? null,
    has_dual_citizenship: data.hasDualNationality ?? null,
    country_of_birth: data.secondNationality ?? null,
    profile_completion_status: data.profileCompletionStatus,
  };

  const { error: studentUpdateError } = await supabase
    .from('students')
    .update(studentUpdates)
    .eq('user_id', userId);

  if (studentUpdateError) {
    throw new Error(studentUpdateError.message);
  }

  await upsertAddress(userId, data.address);
  await upsertPhone(userId, data.countryCode, data.phoneNumber);

  if (nationalDocumentFile && data.secondNationality === 'TR') {
    try {
      await uploadNationalDocument(studentRecord.id, nationalDocumentFile, nationalDocumentTypeName);
    } catch (documentError) {
      console.warn('Failed to upload national document:', documentError);
    }
  }

  if (passportDocumentFile) {
    try {
      await uploadPassportDocument(
        studentRecord.id, 
        userId, 
        passportDocumentFile, 
        data.passportNumber,
        data.nationality
      );
    } catch (passportError) {
      console.warn('Failed to upload passport document:', passportError);
    }
  }

  return studentRecord.id;
};
