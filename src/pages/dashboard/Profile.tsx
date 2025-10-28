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
import { useTranslation } from 'react-i18next';
import { getOrCreateCountryId, getOrCreateCityId } from '@/utils/countryUtils';

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
  const { i18n } = useTranslation();
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
  const isTurkish = i18n.language.split('-')[0] === 'tr';
  const translate = useCallback(
    (english: string, turkish: string) => (isTurkish ? turkish : english),
    [isTurkish]
  );
  const getDocumentTypeLocalization = useCallback(
    (docType: DocumentTypeRow) => {
      const localized = {
        'Academic Transcript': {
          name: 'Akademik Transkript',
          description: 'Resmi akademik performans belgesi',
        },
        'Diploma/Certificate': {
          name: 'Diploma/Sertifika',
          description: 'Diplomanızı veya sertifikanızı doğrulayan belge',
        },
        'Degree Grade Certificate': {
          name: 'Diploma Not Belgesi',
          description: 'Diploma not ortalamanızı gösteren resmi belge',
        },
        Other: {
          name: 'Diğer',
        },
      } as Record<string, { name: string; description?: string }>;

      if (!isTurkish) {
        return {
          name: docType.name,
          description: docType.description,
        };
      }

      const match = localized[docType.name];
      return {
        name: match?.name ?? docType.name,
        description: match?.description ?? docType.description,
      };
    },
    [isTurkish]
  );

  useEffect(() => {
    const languageCode = i18n.language.split('-')[0];
    setUserData(prev => (prev ? { ...prev, language_preference: languageCode } : prev));
  }, [i18n.language]);
  
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

      const preferredLanguage = userRecord?.language_preference ?? 'en';

      setUserData({
        id: user.id,
        email: userRecord?.email ?? user.email ?? '',
        first_name: userRecord?.first_name ?? '',
        last_name: userRecord?.last_name ?? '',
        language_preference: preferredLanguage,
        profile_picture_url: userRecord?.profile_picture_url ?? null,
      });

      await i18n.changeLanguage(preferredLanguage);

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
  }, [toast, fetchDocuments, fetchPassports, fetchDegrees, updateCurrentStudyLevel, i18n]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Passport handlers
  const handleAddPassport = async (passportNumber: string, nationality: string, expiryDate: string) => {
    if (!studentData || !passportNumber || !nationality) {
      toast({
        title: translate('Validation Error', 'Doğrulama Hatası'),
        description: translate('Please fill in passport number and nationality', 'Lütfen pasaport numarası ve uyruğu doldurun'),
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
        const { data: insertedDoc, error: insertError } = await supabase
          .from('documents')
          .insert({
            student_id: studentData.id,
            doc_type_id: passportDocType?.id ?? null,
            file_name: passportFile.name,
            file_url: publicUrl,
            application_id: null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        passportDocId = insertedDoc?.id || null;
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
        title: translate('Passport Added', 'Pasaport Eklendi'),
        description: translate('Your passport information has been saved.', 'Pasaport bilgileriniz kaydedildi.'),
      });

      setShowAddPassport(false);
      setPassportFile(null);
      await fetchPassports(studentData.id);
    } catch (error) {
      toast({
        title: translate('Error adding passport', 'Pasaport eklenirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to save passport.', 'Pasaport kaydedilemedi.'),
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
        title: translate('Passport Deleted', 'Pasaport Silindi'),
        description: translate('Passport information has been removed.', 'Pasaport bilgileriniz kaldırıldı.'),
      });

      if (studentData) {
        await fetchPassports(studentData.id);
      }
    } catch (error) {
      toast({
        title: translate('Error deleting passport', 'Pasaport silinirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to delete passport.', 'Pasaport silinemedi.'),
        variant: "destructive",
      });
    }
  };

  // Degree handlers
  const handleAddDegree = async () => {
    if (!studentData || !newDegree.schoolName || !newDegree.studyLevel) {
      toast({
        title: translate('Validation Error', 'Doğrulama Hatası'),
        description: translate('Please fill in school name and study level', 'Lütfen okul adını ve eğitim seviyesini doldurun'),
        variant: "destructive",
      });
      return;
    }

    const gradeNumber = newDegree.degreeGrade === '' ? null : Number(newDegree.degreeGrade);
    if (
      gradeNumber !== null &&
      (Number.isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > 100)
    ) {
      toast({
        title: translate('Grade out of range', 'Not aralığı dışında'),
        description: translate('Please enter the equivalent of your grade on a 0-100 scale.', 'Lütfen notunuzun 0-100 ölçeğindeki karşılığını girin.'),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('student_degrees')
        .insert({
          student_id: studentData.id,
          school_name: newDegree.schoolName,
          study_level: newDegree.studyLevel,
          graduation_date: newDegree.graduationDate || null,
          degree_grade: gradeNumber,
        });

      if (error) throw error;

      // Update current_study_level based on latest degree
      await updateCurrentStudyLevel(studentData.id);

      toast({
        title: translate('Degree Added', 'Diploma Eklendi'),
        description: translate('Your degree information has been saved.', 'Diploma bilgileriniz kaydedildi.'),
      });

      setNewDegree({ schoolName: '', studyLevel: '', graduationDate: '', degreeGrade: '' });
      setShowAddDegree(false);
      await fetchDegrees(studentData.id);
    } catch (error) {
      toast({
        title: translate('Error adding degree', 'Diploma eklenirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to save degree.', 'Diploma kaydedilemedi.'),
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
        title: translate('Degree Deleted', 'Diploma Silindi'),
        description: translate('Degree information has been removed.', 'Diploma bilgileriniz kaldırıldı.'),
      });

      if (studentData) {
        await fetchDegrees(studentData.id);
      }
    } catch (error) {
      toast({
        title: translate('Error deleting degree', 'Diploma silinirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to delete degree.', 'Diploma silinemedi.'),
        variant: "destructive",
      });
    }
  };

  const handleAddExam = async () => {
    if (!userData || !studentData || !newExam.examName || !newExam.score || !newExam.examDate) {
      toast({
        title: translate('Validation Error', 'Doğrulama Hatası'),
        description: translate('Please fill in all exam fields', 'Lütfen tüm sınav alanlarını doldurun'),
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
        title: translate('Exam Added', 'Sınav Eklendi'),
        description: translate('Your exam information has been saved successfully.', 'Sınav bilgileriniz başarıyla kaydedildi.'),
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
        title: translate('Error adding exam', 'Sınav eklenirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to save exam information.', 'Sınav bilgileri kaydedilemedi.'),
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
        title: translate('Exam Deleted', 'Sınav Silindi'),
        description: translate('Exam information has been removed.', 'Sınav bilgileriniz kaldırıldı.'),
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
        title: translate('Error deleting exam', 'Sınav silinirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to delete exam.', 'Sınav silinemedi.'),
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
        title: translate('Error', 'Hata'),
        description: error.message || translate('Failed to view document', 'Belge görüntülenemedi'),
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
        title: translate('Exam Updated', 'Sınav Güncellendi'),
        description: translate('Exam information has been updated successfully.', 'Sınav bilgileriniz başarıyla güncellendi.'),
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
        title: translate('Error updating exam', 'Sınav güncellenirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to update exam.', 'Sınav güncellenemedi.'),
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
        title: translate('Document Uploaded', 'Belge Yüklendi'),
        description: translate('Your document has been uploaded successfully.', 'Belgeniz başarıyla yüklendi.'),
      });

      // Only refresh documents, not all data!
      await fetchDocuments(studentData.id);
    } catch (error) {
      toast({
        title: translate('Error uploading document', 'Belge yüklenirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to upload document.', 'Belge yüklenemedi.'),
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
        title: translate('Document Deleted', 'Belge Silindi'),
        description: translate('Document has been removed.', 'Belge kaldırıldı.'),
      });

      if (studentData) {
        await fetchDocuments(studentData.id);
      }
    } catch (error) {
      toast({
        title: translate('Error deleting document', 'Belge silinirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to delete document.', 'Belge silinemedi.'),
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
      const trimmedCurrentCountry = (studentData.current_country || '').trim();

      const { error: studentError } = await supabase
        .from('students')
        .update({
          country_of_origin: studentData.country_of_origin?.trim() || null,
          country_of_birth: studentData.country_of_birth?.trim() || null,
          current_country: trimmedCurrentCountry || null,
          has_dual_citizenship: studentData.has_dual_citizenship,
          date_of_birth: studentData.date_of_birth || null,
        })
        .eq('user_id', studentData.user_id);

      if (studentError) throw studentError;

      // Update or insert address
      const trimmedCountry = address.country.trim();
      const trimmedCity = address.city.trim();
      const trimmedState = address.state.trim();
      let addressCityId: string | null = null;

      if (trimmedCountry) {
        try {
          const countryId = await getOrCreateCountryId(trimmedCountry);
          if (countryId && trimmedCity) {
            addressCityId = await getOrCreateCityId(countryId, trimmedCity, trimmedState || undefined);
          }
        } catch (cityError) {
          console.error('Failed to resolve profile address city:', cityError);
        }
      }

      const addressPayload = {
        user_id: userData.id,
        address_type: 'primary',
        street: address.street.trim() || null,
        city: trimmedCity || null,
        city_id: addressCityId,
        state: trimmedState || null,
        postal_code: address.postalCode.trim() || null,
        country: trimmedCountry || null,
      };

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

      await i18n.changeLanguage(userData.language_preference ?? 'en');

      toast({
        title: translate('Profile updated', 'Profil güncellendi'),
        description: translate('Your profile has been successfully updated.', 'Profiliniz başarıyla güncellendi.'),
      });
    } catch (error) {
      toast({
        title: translate('Error saving profile', 'Profil kaydedilirken hata oluştu'),
        description: error instanceof Error ? error.message : translate('Unable to save your profile. Please try again.', 'Profiliniz kaydedilemedi. Lütfen tekrar deneyin.'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {translate('Loading profile...', 'Profil yükleniyor...')}
      </div>
    );
  }

  // If university official, show their profile
  if (role === 'university_official') {
    return <UniversityOfficialProfile />;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {translate('Profile Settings', 'Profil Ayarları')}
        </h1>
        <p className="text-muted-foreground">
          {translate('Manage your account settings and personal information', 'Hesap ayarlarınızı ve kişisel bilgilerinizi yönetin')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{translate('Profile Photo', 'Profil Fotoğrafı')}</span>
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
              {translate('Change Photo', 'Fotoğrafı Değiştir')}
            </Button>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{translate('Basic Information', 'Temel Bilgiler')}</CardTitle>
            <CardDescription>
              {translate('Update your personal details and contact information', 'Kişisel ve iletişim bilgilerinizi güncelleyin')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {translate('First Name', 'Ad')}
                </Label>
                <Input
                  id="firstName"
                  value={userData?.first_name || ''}
                  onChange={(e) => setUserData(prev => prev ? {...prev, first_name: e.target.value} : null)}
                  placeholder={translate('Enter your first name', 'Adınızı girin')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {translate('Last Name', 'Soyad')}
                </Label>
                <Input
                  id="lastName"
                  value={userData?.last_name || ''}
                  onChange={(e) => setUserData(prev => prev ? {...prev, last_name: e.target.value} : null)}
                  placeholder={translate('Enter your last name', 'Soyadınızı girin')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                {translate('Date of Birth', 'Doğum Tarihi')}
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formatDateForInput(studentData?.date_of_birth)}
                onChange={(e) => setStudentData(prev => prev ? { ...prev, date_of_birth: e.target.value || null } : prev)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{translate('Email', 'E-posta')}</Label>
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
                {translate('Email cannot be changed. Contact support if needed.', 'E-posta adresi değiştirilemez. Gerekirse destek ekibimizle iletişime geçin.')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">
                {translate('Preferred Language', 'Tercih edilen dil')}
              </Label>
              <Select
                value={userData?.language_preference || 'en'}
                onValueChange={(value) => {
                  setUserData(prev => (prev ? { ...prev, language_preference: value } : null));
                  void i18n.changeLanguage(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={translate('Select language', 'Dil seçin')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{translate('English', 'İngilizce')}</SelectItem>
                  <SelectItem value="tr">{translate('Turkish', 'Türkçe')}</SelectItem>
                  <SelectItem value="ar">{translate('Arabic', 'Arapça')}</SelectItem>
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
            <span>{translate('Citizenship & Passports', 'Vatandaşlık ve Pasaportlar')}</span>
          </CardTitle>
          <CardDescription>
            {translate('Your citizenship information and passport details', 'Vatandaşlık bilgileriniz ve pasaport detaylarınız')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originCountry">
                {translate('Primary Nationality (Citizenship)', 'Birincil Uyruk (Vatandaşlık)')}
              </Label>
              <Input
                id="originCountry"
                value={studentData?.country_of_origin || ''}
                onChange={(e) => setStudentData(prev => prev ? {...prev, country_of_origin: e.target.value} : null)}
                placeholder={translate('Enter your nationality', 'Uyruğunuzu girin')}
              />
              <p className="text-xs text-muted-foreground">
                {translate('The country you are a citizen of', 'Vatandaşı olduğunuz ülke')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthCountry">
                {translate('Country of Birth', 'Doğum Yeri')}
              </Label>
              <Input
                id="birthCountry"
                value={studentData?.country_of_birth || ''}
                onChange={(e) => setStudentData(prev => prev ? {...prev, country_of_birth: e.target.value} : null)}
                placeholder={translate('Enter country where you were born', 'Doğduğunuz ülkeyi girin')}
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
            <Label htmlFor="dualCitizenship">
              {translate('I have dual citizenship', 'Çifte vatandaşlığım var')}
            </Label>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {translate('Passport Information', 'Pasaport Bilgileri')}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddPassport(!showAddPassport)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {translate('Add Passport', 'Pasaport Ekle')}
              </Button>
            </div>

            {showAddPassport && (
              <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassportNumber">
                      {translate('Passport Number', 'Pasaport Numarası')}
                    </Label>
                    <Input
                      id="newPassportNumber"
                      placeholder={translate('Enter passport number', 'Pasaport numarasını girin')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassportNationality">
                      {translate('Nationality', 'Uyruk')}
                    </Label>
                    <Input
                      id="newPassportNationality"
                      placeholder={translate('Enter nationality', 'Uyruğu girin')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassportExpiry">
                    {translate('Expiry Date (Optional)', 'Son Kullanım Tarihi (Opsiyonel)')}
                  </Label>
                  <Input
                    id="newPassportExpiry"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportFile">
                    {translate('Passport Document (Optional)', 'Pasaport Belgesi (Opsiyonel)')}
                  </Label>
                  <Input
                    id="passportFile"
                    type="file"
                    onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    {translate('Upload a copy of your passport (PDF, JPG, or PNG - Max 5MB)', 'Pasaportunuzun bir kopyasını yükleyin (PDF, JPG veya PNG - Maksimum 5MB)')}
                  </p>
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
                    {uploadingPassport
                      ? translate('Saving...', 'Kaydediliyor...')
                      : translate('Save Passport', 'Pasaportu Kaydet')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddPassport(false);
                      setPassportFile(null);
                    }}
                  >
                    {translate('Cancel', 'İptal')}
                  </Button>
                </div>
              </div>
            )}

            {passports.length === 0 && !showAddPassport ? (
              <p className="text-sm text-muted-foreground">
                {translate('No passports recorded yet. Click "Add Passport" to add your passport information.', 'Henüz kayıtlı pasaportunuz yok. Pasaport bilgilerinizi eklemek için "Pasaport Ekle"ye tıklayın.')}
              </p>
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
                          <p className="text-sm text-muted-foreground">
                            {translate('Number:', 'Numara:')} {passport.passport_number}
                          </p>
                          {passport.expiry_date && (
                            <p className="text-sm text-muted-foreground">
                              {translate('Expires:', 'Son Kullanım:')} {new Date(passport.expiry_date).toLocaleDateString()}
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
                              {translate('View Passport Document', 'Pasaport Belgesini Görüntüle')}
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
            <span>{translate('Academic Information', 'Akademik Bilgiler')}</span>
          </CardTitle>
          <CardDescription>
            {translate('Your educational background and degree details', 'Eğitim geçmişiniz ve diploma bilgileri')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{translate('Your Degrees', 'Diplomalarınız')}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddDegree(!showAddDegree)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {translate('Add Degree', 'Diploma Ekle')}
            </Button>
          </div>

          {showAddDegree && (
            <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="newSchoolName">
                  {translate('School/University Name', 'Okul/Üniversite Adı')}
                </Label>
                <Input
                  id="newSchoolName"
                  placeholder={translate('Enter school or university name', 'Okul veya üniversite adını girin')}
                  value={newDegree.schoolName}
                  onChange={(e) => setNewDegree(prev => ({ ...prev, schoolName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newStudyLevel">
                    {translate('Study Level', 'Eğitim Seviyesi')}
                  </Label>
                  <Select
                    value={newDegree.studyLevel}
                    onValueChange={(value) => setNewDegree(prev => ({ ...prev, studyLevel: value }))}
                  >
                    <SelectTrigger id="newStudyLevel">
                      <SelectValue placeholder={translate('Select study level', 'Eğitim seviyesini seçin')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">{translate('High School', 'Lise')}</SelectItem>
                      <SelectItem value="bachelor">{translate("Bachelor's Degree", 'Lisans')}</SelectItem>
                      <SelectItem value="master">{translate("Master's Degree", 'Yüksek Lisans')}</SelectItem>
                      <SelectItem value="doctorate">{translate('Doctorate', 'Doktora')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newGraduationDate">
                    {translate('Graduation Date', 'Mezuniyet Tarihi')}
                  </Label>
                  <Input
                    id="newGraduationDate"
                    type="date"
                    value={newDegree.graduationDate}
                    onChange={(e) => setNewDegree(prev => ({ ...prev, graduationDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDegreeGrade">
                  {translate('Degree Grade (out of 100)', 'Diploma Notu (100 üzerinden)')}
                </Label>
                <Input
                  id="newDegreeGrade"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  placeholder={translate('Enter your final grade out of 100', 'Mezuniyet notunuzu 100 üzerinden girin')}
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
                  {translate('If your institution uses another grading system, convert it to the equivalent value out of 100 before entering it here.', 'Kurumunuz farklı bir not sistemi kullanıyorsa, lütfen aşağıya girmeden önce 100 üzerinden eşdeğer değere dönüştürün.')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddDegree}
                >
                  {translate('Save Degree', 'Diplomayı Kaydet')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDegree(false)}
                >
                  {translate('Cancel', 'İptal')}
                </Button>
              </div>
            </div>
          )}

          {degrees.length === 0 && !showAddDegree ? (
            <p className="text-sm text-muted-foreground">
              {translate('No degrees recorded yet. Click "Add Degree" to add your educational background.', 'Henüz kayıtlı diplomanız yok. Eğitim geçmişinizi eklemek için "Diploma Ekle"ye tıklayın.')}
            </p>
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
                      <p className="text-sm text-muted-foreground">
                        {translate('Level:', 'Seviye:')} {degree.study_level?.replace('_', ' ').toUpperCase()}
                      </p>
                      {degree.graduation_date && (
                        <p className="text-sm text-muted-foreground">
                          {translate('Graduated:', 'Mezuniyet:')} {new Date(degree.graduation_date).toLocaleDateString()}
                        </p>
                      )}
                      {degree.degree_grade !== null && degree.degree_grade !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          {translate('Grade (out of 100):', 'Not (100 üzerinden):')} {degree.degree_grade}
                        </p>
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
                    <Label>{translate('Degree Certificate', 'Diploma Belgesi')}</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {translate('Upload official document showing this degree', 'Bu diplomayı gösteren resmi belgeyi yükleyin')}
                    </p>
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
                                {translate('Uploaded', 'Yüklendi')} {new Date(existingDoc.uploaded_at).toLocaleDateString()}
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
                              {translate('View', 'Görüntüle')}
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
                            <p className="text-sm text-muted-foreground">{translate('Uploading...', 'Yükleniyor...')}</p>
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
            <span>{translate('Standardized Exams', 'Standart Sınavlar')}</span>
          </CardTitle>
          <CardDescription>
            {translate('Add your standardized test scores (SAT, TOEFL, IELTS, etc.)', 'Standart sınav puanlarınızı ekleyin (SAT, TOEFL, IELTS vb.)')}
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
                {translate('Add Exam', 'Sınav Ekle')}
              </Button>
            </div>

            {showAddExam && (
              <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="examType">
                      {translate('Exam Type', 'Sınav Türü')}
                    </Label>
                    <Select value={newExam.examName} onValueChange={(value) => setNewExam(prev => ({ ...prev, examName: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={translate('Select exam type', 'Sınav türünü seçin')} />
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
                    <Label htmlFor="examScore">
                      {translate('Score', 'Puan')}
                    </Label>
                    <Input
                      id="examScore"
                      value={newExam.score}
                      onChange={(e) => setNewExam(prev => ({ ...prev, score: e.target.value }))}
                      placeholder={translate('Enter your score', 'Puanınızı girin')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examDate">
                    {translate('Exam Date', 'Sınav Tarihi')}
                  </Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={newExam.examDate}
                    onChange={(e) => setNewExam(prev => ({ ...prev, examDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examFile">
                    {translate('Upload Document (Optional)', 'Belge Yükle (Opsiyonel)')}
                  </Label>
                  <Input
                    id="examFile"
                    type="file"
                    onChange={(e) => setExamFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    {translate('PDF, JPG, or PNG (Max 5MB)', 'PDF, JPG veya PNG (Maksimum 5MB)')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddExam}
                    disabled={uploadingExam}
                  >
                    {uploadingExam ? translate('Saving...', 'Kaydediliyor...') : translate('Save Exam', 'Sınavı Kaydet')}
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
                    {translate('Cancel', 'İptal')}
                  </Button>
                </div>
              </div>
            )}

            {examDocuments.length === 0 && !showAddExam ? (
              <p className="text-sm text-muted-foreground">
                {translate('No exams recorded yet. Click "Add Exam" to add your exam scores.', 'Henüz kayıtlı sınavınız yok. Sınav puanlarınızı eklemek için "Sınav Ekle"ye tıklayın.')}
              </p>
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
                        <p className="text-sm text-muted-foreground">
                          {translate('Score:', 'Puan:')} {exam.exam_score ?? translate('N/A', 'Yok')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {translate('Date:', 'Tarih:')} {exam.exam_date ?? translate('N/A', 'Yok')}
                        </p>
                        {exam.file_url && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => handleViewDocument(exam.file_url!)}
                            className="text-primary text-sm underline p-0 h-auto mt-1"
                          >
                            {translate('View Document', 'Belgeyi Görüntüle')}
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
            <span>{translate('Academic Documents', 'Akademik Belgeler')}</span>
          </CardTitle>
          <CardDescription>
            {translate('Upload your required academic documents', 'Gerekli akademik belgelerinizi yükleyin')}
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
              const { name: docTypeName, description: docTypeDescription } = getDocumentTypeLocalization(docType);
              const existingDoc = documents.find(d => d.doc_type_id === docType.id);
              
              return (
                <div key={docType.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">{docTypeName}</h4>
                      {docTypeDescription && (
                        <p className="text-sm text-muted-foreground">{docTypeDescription}</p>
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
                            {translate('Uploaded', 'Yüklendi')} {new Date(existingDoc.uploaded_at).toLocaleDateString()}
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
                          {translate('View', 'Görüntüle')}
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
                        <p className="text-sm text-muted-foreground">{translate('Uploading...', 'Yükleniyor...')}</p>
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
                        {translate('Required for students with Turkish nationality', 'Türk vatandaşlığına sahip öğrenciler için zorunludur')}
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
                            {translate('Uploaded', 'Yüklendi')} {new Date(existingDoc.uploaded_at).toLocaleDateString()}
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
                          {translate('View', 'Görüntüle')}
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
                        <p className="text-sm text-muted-foreground">{translate('Uploading...', 'Yükleniyor...')}</p>
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
            <span>{translate('Additional Documents', 'Ek Belgeler')}</span>
          </CardTitle>
          <CardDescription>
            {translate('Upload supplementary documents such as CV, recommendation letters, or other supporting materials (optional)', 'CV, referans mektupları veya diğer destekleyici belgeler gibi ek belgeleri yükleyin (opsiyonel)')}
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
                            {translate('Uploaded', 'Yüklendi')} {new Date(doc.uploaded_at).toLocaleDateString()}
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
                          {translate('View', 'Görüntüle')}
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
                  <Label htmlFor="additionalDoc">
                    {translate('Upload Additional Document', 'Ek Belge Yükle')}
                  </Label>
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
                    <p className="text-sm text-muted-foreground">{translate('Uploading...', 'Yükleniyor...')}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {translate('PDF, JPG, PNG, DOC, or DOCX files accepted', 'PDF, JPG, PNG, DOC veya DOCX dosyaları kabul edilir')}
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
            <span>{translate('Contact & Address', 'İletişim ve Adres')}</span>
          </CardTitle>
          <CardDescription>
            {translate('Keep your contact and address details up to date', 'İletişim ve adres bilgilerinizi güncel tutun')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="countryCode">
                {translate('Country Code', 'Ülke Kodu')}
              </Label>
              <Input
                id="countryCode"
                value={phone.countryCode}
                onChange={(e) => setPhone((prev) => ({ ...prev, countryCode: e.target.value }))}
                placeholder={translate('+90', '+90')}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="phoneNumber">
                {translate('Phone Number', 'Telefon Numarası')}
              </Label>
              <Input
                id="phoneNumber"
                value={phone.phoneNumber}
                onChange={(e) => setPhone((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder={translate('Enter your phone number', 'Telefon numaranızı girin')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">
              {translate('Street Address', 'Açık Adres')}
            </Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
              placeholder={translate('Enter your street address', 'Adresinizi girin')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                {translate('City', 'Şehir')}
              </Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                placeholder={translate('Enter your city', 'Şehrinizi girin')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">
                {translate('State/Province', 'Eyalet/İl')}
              </Label>
              <Input
                id="state"
                value={address.state}
                onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                placeholder={translate('Enter your state or province', 'İl veya eyaletinizi girin')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">
                {translate('Postal Code', 'Posta Kodu')}
              </Label>
              <Input
                id="postalCode"
                value={address.postalCode}
                onChange={(e) => setAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                placeholder={translate('Enter your postal code', 'Posta kodunuzu girin')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCountry">
                {translate('Country', 'Ülke')}
              </Label>
              <CountrySelect
                value={address.country}
                onValueChange={(value) => setAddress((prev) => ({ ...prev, country: value }))}
                placeholder={translate('Select your country', 'Ülkenizi seçin')}
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
          {saving ? translate('Saving...', 'Kaydediliyor...') : translate('Save All Changes', 'Tüm Değişiklikleri Kaydet')}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
