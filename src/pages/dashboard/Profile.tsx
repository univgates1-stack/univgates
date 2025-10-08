import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, GraduationCap, Plus, Trash2, Upload, FileText, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CountrySelect } from '@/components/CountrySelect';
import { useUserRole } from '@/hooks/useUserRole';
import UniversityOfficialProfile from '@/components/dashboard/UniversityOfficialProfile';
import type { Database } from '@/integrations/supabase/types';
<<<<<<< HEAD
import { useTranslation } from 'react-i18next';
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051

type StudentRow = Database['public']['Tables']['students']['Row'];
type StudentExamDocumentRow = Database['public']['Tables']['student_exam_documents']['Row'];
type DocumentRow = Database['public']['Tables']['documents']['Row'];
type DocumentTypeRow = Database['public']['Tables']['document_types']['Row'];
type StudentDegreeRow = Database['public']['Tables']['student_degrees']['Row'];
type StudentPassportRow = Database['public']['Tables']['student_passports']['Row'];

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  language_preference?: string | null;
  profile_picture_url?: string | null;
}

interface AddressForm {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface PhoneForm {
  countryCode: string;
  phoneNumber: string;
}

const formatDateForInput = (value?: string | null) => {
  if (!value) return '';
  return value.split('T')[0];
};

const Profile = () => {
  const { role } = useUserRole();
<<<<<<< HEAD
  const { i18n } = useTranslation();
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [studentData, setStudentData] = useState<StudentRow | null>(null);
  const [address, setAddress] = useState<AddressForm>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [phone, setPhone] = useState<PhoneForm>({
    countryCode: '+90',
    phoneNumber: '',
  });
  const [examDocuments, setExamDocuments] = useState<StudentExamDocumentRow[]>([]);
  const [showAddExam, setShowAddExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [newExam, setNewExam] = useState({
    examName: '',
    score: '',
    examDate: '',
  });
  const [examFile, setExamFile] = useState<File | null>(null);
  const [uploadingExam, setUploadingExam] = useState(false);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeRow[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
<<<<<<< HEAD

  useEffect(() => {
    const languageCode = i18n.language.split('-')[0];
    setUserData(prev => (prev ? { ...prev, language_preference: languageCode } : prev));
  }, [i18n.language]);
=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
  
  // New states for multiple passports and degrees
  const [passports, setPassports] = useState<StudentPassportRow[]>([]);
  const [degrees, setDegrees] = useState<StudentDegreeRow[]>([]);
  const [showAddPassport, setShowAddPassport] = useState(false);
  const [showAddDegree, setShowAddDegree] = useState(false);
  const [editingPassportId, setEditingPassportId] = useState<string | null>(null);
  const [editingDegreeId, setEditingDegreeId] = useState<string | null>(null);
  const [newDegree, setNewDegree] = useState({
    schoolName: '',
    studyLevel: '',
    graduationDate: '',
    degreeGrade: '',
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [uploadingPassport, setUploadingPassport] = useState(false);
  
  const { toast } = useToast();

  const examTypes = [
    'SAT',
    'TOEFL',
    'IELTS',
    'GRE',
    'GMAT',
    'ACT',
    'YDS',
    'YÖKDİL',
    'Other'
  ];

  // Fetch only documents - separate from other data
  const fetchDocuments = useCallback(async (studentId: string) => {
    try {
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('student_id', studentId);

      if (!docsError && docsData) {
        setDocuments(docsData);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, []);

  // Fetch passports
  const fetchPassports = useCallback(async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_passports')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setPassports(data);
      }
    } catch (error) {
      console.error('Error fetching passports:', error);
    }
  }, []);

  // Fetch degrees
  const fetchDegrees = useCallback(async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_degrees')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setDegrees(data);
      }
    } catch (error) {
      console.error('Error fetching degrees:', error);
    }
  }, []);

  // Helper function to update current_study_level based on latest degree
  const updateCurrentStudyLevel = useCallback(async (studentId: string) => {
    try {
      // Fetch all degrees for this student
      const { data: degrees, error: fetchError } = await supabase
        .from('student_degrees')
        .select('study_level, graduation_date')
        .eq('student_id', studentId)
        .order('graduation_date', { ascending: false, nullsFirst: false });

      if (fetchError) throw fetchError;

      // Get the most recent degree's study level
      const latestStudyLevel = degrees && degrees.length > 0 ? degrees[0].study_level : null;

      // Update the students table
      const { error: updateError } = await supabase
        .from('students')
        .update({ current_study_level: latestStudyLevel })
        .eq('id', studentId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating current study level:', error);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error) {
        if (error.name === 'AuthSessionMissingError' || error.message?.toLowerCase().includes('auth session missing')) {
          return;
        }
        throw error;
      }

      const user = authData.user;
      if (!user) return;

      // Fetch user data
      const { data: userRecord } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

<<<<<<< HEAD
      const preferredLanguage = userRecord?.language_preference ?? 'en';

=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
      setUserData({
        id: user.id,
        email: userRecord?.email ?? user.email ?? '',
        first_name: userRecord?.first_name ?? '',
        last_name: userRecord?.last_name ?? '',
<<<<<<< HEAD
        language_preference: preferredLanguage,
        profile_picture_url: userRecord?.profile_picture_url ?? null,
      });

      await i18n.changeLanguage(preferredLanguage);

=======
        language_preference: userRecord?.language_preference ?? 'en',
        profile_picture_url: userRecord?.profile_picture_url ?? null,
      });

>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
      // Fetch student data
      const { data: studentRecord } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentRecord) {
        setStudentData(studentRecord);

        // Fetch address
        const { data: addressData } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('address_type', 'primary')
          .single();

        if (addressData) {
          setAddress({
            street: addressData.street ?? '',
            city: addressData.city ?? '',
            state: addressData.state ?? '',
            postalCode: addressData.postal_code ?? '',
            country: addressData.country ?? '',
          });
        }

        // Fetch phone
        const { data: phoneData } = await supabase
          .from('phones')
          .select('*')
          .eq('user_id', user.id)
          .eq('phone_type', 'mobile')
          .single();

        if (phoneData) {
          setPhone({
            countryCode: phoneData.country_code ?? '+90',
            phoneNumber: phoneData.phone_number ?? '',
          });
        }

        // Fetch exam documents
        const { data: examDocs } = await supabase
          .from('student_exam_documents')
          .select('*')
          .eq('student_id', studentRecord.id);

        if (examDocs) {
          setExamDocuments(examDocs);
        }

        // Fetch all related data
        await fetchDocuments(studentRecord.id);
        await fetchPassports(studentRecord.id);
        await fetchDegrees(studentRecord.id);
        
        // Update current_study_level based on latest degree
        await updateCurrentStudyLevel(studentRecord.id);
      }

      // Fetch document types
      const { data: typesData, error: typesError } = await supabase
        .from('document_types')
        .select('*');

      if (!typesError && typesData) {
        setDocumentTypes(typesData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error loading profile',
        description: error instanceof Error ? error.message : 'Unable to load profile information.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
<<<<<<< HEAD
  }, [toast, fetchDocuments, fetchPassports, fetchDegrees, updateCurrentStudyLevel, i18n]);
=======
  }, [toast, fetchDocuments, fetchPassports, fetchDegrees, updateCurrentStudyLevel]);
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Passport handlers
  const handleAddPassport = async (passportNumber: string, nationality: string, expiryDate: string) => {
    if (!studentData || !passportNumber || !nationality) {
      toast({
        title: "Validation Error",
        description: "Please fill in passport number and nationality",
        variant: "destructive",
      });
      return;
    }

    setUploadingPassport(true);
    try {
      let passportDocId: string | null = null;

      // Upload passport document if provided
      if (passportFile && userData) {
        const fileExt = passportFile.name.split('.').pop();
        const fileName = `${userData.id}/passport_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, passportFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        // Create a document record
        const passportDocType = documentTypes.find(dt => dt.name.toLowerCase().includes('passport'));
        if (passportDocType) {
          const { data: insertedDoc, error: insertError } = await supabase
            .from('documents')
            .insert({
              student_id: studentData.id,
              doc_type_id: passportDocType.id,
              file_name: passportFile.name,
              file_url: publicUrl,
              application_id: null,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          passportDocId = insertedDoc?.id || null;
        }
      }

      const { error } = await supabase
        .from('student_passports')
        .insert({
          student_id: studentData.id,
          passport_number: passportNumber,
          nationality: nationality,
          expiry_date: expiryDate || null,
          passport_doc_id: passportDocId,
        });

      if (error) throw error;

      toast({
        title: "Passport Added",
        description: "Your passport information has been saved.",
      });

      setShowAddPassport(false);
      setPassportFile(null);
      await fetchPassports(studentData.id);
    } catch (error) {
      toast({
        title: "Error adding passport",
        description: error instanceof Error ? error.message : 'Unable to save passport.',
        variant: "destructive",
      });
    } finally {
      setUploadingPassport(false);
    }
  };

  const handleDeletePassport = async (passportId: string) => {
    try {
      const { error } = await supabase
        .from('student_passports')
        .delete()
        .eq('id', passportId);

      if (error) throw error;

      toast({
        title: "Passport Deleted",
        description: "Passport information has been removed.",
      });

      if (studentData) {
        await fetchPassports(studentData.id);
      }
    } catch (error) {
      toast({
        title: "Error deleting passport",
        description: error instanceof Error ? error.message : 'Unable to delete passport.',
        variant: "destructive",
      });
    }
  };

  // Degree handlers
  const handleAddDegree = async () => {
    if (!studentData || !newDegree.schoolName || !newDegree.studyLevel) {
      toast({
        title: "Validation Error",
        description: "Please fill in school name and study level",
        variant: "destructive",
      });
      return;
    }

<<<<<<< HEAD
    const gradeNumber = newDegree.degreeGrade === '' ? null : Number(newDegree.degreeGrade);
    if (
      gradeNumber !== null &&
      (Number.isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > 100)
    ) {
      toast({
        title: "Grade out of range",
        description: "Please enter the equivalent of your grade on a 0-100 scale.",
        variant: "destructive",
      });
      return;
    }

=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
    try {
      const { error } = await supabase
        .from('student_degrees')
        .insert({
          student_id: studentData.id,
          school_name: newDegree.schoolName,
          study_level: newDegree.studyLevel,
          graduation_date: newDegree.graduationDate || null,
<<<<<<< HEAD
          degree_grade: gradeNumber,
=======
          degree_grade: newDegree.degreeGrade ? Number(newDegree.degreeGrade) : null,
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
        });

      if (error) throw error;

      // Update current_study_level based on latest degree
      await updateCurrentStudyLevel(studentData.id);

      toast({
        title: "Degree Added",
        description: "Your degree information has been saved.",
      });

      setNewDegree({ schoolName: '', studyLevel: '', graduationDate: '', degreeGrade: '' });
      setShowAddDegree(false);
      await fetchDegrees(studentData.id);
    } catch (error) {
      toast({
        title: "Error adding degree",
        description: error instanceof Error ? error.message : 'Unable to save degree.',
        variant: "destructive",
      });
    }
  };

  const handleDeleteDegree = async (degreeId: string) => {
    try {
      const { error } = await supabase
        .from('student_degrees')
        .delete()
        .eq('id', degreeId);

      if (error) throw error;

      // Update current_study_level after deletion
      if (studentData) {
        await updateCurrentStudyLevel(studentData.id);
      }

      toast({
        title: "Degree Deleted",
        description: "Degree information has been removed.",
      });

      if (studentData) {
        await fetchDegrees(studentData.id);
      }
    } catch (error) {
      toast({
        title: "Error deleting degree",
        description: error instanceof Error ? error.message : 'Unable to delete degree.',
        variant: "destructive",
      });
    }
  };

  const handleAddExam = async () => {
    if (!userData || !studentData || !newExam.examName || !newExam.score || !newExam.examDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all exam fields",
        variant: "destructive",
      });
      return;
    }

    setUploadingExam(true);
    try {
      let fileUrl = null;

      if (examFile) {
        const fileExt = examFile.name.split('.').pop();
        const fileName = `${userData.id}/${newExam.examName}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, examFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('student_exam_documents')
        .insert({
          student_id: studentData.id,
          exam_name: newExam.examName,
          exam_score: newExam.score,
          exam_date: newExam.examDate,
          file_url: fileUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: "Exam Added",
        description: "Your exam information has been saved successfully.",
      });

      setNewExam({ examName: '', score: '', examDate: '' });
      setExamFile(null);
      setShowAddExam(false);

      // Refresh exam documents
      const { data: examDocs } = await supabase
        .from('student_exam_documents')
        .select('*')
        .eq('student_id', studentData.id);
      if (examDocs) setExamDocuments(examDocs);
    } catch (error) {
      toast({
        title: "Error adding exam",
        description: error instanceof Error ? error.message : 'Unable to save exam information.',
        variant: "destructive",
      });
    } finally {
      setUploadingExam(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      const { error } = await supabase
        .from('student_exam_documents')
        .delete()
        .eq('id', examId);

      if (error) throw error;

      toast({
        title: "Exam Deleted",
        description: "Exam information has been removed.",
      });

      if (studentData) {
        const { data: examDocs } = await supabase
          .from('student_exam_documents')
          .select('*')
          .eq('student_id', studentData.id);
        if (examDocs) setExamDocuments(examDocs);
      }
    } catch (error) {
      toast({
        title: "Error deleting exam",
        description: error instanceof Error ? error.message : 'Unable to delete exam.',
        variant: "destructive",
      });
    }
  };

  const handleViewDocument = async (fileUrl: string) => {
    try {
      const urlParts = fileUrl.split('/documents/');
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL');
      }
      const filePath = urlParts[1];

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to view document",
        variant: "destructive",
      });
    }
  };

  const handleUpdateExam = async (examId: string, score: string, examDate: string) => {
    try {
      const { error } = await supabase
        .from('student_exam_documents')
        .update({
          exam_score: score,
          exam_date: examDate,
        })
        .eq('id', examId);

      if (error) throw error;

      toast({
        title: "Exam Updated",
        description: "Exam information has been updated successfully.",
      });

      setEditingExamId(null);
      if (studentData) {
        const { data: examDocs } = await supabase
          .from('student_exam_documents')
          .select('*')
          .eq('student_id', studentData.id);
        if (examDocs) setExamDocuments(examDocs);
      }
    } catch (error) {
      toast({
        title: "Error updating exam",
        description: error instanceof Error ? error.message : 'Unable to update exam.',
        variant: "destructive",
      });
    }
  };

  const handleUploadDocument = async (docTypeId: string, file: File, degreeId?: string) => {
    if (!userData || !studentData) return;

    setUploadingDocument(docTypeId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.id}/${docTypeId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { data: insertedDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          student_id: studentData.id,
          doc_type_id: docTypeId,
          file_name: file.name,
          file_url: publicUrl,
          application_id: null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // If this is a degree certificate, link it to the degree
      if (degreeId && insertedDoc) {
        const { error: updateError } = await supabase
          .from('student_degrees')
          .update({ degree_certificate_doc_id: insertedDoc.id })
          .eq('id', degreeId);

        if (updateError) throw updateError;
        
        // Refresh degrees to get the updated link
        await fetchDegrees(studentData.id);
      }

      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });

      // Only refresh documents, not all data!
      await fetchDocuments(studentData.id);
    } catch (error) {
      toast({
        title: "Error uploading document",
        description: error instanceof Error ? error.message : 'Unable to upload document.',
        variant: "destructive",
      });
    } finally {
      setUploadingDocument(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: "Document Deleted",
        description: "Document has been removed.",
      });

      if (studentData) {
        await fetchDocuments(studentData.id);
      }
    } catch (error) {
      toast({
        title: "Error deleting document",
        description: error instanceof Error ? error.message : 'Unable to delete document.',
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!userData || !studentData) return;

    setSaving(true);
    try {
      // Update user data
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: userData.first_name,
          last_name: userData.last_name,
          language_preference: userData.language_preference ?? 'en',
        })
        .eq('id', userData.id);

      if (userError) throw userError;

      // Update student data
      const { error: studentError } = await supabase
        .from('students')
        .update({
          country_of_origin: studentData.country_of_origin?.trim() || null,
          country_of_birth: studentData.country_of_birth?.trim() || null,
          current_country: studentData.current_country?.trim() || null,
          has_dual_citizenship: studentData.has_dual_citizenship,
          date_of_birth: studentData.date_of_birth || null,
        })
        .eq('user_id', studentData.user_id);

      if (studentError) throw studentError;

      // Update or insert address
      const addressPayload = {
        user_id: userData.id,
        address_type: 'primary',
        street: address.street.trim() || null,
        city: address.city.trim() || null,
        state: address.state.trim() || null,
        postal_code: address.postalCode.trim() || null,
        country: address.country.trim() || null,
      };

      console.log('Saving address with country:', addressPayload);

      const { error: addressError } = await supabase
        .from('addresses')
        .upsert(addressPayload, {
          onConflict: 'user_id,address_type'
        });

      if (addressError) {
        console.error('Address save error:', addressError);
        throw addressError;
      }

      // Update or insert phone
      const { error: phoneError } = await supabase
        .from('phones')
        .upsert({
          user_id: userData.id,
          phone_type: 'mobile',
          country_code: phone.countryCode.trim() || null,
          phone_number: phone.phoneNumber.trim() || null,
        }, {
          onConflict: 'user_id,phone_type'
        });

      if (phoneError) throw phoneError;

<<<<<<< HEAD
      await i18n.changeLanguage(userData.language_preference ?? 'en');

=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: error instanceof Error ? error.message : 'Unable to save your profile. Please try again.',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
  }

  // If university official, show their profile
  if (role === 'university_official') {
    return <UniversityOfficialProfile />;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and personal information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Photo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData?.profile_picture_url ?? undefined} />
              <AvatarFallback className="text-lg">
                {userData?.first_name?.charAt(0)}{userData?.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              Change Photo
            </Button>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={userData?.first_name || ''}
                  onChange={(e) => setUserData(prev => prev ? {...prev, first_name: e.target.value} : null)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={userData?.last_name || ''}
                  onChange={(e) => setUserData(prev => prev ? {...prev, last_name: e.target.value} : null)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formatDateForInput(studentData?.date_of_birth)}
                onChange={(e) => setStudentData(prev => prev ? { ...prev, date_of_birth: e.target.value || null } : prev)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={userData?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={userData?.language_preference || 'en'}
<<<<<<< HEAD
                onValueChange={(value) => {
                  setUserData(prev => (prev ? { ...prev, language_preference: value } : null));
                  void i18n.changeLanguage(value);
                }}
=======
                onValueChange={(value) => setUserData(prev => prev ? {...prev, language_preference: value} : null)}
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tr">Turkish</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Citizenship & Nationality with Passports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Citizenship & Passports</span>
          </CardTitle>
          <CardDescription>
            Your citizenship information and passport details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originCountry">Primary Nationality (Citizenship)</Label>
              <Input
                id="originCountry"
                value={studentData?.country_of_origin || ''}
                onChange={(e) => setStudentData(prev => prev ? {...prev, country_of_origin: e.target.value} : null)}
                placeholder="Enter your nationality"
              />
              <p className="text-xs text-muted-foreground">The country you are a citizen of</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthCountry">Country of Birth</Label>
              <Input
                id="birthCountry"
                value={studentData?.country_of_birth || ''}
                onChange={(e) => setStudentData(prev => prev ? {...prev, country_of_birth: e.target.value} : null)}
                placeholder="Enter country where you were born"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dualCitizenship"
              checked={studentData?.has_dual_citizenship || false}
              onChange={(e) => setStudentData(prev => prev ? {...prev, has_dual_citizenship: e.target.checked} : null)}
              className="rounded border-input"
            />
            <Label htmlFor="dualCitizenship">I have dual citizenship</Label>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Passport Information</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddPassport(!showAddPassport)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Passport
              </Button>
            </div>

            {showAddPassport && (
              <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassportNumber">Passport Number</Label>
                    <Input
                      id="newPassportNumber"
                      placeholder="Enter passport number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassportNationality">Nationality</Label>
                    <Input
                      id="newPassportNationality"
                      placeholder="Enter nationality"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassportExpiry">Expiry Date (Optional)</Label>
                  <Input
                    id="newPassportExpiry"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportFile">Passport Document (Optional)</Label>
                  <Input
                    id="passportFile"
                    type="file"
                    onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-muted-foreground">Upload a copy of your passport (PDF, JPG, or PNG - Max 5MB)</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      const passportNum = (document.getElementById('newPassportNumber') as HTMLInputElement).value;
                      const nationality = (document.getElementById('newPassportNationality') as HTMLInputElement).value;
                      const expiry = (document.getElementById('newPassportExpiry') as HTMLInputElement).value;
                      handleAddPassport(passportNum, nationality, expiry);
                    }}
                    disabled={uploadingPassport}
                  >
                    {uploadingPassport ? 'Saving...' : 'Save Passport'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddPassport(false);
                      setPassportFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {passports.length === 0 && !showAddPassport ? (
              <p className="text-sm text-muted-foreground">No passports recorded yet. Click "Add Passport" to add your passport information.</p>
            ) : (
              <div className="space-y-3">
                {passports.map((passport) => {
                  const passportDoc = passport.passport_doc_id 
                    ? documents.find(d => d.id === passport.passport_doc_id)
                    : null;

                  return (
                    <div key={passport.id} className="rounded-lg border border-border p-4 bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-foreground">{passport.nationality}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">Number: {passport.passport_number}</p>
                          {passport.expiry_date && (
                            <p className="text-sm text-muted-foreground">
                              Expires: {new Date(passport.expiry_date).toLocaleDateString()}
                            </p>
                          )}
                          {passportDoc && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => handleViewDocument(passportDoc.file_url)}
                              className="text-primary text-sm underline p-0 h-auto mt-1"
                            >
                              View Passport Document
                            </Button>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePassport(passport.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Information - Multiple Degrees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Academic Information</span>
          </CardTitle>
          <CardDescription>
            Your educational background and degree details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Degrees</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddDegree(!showAddDegree)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Degree
            </Button>
          </div>

          {showAddDegree && (
            <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="newSchoolName">School/University Name</Label>
                <Input
                  id="newSchoolName"
                  placeholder="Enter school or university name"
                  value={newDegree.schoolName}
                  onChange={(e) => setNewDegree(prev => ({ ...prev, schoolName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newStudyLevel">Study Level</Label>
                  <Select
                    value={newDegree.studyLevel}
                    onValueChange={(value) => setNewDegree(prev => ({ ...prev, studyLevel: value }))}
                  >
                    <SelectTrigger id="newStudyLevel">
                      <SelectValue placeholder="Select study level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newGraduationDate">Graduation Date</Label>
                  <Input
                    id="newGraduationDate"
                    type="date"
                    value={newDegree.graduationDate}
                    onChange={(e) => setNewDegree(prev => ({ ...prev, graduationDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
<<<<<<< HEAD
                <Label htmlFor="newDegreeGrade">Degree Grade (out of 100)</Label>
=======
                <Label htmlFor="newDegreeGrade">Degree Grade/GPA (Optional)</Label>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                <Input
                  id="newDegreeGrade"
                  type="number"
                  step="0.01"
<<<<<<< HEAD
                  min={0}
                  max={100}
                  placeholder="Enter your final grade out of 100"
                  value={newDegree.degreeGrade}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setNewDegree(prev => ({ ...prev, degreeGrade: '' }));
                      return;
                    }
                    const parsed = Number(raw);
                    if (Number.isNaN(parsed)) return;
                    const clamped = Math.max(0, Math.min(100, parsed));
                    setNewDegree(prev => ({ ...prev, degreeGrade: clamped.toString() }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  If your institution uses another grading system, convert it to the equivalent value out of 100 before entering it here.
                </p>
=======
                  placeholder="Enter your final grade or GPA"
                  value={newDegree.degreeGrade}
                  onChange={(e) => setNewDegree(prev => ({ ...prev, degreeGrade: e.target.value }))}
                />
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddDegree}
                >
                  Save Degree
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDegree(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {degrees.length === 0 && !showAddDegree ? (
            <p className="text-sm text-muted-foreground">No degrees recorded yet. Click "Add Degree" to add your educational background.</p>
          ) : (
            <div className="space-y-4">
              {degrees.map((degree) => (
                <div key={degree.id} className="rounded-lg border border-border p-4 bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-foreground">{degree.school_name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Level: {degree.study_level?.replace('_', ' ').toUpperCase()}</p>
                      {degree.graduation_date && (
                        <p className="text-sm text-muted-foreground">
                          Graduated: {new Date(degree.graduation_date).toLocaleDateString()}
                        </p>
                      )}
<<<<<<< HEAD
                      {degree.degree_grade !== null && degree.degree_grade !== undefined && (
                        <p className="text-sm text-muted-foreground">Grade (out of 100): {degree.degree_grade}</p>
=======
                      {degree.degree_grade && (
                        <p className="text-sm text-muted-foreground">Grade: {degree.degree_grade}</p>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDegree(degree.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Degree Certificate Upload */}
                  <div className="space-y-2 pt-3 border-t">
                    <Label>Degree Certificate</Label>
                    <p className="text-xs text-muted-foreground mb-2">Upload official document showing this degree</p>
                    {(() => {
                      const degreeDocType = documentTypes.find(dt => dt.name === 'Degree Grade Certificate');
                      if (!degreeDocType) return null;
                      
                      const existingDoc = degree.degree_certificate_doc_id 
                        ? documents.find(d => d.id === degree.degree_certificate_doc_id)
                        : null;
                      
                      return existingDoc ? (
                        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{existingDoc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded {new Date(existingDoc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(existingDoc.file_url)}
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(existingDoc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadDocument(degreeDocType.id, file, degree.id);
                            }}
                            disabled={uploadingDocument === degreeDocType.id}
                          />
                          {uploadingDocument === degreeDocType.id && (
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standardized Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Standardized Exams</span>
          </CardTitle>
          <CardDescription>
            Add your standardized test scores (SAT, TOEFL, IELTS, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddExam(!showAddExam)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exam
              </Button>
            </div>

            {showAddExam && (
              <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="examType">Exam Type</Label>
                    <Select value={newExam.examName} onValueChange={(value) => setNewExam(prev => ({ ...prev, examName: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam type" />
                      </SelectTrigger>
                      <SelectContent>
                        {examTypes.map((exam) => (
                          <SelectItem key={exam} value={exam}>
                            {exam}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="examScore">Score</Label>
                    <Input
                      id="examScore"
                      value={newExam.score}
                      onChange={(e) => setNewExam(prev => ({ ...prev, score: e.target.value }))}
                      placeholder="Enter your score"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examDate">Exam Date</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={newExam.examDate}
                    onChange={(e) => setNewExam(prev => ({ ...prev, examDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examFile">Upload Document (Optional)</Label>
                  <Input
                    id="examFile"
                    type="file"
                    onChange={(e) => setExamFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-muted-foreground">PDF, JPG, or PNG (Max 5MB)</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddExam}
                    disabled={uploadingExam}
                  >
                    {uploadingExam ? 'Saving...' : 'Save Exam'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddExam(false);
                      setNewExam({ examName: '', score: '', examDate: '' });
                      setExamFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {examDocuments.length === 0 && !showAddExam ? (
              <p className="text-sm text-muted-foreground">No exams recorded yet. Click "Add Exam" to add your exam scores.</p>
            ) : (
              <div className="space-y-3">
                {examDocuments.map((exam) => (
                  <div key={exam.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-foreground">{exam.exam_name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Score: {exam.exam_score ?? 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Date: {exam.exam_date ?? 'N/A'}</p>
                        {exam.file_url && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => handleViewDocument(exam.file_url!)}
                            className="text-primary text-sm underline p-0 h-auto mt-1"
                          >
                            View Document
                          </Button>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExam(exam.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Academic Documents</span>
          </CardTitle>
          <CardDescription>
            Upload your required academic documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentTypes
            .filter(dt => 
              dt.name !== 'Other' && 
              dt.name !== 'Nüfus Kayıt Örneği' && 
              dt.name !== 'Degree Grade Certificate' &&
              !dt.name.toLowerCase().includes('passport')
            )
            .map((docType) => {
              const existingDoc = documents.find(d => d.doc_type_id === docType.id);
              
              return (
                <div key={docType.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">{docType.name}</h4>
                      {docType.description && (
                        <p className="text-sm text-muted-foreground">{docType.description}</p>
                      )}
                    </div>
                  </div>

                  {existingDoc ? (
                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{existingDoc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(existingDoc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(existingDoc.file_url)}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(existingDoc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDocument(docType.id, file);
                        }}
                        disabled={uploadingDocument === docType.id}
                      />
                      {uploadingDocument === docType.id && (
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          
          {/* Turkish Registry Document - only if dual citizenship with Turkish nationality */}
          {studentData?.has_dual_citizenship && 
           (studentData?.country_of_origin?.toLowerCase().includes('turkey') || 
            studentData?.country_of_origin?.toLowerCase().includes('türkiye') ||
            studentData?.country_of_birth?.toLowerCase().includes('turkey') ||
            studentData?.country_of_birth?.toLowerCase().includes('türkiye')) && (() => {
              const turkishDocType = documentTypes.find(dt => dt.name === 'Nüfus Kayıt Örneği');
              if (!turkishDocType) return null;
              
              const existingDoc = documents.find(d => d.doc_type_id === turkishDocType.id);
              
              return (
                <div className="rounded-lg border border-border p-4 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">{turkishDocType.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Required for students with Turkish nationality
                      </p>
                    </div>
                  </div>

                  {existingDoc ? (
                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{existingDoc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(existingDoc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(existingDoc.file_url)}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(existingDoc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDocument(turkishDocType.id, file);
                        }}
                        disabled={uploadingDocument === turkishDocType.id}
                      />
                      {uploadingDocument === turkishDocType.id && (
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
        </CardContent>
      </Card>

      {/* Additional Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Additional Documents</span>
          </CardTitle>
          <CardDescription>
            Upload supplementary documents such as CV, recommendation letters, or other supporting materials (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const otherDocType = documentTypes.find(dt => dt.name === 'Other');
            if (!otherDocType) return null;
            
            const additionalDocs = documents.filter(d => d.doc_type_id === otherDocType.id);
            
            return (
              <>
                <div className="space-y-3">
                  {additionalDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc.file_url)}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additionalDoc">Upload Additional Document</Label>
                  <Input
                    id="additionalDoc"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDocument(otherDocType.id, file);
                    }}
                    disabled={uploadingDocument === otherDocType.id}
                  />
                  {uploadingDocument === otherDocType.id && (
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG, DOC, or DOCX files accepted
                  </p>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Contact & Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Contact & Address</span>
          </CardTitle>
          <CardDescription>
            Keep your contact and address details up to date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="countryCode">Country Code</Label>
              <Input
                id="countryCode"
                value={phone.countryCode}
                onChange={(e) => setPhone((prev) => ({ ...prev, countryCode: e.target.value }))}
                placeholder="+90"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={phone.phoneNumber}
                onChange={(e) => setPhone((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
              placeholder="Enter your street address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="Enter your city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={address.state}
                onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                placeholder="Enter your state or province"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={address.postalCode}
                onChange={(e) => setAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                placeholder="Enter your postal code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCountry">Country</Label>
              <CountrySelect
                value={address.country}
                onValueChange={(value) => setAddress((prev) => ({ ...prev, country: value }))}
                placeholder="Select your country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          size="lg"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
