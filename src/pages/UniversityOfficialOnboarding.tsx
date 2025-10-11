import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ensureCountriesExist, getOrCreateCountryId } from '@/utils/countryUtils';
import { Country } from 'country-state-city';
import type { Database } from '@/integrations/supabase/types';
import { createProgram } from '@/integrations/supabase/programs';

type AddressInsert = Database['public']['Tables']['addresses']['Insert'];
type UniversityInsert = Database['public']['Tables']['universities']['Insert'];
type UniversityOfficialUpdate = Database['public']['Tables']['university_officials']['Update'];
type UniversityOfficialInsert = Database['public']['Tables']['university_officials']['Insert'];
type PhoneInsert = Database['public']['Tables']['phones']['Insert'];

type Program = {
  programName: string;
  language: string;
  minGPA: number | null;
  tuitionFee: number;
};

type RequiredDocuments = {
  transcript: boolean;
  diploma: boolean;
  referenceLetter: boolean;
  others: string;
};

type FormData = {
  universityName: string;
  country: string;
  city: string;
  state: string;
  street1: string;
  street2: string;
  postalCode: string;
  generalContactEmail: string;
  telephoneNumber: string;
  officialWebsite: string;
  promotionalVideoLink: string;
  additionalNotes: string;
  authorizedPersonName: string;
  position: string;
  officeAddress: string;
  directPhoneNumber: string;
  authorizedPersonEmail: string;
  bankAccountNumber: string;
  acceptanceCriteria: string;
  requiredDocuments: RequiredDocuments;
  agreement: boolean;
};

type ErrorMap = Record<string, string>;

const initialFormData: FormData = {
  universityName: '',
  country: '',
  city: '',
  state: '',
  street1: '',
  street2: '',
  postalCode: '',
  generalContactEmail: '',
  telephoneNumber: '',
  officialWebsite: '',
  promotionalVideoLink: '',
  additionalNotes: '',
  authorizedPersonName: '',
  position: '',
  officeAddress: '',
  directPhoneNumber: '',
  authorizedPersonEmail: '',
  bankAccountNumber: '',
  acceptanceCriteria: '',
  requiredDocuments: {
    transcript: false,
    diploma: false,
    referenceLetter: false,
    others: '',
  },
  agreement: false,
};

const step1Schema = z.object({
  universityName: z.string().min(1, 'University name is required'),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Region is required'),
  street1: z.string().min(1, 'Street address is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  generalContactEmail: z.string().email('Must be a valid email'),
  telephoneNumber: z.string().min(1, 'Telephone number is required'),
  officialWebsite: z.string().url('Must be a valid URL'),
  promotionalVideoLink: z.string().url('Must be a valid URL').or(z.literal('')),
});

const step2Schema = z.object({
  authorizedPersonName: z.string().min(1, 'Full name is required'),
  position: z.string().min(1, 'Position/Title is required'),
  officeAddress: z.string().min(1, 'Office address is required'),
  directPhoneNumber: z.string().min(1, 'Direct phone number is required'),
  authorizedPersonEmail: z.string().email('Must be a valid email'),
  bankAccountNumber: z.string().optional().or(z.literal('')),
});

const step5Schema = z.object({
  agreement: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the declaration' }),
  }),
});

const languages = ['Turkish', 'English', 'German', 'French'];

const UniversityOfficialOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [programs, setPrograms] = useState<Program[]>([]);
  const [universityLogo, setUniversityLogo] = useState<File | null>(null);
  const [presentationMaterials, setPresentationMaterials] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initialise = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      await ensureCountriesExist();

      const firstName = user.user_metadata?.first_name ?? '';
      const lastName = user.user_metadata?.last_name ?? '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = user.email ?? '';

      setFormData(prev => ({
        ...prev,
        authorizedPersonName: fullName || prev.authorizedPersonName,
        authorizedPersonEmail: email || prev.authorizedPersonEmail,
        generalContactEmail: prev.generalContactEmail || email,
      }));

      const { data: official } = await supabase
        .from('university_officials')
        .select('authorized_person_name, authorized_person_email, contact_phone, direct_phone, bank_account_number')
        .eq('user_id', user.id)
        .maybeSingle();

      if (official) {
        setFormData(prev => ({
          ...prev,
          authorizedPersonName: official.authorized_person_name || prev.authorizedPersonName,
          authorizedPersonEmail: official.authorized_person_email || prev.authorizedPersonEmail,
          telephoneNumber: official.contact_phone || prev.telephoneNumber,
          directPhoneNumber: official.direct_phone || prev.directPhoneNumber,
          bankAccountNumber: official.bank_account_number || prev.bankAccountNumber,
        }));
      }
    };

    initialise();
  }, []);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateDocument = (field: keyof RequiredDocuments, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: {
        ...prev.requiredDocuments,
        [field]: value,
      },
    }));
  };

  const addProgram = () => {
    setPrograms(prev => [...prev, { programName: '', language: '', minGPA: null, tuitionFee: 0 }]);
  };

  const removeProgram = (index: number) => {
    setPrograms(prev => prev.filter((_, i) => i !== index));
  };

  const updateProgram = (index: number, field: keyof Program, value: string | number | null) => {
    setPrograms(prev => {
      const copy = [...prev];

      if (field === 'minGPA') {
        if (value === '' || value === null) {
          copy[index] = { ...copy[index], minGPA: null };
        } else {
          const numeric = typeof value === 'number' ? value : Number(value);
          if (Number.isNaN(numeric)) {
            return prev;
          }
          const clamped = Math.max(0, Math.min(100, numeric));
          copy[index] = { ...copy[index], minGPA: clamped };
        }
      } else {
        copy[index] = { ...copy[index], [field]: value } as Program;
      }

      return copy;
    });
  };

  const fieldError = (path: string) => errors[path];

  const validationPayloads = useMemo(() => ({
    step1: {
      universityName: formData.universityName,
      country: formData.country,
      city: formData.city,
      state: formData.state,
      street1: formData.street1,
      postalCode: formData.postalCode,
      generalContactEmail: formData.generalContactEmail,
      telephoneNumber: formData.telephoneNumber,
      officialWebsite: formData.officialWebsite,
      promotionalVideoLink: formData.promotionalVideoLink,
    },
    step2: {
      authorizedPersonName: formData.authorizedPersonName,
      position: formData.position,
      officeAddress: formData.officeAddress,
      directPhoneNumber: formData.directPhoneNumber,
      authorizedPersonEmail: formData.authorizedPersonEmail,
      bankAccountNumber: formData.bankAccountNumber,
    },
    step5: {
      agreement: formData.agreement,
    },
  }), [formData]);

  const validateStep = (step: number): boolean => {
    let currentErrors: ErrorMap = {};

    const collectZodErrors = (result: z.SafeParseReturnType<any, any>, prefix = '') => {
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors;
        for (const [key, messages] of Object.entries(flat)) {
          if (messages && messages.length > 0) {
            currentErrors[prefix ? `${prefix}.${key}` : key] = messages[0];
          }
        }
      }
    };

    if (step === 1) {
      collectZodErrors(step1Schema.safeParse(validationPayloads.step1));
    } else if (step === 2) {
      collectZodErrors(step2Schema.safeParse(validationPayloads.step2));
    } else if (step === 5) {
      collectZodErrors(step5Schema.safeParse(validationPayloads.step5));
    }

    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSkip = () => {
    if (currentStep === 3 || currentStep === 4) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleFinalSubmit = async () => {
    const stepsToValidate = [1, 2, 5];
    for (const step of stepsToValidate) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (!userId) throw new Error('No authenticated user');

      console.log('Starting university onboarding submission...');
      console.log('Form data collected:', { formData, programs });

      let logoUrl = '';
      let materialsUrl = '';

      if (universityLogo) {
        const logoPath = `${userId}/logo_${Date.now()}.${universityLogo.name.split('.').pop()}`;
        const { data: logoUpload, error: logoError } = await supabase.storage
          .from('profiles')
          .upload(logoPath, universityLogo);

        if (logoError) {
          throw new Error(`Failed to upload logo: ${logoError.message}`);
        }
        logoUrl = logoUpload.path;
      }

      if (presentationMaterials) {
        const materialsPath = `${userId}/materials_${Date.now()}.${presentationMaterials.name.split('.').pop()}`;
        const { data: materialsUpload, error: materialsError } = await supabase.storage
          .from('documents')
          .upload(materialsPath, presentationMaterials);

        if (materialsError) {
          throw new Error(`Failed to upload materials: ${materialsError.message}`);
        }
        materialsUrl = materialsUpload.path;
      }

      const countryId = await getOrCreateCountryId(formData.country);
      const campusStreet = [formData.street1, formData.street2].filter(Boolean).join(', ');

      const universityPayload: UniversityInsert = {
        name: formData.universityName,
        country_id: countryId,
        website_url: formData.officialWebsite,
        general_contact_email: formData.generalContactEmail,
        telephone_number: formData.telephoneNumber,
        promotional_video_url: formData.promotionalVideoLink || null,
        additional_notes: formData.additionalNotes || null,
        logo_url: logoUrl || null,
        acceptance_criteria: formData.acceptanceCriteria || null,
        required_documents: formData.requiredDocuments,
        is_active: false,
      };

      const { data: universityData, error: universityError } = await supabase
        .from('universities')
        .insert(universityPayload)
        .select()
        .single();

      if (universityError || !universityData?.id) {
        throw new Error(`Failed to create university: ${universityError?.message ?? 'Unknown error'}`);
      }

      const universityId = universityData.id;

      const officialInsert: UniversityOfficialInsert = {
        user_id: userId,
        university_id: universityId,
        status: 'draft',
      };

      const { data: existingOfficial } = await supabase
        .from('university_officials')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let officialId = existingOfficial?.id ?? null;

      if (!officialId) {
        const [firstName, ...restName] = (formData.authorizedPersonName || '').trim().split(' ');
        const lastName = restName.join(' ') || null;
        const emailForProfile = formData.authorizedPersonEmail || formData.generalContactEmail;

        try {
          const { data: existingUser, error: fetchUserError } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

          if (fetchUserError) {
            console.error('Failed to check existing user profile:', fetchUserError);
          }

          if (existingUser?.id) {
            const { error: userUpdateError } = await supabase
              .from('users')
              .update({
                email: emailForProfile,
                first_name: firstName || null,
                last_name: lastName || null,
              })
              .eq('id', userId);

            if (userUpdateError) {
              console.error('Failed to update user profile before creating university official:', userUpdateError);
            }
          } else {
            const { error: userInsertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: emailForProfile,
                first_name: firstName || null,
                last_name: lastName || null,
              });

            if (userInsertError && userInsertError.code !== '23505') {
              console.error('Failed to insert user profile before creating university official:', userInsertError);
            }
          }
        } catch (profileSyncError) {
          console.error('Unexpected error syncing user profile:', profileSyncError);
        }

        const { data: newOfficial, error: createOfficialError } = await supabase
          .from('university_officials')
          .insert(officialInsert)
          .select('id')
          .maybeSingle();

        if (createOfficialError) {
          const duplicate =
            createOfficialError.code === '23505' ||
            createOfficialError.code === '409' ||
            createOfficialError.message?.toLowerCase().includes('duplicate');

          if (duplicate) {
            const { data: fetchExisting, error: fetchExistingError } = await supabase
              .from('university_officials')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle();

            if (fetchExistingError || !fetchExisting?.id) {
              throw new Error('University official profile not found and could not be created. Please contact support.');
            }

            officialId = fetchExisting.id;
          } else {
            throw new Error(`Failed to create university official record: ${createOfficialError.message}`);
          }
        } else if (newOfficial?.id) {
          officialId = newOfficial.id;
        } else {
          throw new Error('University official profile not found and could not be created. Please contact support.');
        }
      }

      const campusAddress: AddressInsert & { city?: string | null } = {
        user_id: userId,
        university_id: universityId,
        address_type: 'university_campus',
        street: campusStreet || null,
        state: formData.state,
        postal_code: formData.postalCode,
        city: formData.city,
      };

      const officialOfficeAddress: AddressInsert & { city?: string | null } = {
        user_id: userId,
        university_id: universityId,
        address_type: 'official_office',
        street: formData.officeAddress,
        state: formData.state,
        postal_code: formData.postalCode,
        city: formData.city,
      };

      const { error: addressError } = await supabase
        .from('addresses')
        .upsert([campusAddress, officialOfficeAddress], { onConflict: 'user_id,address_type' });

      if (addressError) {
        throw new Error(`Failed to save address: ${addressError.message}`);
      }

      const phonePayload: PhoneInsert[] = [
        {
          user_id: userId,
          phone_number: formData.telephoneNumber,
          phone_type: 'office',
          is_primary: false,
        },
        {
          user_id: userId,
          phone_number: formData.directPhoneNumber,
          phone_type: 'direct',
          is_primary: true,
        },
      ];

      const { error: phoneError } = await supabase
        .from('phones')
        .upsert(phonePayload, { onConflict: 'user_id,phone_type' });

      if (phoneError) {
        throw new Error(`Failed to save phone number: ${phoneError.message}`);
      }

      if (materialsUrl) {
        const { error: materialsError } = await supabase
          .from('university_presentation_materials')
          .insert({
            university_id: universityId,
            file_url: materialsUrl,
            file_type: presentationMaterials?.type || 'application/pdf',
          });

        if (materialsError) {
          throw new Error(`Failed to save materials record: ${materialsError.message}`);
        }
      }

      for (const program of programs) {
        if (!program.programName || !program.language) continue;

        await createProgram(universityId, {
          name: program.programName,
          programLanguages: [program.language],
          minimumGpa: program.minGPA,
          tuitionFee: program.tuitionFee,
          currency: 'USD',
          isActive: true,
        });
      }

      const stepsData = [
        { step_number: 1, saved_data: { ...formData } },
        { step_number: 2, saved_data: { ...formData } },
        { step_number: 3, saved_data: { requiredDocuments: formData.requiredDocuments } },
        { step_number: 4, saved_data: { programs } },
        { step_number: 5, saved_data: { agreement: formData.agreement } },
      ];

      for (const stepEntry of stepsData) {
        const { error: stepError } = await supabase
          .from('university_onboarding_steps')
          .upsert({
            official_id: officialId,
            step_number: stepEntry.step_number,
            is_complete: true,
            saved_data: stepEntry.saved_data,
          }, {
            onConflict: 'official_id,step_number',
          });

        if (stepError) {
          throw new Error(`Failed to save step ${stepEntry.step_number}: ${stepError.message}`);
        }
      }

      const officialUpdate: UniversityOfficialUpdate = {
        university_id: universityId,
        contact_phone: formData.telephoneNumber,
        direct_phone: formData.directPhoneNumber,
        bank_account_number: formData.bankAccountNumber || null,
        position_title: formData.position,
        authorized_person_name: formData.authorizedPersonName,
        authorized_person_email: formData.authorizedPersonEmail,
        status: 'pending',
      };

      const { error: updateError } = await supabase
        .from('university_officials')
        .update(officialUpdate)
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to update university official: ${updateError.message}`);
      }

      toast({
        title: 'Application submitted successfully!',
        description: 'Your university profile has been created and is under review.',
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/registration-pending', { replace: true });
    } catch (error) {
      console.error('Error during submission:', error);
      let description = 'Failed to submit application. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('University official profile not found')) {
          description = 'We could not find your university official profile. The team has been notified.';
        } else {
          description = error.message;
        }
      }

      toast({
        title: 'Submission Failed',
        description,
        variant: 'destructive',
      });

      if (error instanceof Error && error.message.includes('University official profile not found')) {
        console.error('Creating fallback university official profile...');
        try {
          if (!userId) throw new Error('Missing user identifier');

          const { data: existingOfficial } = await supabase
            .from('university_officials')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!existingOfficial?.id) {
            const { error: createOfficialError } = await supabase
              .from('university_officials')
              .insert({
                user_id: userId,
                authorized_person_name: formData.authorizedPersonName || null,
                authorized_person_email: formData.authorizedPersonEmail || null,
                status: 'pending',
              });

            if (createOfficialError) {
              console.error('Fallback creation failed:', createOfficialError);
            } else {
              toast({
                title: 'Profile recovered',
                description: 'We recreated your university official profile. Please try submitting again.',
              });
            }
          }
        } catch (fallbackError) {
          console.error('Unable to create fallback university official profile:', fallbackError);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldError = (key: string) => {
    const message = fieldError(key);
    return message ? <p className="text-sm text-destructive">{message}</p> : null;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: General Information</CardTitle>
              <CardDescription>University and location details (Required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>University Name*</Label>
                <Input
                  value={formData.universityName}
                  onChange={(event) => updateField('universityName', event.target.value)}
                  placeholder="Enter university name"
                />
                {renderFieldError('universityName')}
              </div>

      ...
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country*</Label>
                 <Select
                    onValueChange={(value) => updateField('country', value)}
                    value={formData.country || undefined}
                 >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {Country.getAllCountries().map(country => (
                        <SelectItem key={country.isoCode} value={country.isoCode}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderFieldError('country')}
                </div>

                <div className="space-y-2">
                  <Label>City*</Label>
                  <Input
                    value={formData.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    placeholder="Enter city"
                  />
                  {renderFieldError('city')}
                </div>
              </div>

              <div className="space-y-2">
                <Label>State/Region*</Label>
                <Input
                  value={formData.state}
                  onChange={(event) => updateField('state', event.target.value)}
                  placeholder="Enter state or region"
                />
                {renderFieldError('state')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Street Address 1*</Label>
                  <Input
                    value={formData.street1}
                    onChange={(event) => updateField('street1', event.target.value)}
                    placeholder="Enter street address"
                  />
                  {renderFieldError('street1')}
                </div>

                <div className="space-y-2">
                  <Label>Street Address 2</Label>
                  <Input
                    value={formData.street2}
                    onChange={(event) => updateField('street2', event.target.value)}
                    placeholder="Additional address details (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Postal Code*</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={(event) => updateField('postalCode', event.target.value)}
                    placeholder="Enter postal code"
                  />
                  {renderFieldError('postalCode')}
                </div>

                <div className="space-y-2">
                  <Label>Telephone Number*</Label>
                  <Input
                    value={formData.telephoneNumber}
                    onChange={(event) => updateField('telephoneNumber', event.target.value)}
                    placeholder="Enter telephone number"
                  />
                  {renderFieldError('telephoneNumber')}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contact Email*</Label>
                <Input
                  type="email"
                  value={formData.generalContactEmail}
                  onChange={(event) => updateField('generalContactEmail', event.target.value)}
                  placeholder="Enter contact email"
                />
                {renderFieldError('generalContactEmail')}
              </div>

              <div className="space-y-2">
                <Label>Official Website*</Label>
                <Input
                  value={formData.officialWebsite}
                  onChange={(event) => updateField('officialWebsite', event.target.value)}
                  placeholder="https://www.example.com"
                />
                {renderFieldError('officialWebsite')}
              </div>

              <div className="space-y-2">
                <Label>Promotional Video Link</Label>
                <Input
                  value={formData.promotionalVideoLink}
                  onChange={(event) => updateField('promotionalVideoLink', event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {renderFieldError('promotionalVideoLink')}
              </div>

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={(event) => updateField('additionalNotes', event.target.value)}
                  placeholder="Any additional information about your university"
                  className="h-32"
                />
              </div>

              <div>
                <Label htmlFor="university-logo">University Logo</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('university-logo-input')?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Button>
                  {universityLogo && <span className="text-sm text-muted-foreground">{universityLogo.name}</span>}
                </div>
                <input
                  id="university-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setUniversityLogo(file);
                  }}
                />
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="presentation-materials">Presentation Materials</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('presentation-materials-input')?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Materials
                  </Button>
                  {presentationMaterials && <span className="text-sm text-muted-foreground">{presentationMaterials.name}</span>}
                </div>
                <input
                  id="presentation-materials-input"
                  type="file"
                  accept="application/pdf,video/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setPresentationMaterials(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Authorized Person Info</CardTitle>
              <CardDescription>Contact details for the authorized representative (Required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name*</Label>
                <Input
                  value={formData.authorizedPersonName}
                  onChange={(event) => updateField('authorizedPersonName', event.target.value)}
                  placeholder="Enter full name"
                />
                {renderFieldError('authorizedPersonName')}
              </div>

              <div className="space-y-2">
                <Label>Position/Title*</Label>
                <Input
                  value={formData.position}
                  onChange={(event) => updateField('position', event.target.value)}
                  placeholder="Enter position or title"
                />
                {renderFieldError('position')}
              </div>

              <div className="space-y-2">
                <Label>Office Address*</Label>
                <Input
                  value={formData.officeAddress}
                  onChange={(event) => updateField('officeAddress', event.target.value)}
                  placeholder="Enter office address"
                />
                {renderFieldError('officeAddress')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Direct Phone Number*</Label>
                  <Input
                    value={formData.directPhoneNumber}
                    onChange={(event) => updateField('directPhoneNumber', event.target.value)}
                    placeholder="Enter direct phone number"
                  />
                  {renderFieldError('directPhoneNumber')}
                </div>

                <div className="space-y-2">
                  <Label>Email*</Label>
                  <Input
                    type="email"
                    value={formData.authorizedPersonEmail}
                    onChange={(event) => updateField('authorizedPersonEmail', event.target.value)}
                    placeholder="Enter email address"
                  />
                  {renderFieldError('authorizedPersonEmail')}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bank Account Number (Optional)</Label>
                <Input
                  value={formData.bankAccountNumber}
                  onChange={(event) => updateField('bankAccountNumber', event.target.value)}
                  placeholder="Enter bank account number"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Academic Info</CardTitle>
              <CardDescription>Student acceptance criteria and required documents (Optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Student Acceptance Criteria</Label>
                <Textarea
                  value={formData.acceptanceCriteria}
                  onChange={(event) => updateField('acceptanceCriteria', event.target.value)}
                  placeholder="Describe your university's student acceptance criteria..."
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Required Documents</h4>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={formData.requiredDocuments.transcript}
                    onCheckedChange={(checked) => updateDocument('transcript', Boolean(checked))}
                  />
                  <div className="space-y-1 leading-none">
                    <Label>Transcript</Label>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={formData.requiredDocuments.diploma}
                    onCheckedChange={(checked) => updateDocument('diploma', Boolean(checked))}
                  />
                  <div className="space-y-1 leading-none">
                    <Label>Diploma</Label>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={formData.requiredDocuments.referenceLetter}
                    onCheckedChange={(checked) => updateDocument('referenceLetter', Boolean(checked))}
                  />
                  <div className="space-y-1 leading-none">
                    <Label>Reference Letter</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Others</Label>
                  <Input
                    value={formData.requiredDocuments.others}
                    onChange={(event) => updateDocument('others', event.target.value)}
                    placeholder="Specify other required documents"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Program Info</CardTitle>
              <CardDescription>Details about programs offered (Optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {programs.map((program, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium">Program {index + 1}</h5>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeProgram(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`program-name-${index}`}>Program Name</Label>
                      <Input
                        id={`program-name-${index}`}
                        value={program.programName}
                        onChange={(event) => updateProgram(index, 'programName', event.target.value)}
                        placeholder="Enter program name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`program-language-${index}`}>Language</Label>
                      <Select
                        value={program.language}
                        onValueChange={(value) => updateProgram(index, 'language', value)}
                      >
                        <SelectTrigger id={`program-language-${index}`}>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`min-gpa-${index}`}>Minimum Grade (out of 100)</Label>
                      <Input
                        id={`min-gpa-${index}`}
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={program.minGPA ?? ''}
                        onChange={(event) => {
                          const raw = event.target.value;
                          updateProgram(index, 'minGPA', raw === '' ? null : raw);
                        }}
                        placeholder="e.g. 70"
                      />
                      <p className="text-xs text-muted-foreground">
                        Convert other grading systems to their percentage equivalent out of 100 before entering a value.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`tuition-fee-${index}`}>Tuition Fee</Label>
                      <Input
                        id={`tuition-fee-${index}`}
                        type="number"
                        min="0"
                        value={program.tuitionFee}
                        onChange={(event) => updateProgram(index, 'tuitionFee', parseFloat(event.target.value) || 0)}
                        placeholder="10000"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addProgram} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Program
              </Button>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Confirmation</CardTitle>
              <CardDescription>Review and confirm your information (Required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Review Your Information</h4>
                <p className="text-sm text-muted-foreground">
                  Please review all the information you've provided before submitting your application.
                  Once submitted, your account will be under review and you'll be notified once approved.
                </p>
              </div>

              <div className="flex items-start space-x-3 rounded-md border p-4">
                <Checkbox
                  id="official-onboarding-agreement"
                  checked={formData.agreement}
                  onCheckedChange={(checked) => updateField('agreement', Boolean(checked))}
                />
                <div className="space-y-1 leading-relaxed">
                  <Label htmlFor="official-onboarding-agreement" className="text-sm font-normal">
                    I confirm that the information provided is accurate and that I have read and agree to the{' '}
                    <Link to="/terms" className="underline">Terms of Service</Link>,{' '}
                    <Link to="/privacy" className="underline">Privacy Policy</Link>, and{' '}
                    <Link to="/cookies" className="underline">Cookie Policy</Link>.
                  </Label>
                  {renderFieldError('agreement')}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">University Official Onboarding</h1>
          <p className="text-muted-foreground">Complete your profile to access your dashboard</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Step {currentStep} of 5</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / 5) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / 5) * 100} className="w-full" />
        </div>

        {renderStep()}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {(currentStep === 3 || currentStep === 4) && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}

            {currentStep < 5 && (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityOfficialOnboarding;
