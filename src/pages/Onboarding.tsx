import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { CountrySelect } from '@/components/CountrySelect';
import { FileUpload } from '@/components/FileUpload';

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, isLoading: roleLoading } = useUserRole();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Step 1: Basic Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  // Step 2: Citizenship & Passports
  const [nationality, setNationality] = useState('');
  const [hasDualNationality, setHasDualNationality] = useState(false);
  const [secondNationality, setSecondNationality] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportDocumentFile, setPassportDocumentFile] = useState<File | null>(null);
  const [nationalDocumentFile, setNationalDocumentFile] = useState<File | null>(null);

  // Step 3: Contact & Address
  const [countryCode, setCountryCode] = useState('+90');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [policiesAccepted, setPoliciesAccepted] = useState(false);

  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (roleLoading) return;

    if (role && role !== 'student') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const { data: authData, error } = await supabase.auth.getUser();
        if (error) throw error;

        const user = authData.user;
        if (!user) {
          navigate('/auth');
          return;
        }

        setUserId(user.id);
        setEmail(user.email || '');

        // Fetch existing user data
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();

        if (userData) {
          setFirstName(userData.first_name || '');
          setLastName(userData.last_name || '');
        }

        // Get or create student record
        let { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!studentData) {
          const { data: newStudent, error: insertError } = await supabase
            .from('students')
            .insert({ user_id: user.id, profile_completion_status: 'incomplete' })
            .select()
            .single();

          if (insertError) throw insertError;
          studentData = newStudent;
        }

        setStudentId(studentData.id);

        // Prefill existing data
        if (studentData.date_of_birth) {
          setDateOfBirth(studentData.date_of_birth.split('T')[0]);
        }
        if (studentData.country_of_origin) setNationality(studentData.country_of_origin);
        if (studentData.has_dual_citizenship !== null) setHasDualNationality(studentData.has_dual_citizenship);
        if (studentData.country_of_birth) setSecondNationality(studentData.country_of_birth);

        // Fetch passport if exists
        const { data: passportData } = await supabase
          .from('student_passports')
          .select('passport_number, nationality')
          .eq('student_id', studentData.id)
          .maybeSingle();

        if (passportData) {
          setPassportNumber(passportData.passport_number || '');
          if (!nationality) setNationality(passportData.nationality || '');
        }

        // Fetch address
        const { data: addressData } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('address_type', 'primary')
          .maybeSingle();

        if (addressData) {
          setStreet(addressData.street || '');
          setCity(addressData.city || '');
          setState(addressData.state || '');
          setPostalCode(addressData.postal_code || '');
          setCountry(addressData.country || '');
        }

        // Fetch phone
        const { data: phoneData } = await supabase
          .from('phones')
          .select('*')
          .eq('user_id', user.id)
          .eq('phone_type', 'mobile')
          .maybeSingle();

        if (phoneData) {
          setCountryCode(phoneData.country_code || '+90');
          setPhoneNumber(phoneData.phone_number || '');
        }

        // Check if already completed
        if (studentData.profile_completion_status === 'completed' || studentData.profile_completion_status === 'complete') {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast, role, roleLoading]);

  const handleNext = async () => {
    if (!userId || !studentId) return;

    setSaving(true);
    try {
      if (currentStep === totalSteps && !policiesAccepted) {
        toast({
          title: 'Action Required',
          description: 'Please confirm you have reviewed our Terms of Service, Privacy Policy, and Cookie Policy before continuing.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      // Step 1: Save basic information
      if (currentStep === 1) {
        if (!firstName || !lastName) {
          toast({
            title: 'Required Fields',
            description: 'Please enter your first and last name',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        // Upload profile picture if provided
        let profilePictureUrl = null;
        if (profilePictureFile) {
          const fileExt = profilePictureFile.name.split('.').pop();
          const fileName = `${userId}/profile_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(fileName, profilePictureFile, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('profiles')
            .getPublicUrl(fileName);

          profilePictureUrl = publicUrl;
        }

        // Update user data
        const { error: userError } = await supabase
          .from('users')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            ...(profilePictureUrl && { profile_picture_url: profilePictureUrl }),
          })
          .eq('id', userId);

        if (userError) throw userError;

        // Update student data with date of birth
        if (dateOfBirth) {
          const { error: studentError } = await supabase
            .from('students')
            .update({
              date_of_birth: dateOfBirth,
            })
            .eq('user_id', userId);

          if (studentError) throw studentError;
        }
      }

      // Step 2: Save citizenship & passport
      if (currentStep === 2) {
        // Update student citizenship info
        const { error: studentError } = await supabase
          .from('students')
          .update({
            country_of_origin: nationality.trim() || null,
            has_dual_citizenship: hasDualNationality,
            country_of_birth: hasDualNationality ? secondNationality.trim() || null : null,
          })
          .eq('user_id', userId);

        if (studentError) throw studentError;

        // Upload passport document and create passport record
        if (passportNumber && nationality) {
          let passportDocId: string | null = null;

          if (passportDocumentFile) {
            const fileExt = passportDocumentFile.name.split('.').pop();
            const fileName = `${userId}/passport_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('documents')
              .upload(fileName, passportDocumentFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('documents')
              .getPublicUrl(fileName);

            // Get passport document type
            const { data: docTypes } = await supabase
              .from('document_types')
              .select('id')
              .ilike('name', '%passport%')
              .maybeSingle();

            if (docTypes) {
              const { data: insertedDoc, error: insertError } = await supabase
                .from('documents')
                .insert({
                  student_id: studentId,
                  doc_type_id: docTypes.id,
                  file_name: passportDocumentFile.name,
                  file_url: publicUrl,
                  application_id: null,
                })
                .select()
                .single();

              if (insertError) throw insertError;
              passportDocId = insertedDoc?.id || null;
            }
          }

          // Check if passport already exists
          const { data: existingPassport } = await supabase
            .from('student_passports')
            .select('id')
            .eq('student_id', studentId)
            .maybeSingle();

          if (existingPassport) {
            // Update existing passport
            const { error: passportError } = await supabase
              .from('student_passports')
              .update({
                passport_number: passportNumber.trim(),
                nationality: nationality.trim(),
                ...(passportDocId && { passport_doc_id: passportDocId }),
              })
              .eq('id', existingPassport.id);

            if (passportError) throw passportError;
          } else {
            // Insert new passport
            const { error: passportError } = await supabase
              .from('student_passports')
              .insert({
                student_id: studentId,
                passport_number: passportNumber.trim(),
                nationality: nationality.trim(),
                passport_doc_id: passportDocId,
              });

            if (passportError) throw passportError;
          }
        }

        // Upload national document if Turkish
        if (nationalDocumentFile && secondNationality === 'TR') {
          const { data: docTypes } = await supabase
            .from('document_types')
            .select('id')
            .eq('name', 'Nüfus Kayıt Örneği')
            .maybeSingle();

          if (docTypes) {
            const fileExt = nationalDocumentFile.name.split('.').pop();
            const fileName = `${userId}/national_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('documents')
              .upload(fileName, nationalDocumentFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('documents')
              .getPublicUrl(fileName);

            await supabase
              .from('documents')
              .insert({
                student_id: studentId,
                doc_type_id: docTypes.id,
                file_name: nationalDocumentFile.name,
                file_url: publicUrl,
                application_id: null,
              });
          }
        }
      }

      // Step 3: Save contact & address
      if (currentStep === 3) {
        // Upsert phone
        if (phoneNumber) {
          const { error: phoneError } = await supabase
            .from('phones')
            .upsert({
              user_id: userId,
              phone_type: 'mobile',
              country_code: countryCode.trim() || '+90',
              phone_number: phoneNumber.trim(),
            }, {
              onConflict: 'user_id,phone_type'
            });

          if (phoneError) throw phoneError;
        }

        // Upsert address
        if (street || city || country) {
          const { error: addressError } = await supabase
            .from('addresses')
            .upsert({
              user_id: userId,
              address_type: 'primary',
              street: street.trim() || null,
              city: city.trim() || null,
              state: state.trim() || null,
              postal_code: postalCode.trim() || null,
              country: country.trim() || null,
            }, {
              onConflict: 'user_id,address_type'
            });

          if (addressError) throw addressError;
        }

        // Update completion status
        await supabase
          .from('students')
          .update({ profile_completion_status: 'personal_completed' })
          .eq('user_id', userId);

        toast({
          title: 'Success',
          description: 'Personal information saved successfully!',
        });
        navigate('/academic-onboarding');
        return;
      }

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save information',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep === totalSteps && !policiesAccepted) {
      toast({
        title: 'Action Required',
        description: 'Please confirm you have reviewed our Terms of Service, Privacy Policy, and Cookie Policy before continuing.',
        variant: 'destructive',
      });
      return;
    }
    navigate('/dashboard');
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>
              <CardDescription>Complete your profile to get started</CardDescription>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <User className="mx-auto h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold text-foreground">Basic Information</h2>
                <p className="text-muted-foreground">Let's start with your basic details</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">Your email address from your account registration</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth <span className="text-muted-foreground text-sm">(optional)</span></Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Profile Picture <span className="text-muted-foreground text-sm">(optional)</span></Label>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    {profilePictureFile ? (
                      <AvatarImage src={URL.createObjectURL(profilePictureFile)} />
                    ) : (
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <FileUpload
                    onFileSelect={setProfilePictureFile}
                    accept="image/*"
                    maxSize={5}
                    placeholder="Upload profile picture"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <User className="mx-auto h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold text-foreground">Citizenship & Passports</h2>
                <p className="text-muted-foreground">Your citizenship information</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <CountrySelect
                  value={nationality}
                  onValueChange={setNationality}
                  placeholder="Select your nationality"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dualNationality"
                  checked={hasDualNationality}
                  onCheckedChange={(checked) => setHasDualNationality(checked as boolean)}
                />
                <Label htmlFor="dualNationality" className="cursor-pointer">
                  I have dual citizenship
                </Label>
              </div>

              {hasDualNationality && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="secondNationality">Second Nationality</Label>
                    <CountrySelect
                      value={secondNationality}
                      onValueChange={setSecondNationality}
                      placeholder="Select your second nationality"
                    />
                  </div>

                  {secondNationality === 'TR' && (
                    <div className="space-y-2">
                      <Label htmlFor="nufusDocument">Nüfus Kayıt Örneği (National ID Document)</Label>
                      <FileUpload
                        onFileSelect={setNationalDocumentFile}
                        accept=".pdf,.jpg,.jpeg,.png"
                        maxSize={10}
                        placeholder="Upload Nüfus Kayıt Örneği"
                      />
                      <p className="text-sm text-muted-foreground">Required for Turkish nationals</p>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="passportNumber">Passport Number</Label>
                <Input
                  id="passportNumber"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="Enter your passport number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passportDocument">Passport Document</Label>
                <FileUpload
                  onFileSelect={setPassportDocumentFile}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  placeholder="Upload passport document"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <User className="mx-auto h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold text-foreground">Contact & Address</h2>
                <p className="text-muted-foreground">How can we reach you?</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Code</Label>
                  <Input
                    id="countryCode"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    placeholder="+90"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Enter your street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Enter your state"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Enter postal code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <CountrySelect
                    value={country}
                    onValueChange={setCountry}
                    placeholder="Select country"
                  />
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-md border p-4">
                <Checkbox
                  id="onboarding-policies"
                  checked={policiesAccepted}
                  onCheckedChange={(checked) => setPoliciesAccepted(Boolean(checked))}
                />
                <Label htmlFor="onboarding-policies" className="text-sm font-normal leading-relaxed">
                  I confirm that I have read and agree to the{' '}
                  <Link to="/terms" className="underline">Terms of Service</Link>,{' '}
                  <Link to="/privacy" className="underline">Privacy Policy</Link>, and{' '}
                  <Link to="/cookies" className="underline">Cookie Policy</Link>.
                </Label>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for Now
              </Button>
              <Button onClick={handleNext} disabled={saving}>
                {saving ? 'Saving...' : currentStep === totalSteps ? 'Continue to Academic' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
