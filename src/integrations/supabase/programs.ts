import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TranslatableStringInsert = Database['public']['Tables']['translatable_strings']['Insert'];
type TranslationInsert = Database['public']['Tables']['translations']['Insert'];
type ProgramInsert = Database['public']['Tables']['programs']['Insert'];
type ProgramUpdate = Database['public']['Tables']['programs']['Update'];
type ProgramInsertWithSeats = ProgramInsert & { seats?: number | null };
type ProgramUpdateWithSeats = ProgramUpdate & { seats?: number | null };

interface TranslationConfig {
  text: string;
  languageCode?: string;
}

export interface CreateProgramInput {
  name: string;
  nameLanguageCode?: string;
  programLanguages: string[];
  minimumGpa?: number | null;
  tuitionFee?: number | null;
  currency?: string | null;
  studyLevels?: string[];
  intakeDates?: string[];
  applicationDeadline?: string | null;
  description?: TranslationConfig | null;
  isActive?: boolean;
  seats?: number | null;
  requiredDocuments?: any;
  acceptanceCriteria?: string | null;
}

export interface UpdateProgramInput extends CreateProgramInput {
  nameId: string | null;
  descriptionId: string | null;
}

const createTranslatableEntry = async ({
  text,
  languageCode = 'en',
}: TranslationConfig): Promise<string> => {
  if (!text.trim()) {
    throw new Error('Translation text cannot be empty');
  }

  const { data: stringRecord, error: stringError } = await supabase
    .from('translatable_strings')
    .insert<TranslatableStringInsert>({})
    .select('id')
    .single();

  if (stringError || !stringRecord?.id) {
    throw new Error(stringError?.message || 'Failed to create translation reference');
  }

  const { error: translationError } = await supabase
    .from('translations')
    .insert<TranslationInsert>({
      language_code: languageCode,
      translatable_string_id: stringRecord.id,
      translated_text: text,
    });

  if (translationError) {
    throw new Error(translationError.message || 'Failed to save translation');
  }

  return stringRecord.id;
};

const upsertTranslation = async (
  translatableStringId: string,
  { text, languageCode = 'en' }: TranslationConfig,
) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  const { data: existingTranslation, error: fetchError } = await supabase
    .from('translations')
    .select('id')
    .eq('translatable_string_id', translatableStringId)
    .eq('language_code', languageCode)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message || 'Failed to resolve existing translation');
  }

  if (existingTranslation?.id) {
    const { error: updateError } = await supabase
      .from('translations')
      .update({ translated_text: trimmed })
      .eq('id', existingTranslation.id);

    if (updateError) {
      throw new Error(updateError.message || 'Failed to update translation');
    }
  } else {
    const { error: insertError } = await supabase
      .from('translations')
      .insert<TranslationInsert>({
        language_code: languageCode,
        translatable_string_id: translatableStringId,
        translated_text: trimmed,
      });

    if (insertError) {
      throw new Error(insertError.message || 'Failed to create translation');
    }
  }
};

export const createProgram = async (
  universityId: string,
  input: CreateProgramInput,
) => {
  const {
    name,
    nameLanguageCode = 'en',
    programLanguages,
    minimumGpa = null,
    tuitionFee = null,
    currency = null,
    studyLevels,
    intakeDates,
    applicationDeadline = null,
    description,
    isActive = true,
    seats = null,
    requiredDocuments = null,
    acceptanceCriteria = null,
  } = input;

  if (!name.trim()) {
    throw new Error('Program name is required');
  }

  if (!programLanguages.length) {
    throw new Error('At least one instruction language is required');
  }

  const nameId = await createTranslatableEntry({ text: name, languageCode: nameLanguageCode });

  let descriptionId: string | null = null;
  if (description?.text) {
    descriptionId = await createTranslatableEntry({
      text: description.text,
      languageCode: description.languageCode || nameLanguageCode,
    });
  }

  const payload: ProgramInsertWithSeats = {
    university_id: universityId,
    name_id: nameId,
    description_id: descriptionId,
    minimum_gpa: minimumGpa,
    tuition_fee: tuitionFee,
    languages: programLanguages,
    currency,
    study_levels: studyLevels?.length ? studyLevels : null,
    intake_dates: intakeDates?.length ? intakeDates : null,
    application_deadline: applicationDeadline,
    is_active: isActive,
    seats,
    required_documents: requiredDocuments,
    acceptance_criteria: acceptanceCriteria,
  };

  const { data, error } = await supabase
    .from('programs')
    .insert<ProgramInsert>(payload)
    .select(`
      *,
      name:translatable_strings!programs_name_id_fkey (
        translations (
          language_code,
          translated_text
        )
      ),
      description:translatable_strings!programs_description_id_fkey (
        translations (
          language_code,
          translated_text
        )
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to save program');
  }

  return data;
};

export const updateProgram = async (
  programId: string,
  universityId: string,
  input: UpdateProgramInput,
) => {
  const {
    name,
    nameLanguageCode = 'en',
    programLanguages,
    minimumGpa = null,
    tuitionFee = null,
    currency = null,
    studyLevels,
    intakeDates,
    applicationDeadline = null,
    description,
    isActive = true,
    seats = null,
    requiredDocuments = null,
    acceptanceCriteria = null,
    nameId,
    descriptionId,
  } = input;

  if (!name.trim()) {
    throw new Error('Program name is required');
  }

  if (!programLanguages.length) {
    throw new Error('At least one instruction language is required');
  }

  let effectiveNameId = nameId;
  if (effectiveNameId) {
    await upsertTranslation(effectiveNameId, { text: name, languageCode: nameLanguageCode });
  } else {
    effectiveNameId = await createTranslatableEntry({ text: name, languageCode: nameLanguageCode });
  }

  let effectiveDescriptionId = descriptionId;
  const descriptionText = description?.text?.trim();
  if (descriptionText) {
    if (effectiveDescriptionId) {
      await upsertTranslation(effectiveDescriptionId, {
        text: descriptionText,
        languageCode: description?.languageCode || nameLanguageCode,
      });
    } else {
      effectiveDescriptionId = await createTranslatableEntry({
        text: descriptionText,
        languageCode: description?.languageCode || nameLanguageCode,
      });
    }
  } else {
    effectiveDescriptionId = null;
  }

  const payload: ProgramUpdateWithSeats = {
    minimum_gpa: minimumGpa,
    tuition_fee: tuitionFee,
    languages: programLanguages,
    currency,
    study_levels: studyLevels?.length ? studyLevels : null,
    intake_dates: intakeDates?.length ? intakeDates : null,
    application_deadline: applicationDeadline,
    is_active: isActive,
    seats,
    required_documents: requiredDocuments,
    acceptance_criteria: acceptanceCriteria,
    name_id: effectiveNameId ?? undefined,
    description_id: effectiveDescriptionId,
  };

  const { data, error } = await supabase
    .from('programs')
    .update(payload)
    .eq('id', programId)
    .eq('university_id', universityId)
    .select(`
      *,
      name:translatable_strings!programs_name_id_fkey (
        id,
        translations (
          language_code,
          translated_text
        )
      ),
      description:translatable_strings!programs_description_id_fkey (
        id,
        translations (
          language_code,
          translated_text
        )
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update program');
  }

  return data;
};
