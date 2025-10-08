import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/FileUpload';

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

const AcademicOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<Array<{id: string; name: string}>>([]);

  // Step 1: Academic Information
  const [schoolName, setSchoolName] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [graduationDate, setGraduationDate] = useState('');
  const [degreeGrade, setDegreeGrade] = useState('');

  // Step 2: Standardized Exams
  const [exams, setExams] = useState<Array<{
    examName: string;
    score: string;
    examDate: string;
    file: File | null;
  }>>([]);

  // Step 3 & 4: Documents
  const [academicTranscript, setAcademicTranscript] = useState<File | null>(null);
  const [diplomaCertificate, setDiplomaCertificate] = useState<File | null>(null);
  const [degreeGradeCertificate, setDegreeGradeCertificate] = useState<File | null>(null);
  const [additionalDocuments, setAdditionalDocuments] = useState<Array<{ type: string; file: File }>>([]);

  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
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

        // Get student record
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!studentData) {
          navigate('/onboarding');
          return;
        }

        setStudentId(studentData.id);

        // Fetch document types
        const { data: docTypesData } = await supabase
          .from('document_types')
          .select('id, name');

        if (docTypesData) {
          setDocumentTypes(docTypesData);
        }

        // Fetch existing degrees
        const { data: degreesData } = await supabase
          .from('student_degrees')
          .select('*')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (degreesData) {
          setSchoolName(degreesData.school_name || '');
          setStudyLevel(degreesData.study_level || '');
          if (degreesData.graduation_date) {
            setGraduationDate(degreesData.graduation_date.split('T')[0]);
          }
          if (degreesData.degree_grade) {
            setDegreeGrade(String(degreesData.degree_grade));
          }
        }

        // Fetch existing exams
        const { data: examsData } = await supabase
          .from('student_exam_documents')
          .select('*')
          .eq('student_id', studentData.id);

        if (examsData && examsData.length > 0) {
          setExams(examsData.map(exam => ({
            examName: exam.exam_name || '',
            score: exam.exam_score || '',
            examDate: exam.exam_date ? exam.exam_date.split('T')[0] : '',
            file: null,
          })));
        }

        // Check if already completed
        if (studentData.profile_completion_status === 'complete' || studentData.profile_completion_status === 'completed') {
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
  }, [navigate, toast]);

  const addExam = () => {
    setExams([...exams, { examName: '', score: '', examDate: '', file: null }]);
  };

  const removeExam = (index: number) => {
    setExams(exams.filter((_, i) => i !== index));
  };

  const updateExam = (index: number, field: string, value: any) => {
    const updated = [...exams];
    updated[index] = { ...updated[index], [field]: value };
    setExams(updated);
  };

  const handleNext = async () => {
    if (!userId || !studentId) return;

    setSaving(true);
    try {
      // Step 1: Save academic information
      if (currentStep === 1) {
<<<<<<< HEAD
        const parsedGrade = Number(degreeGrade);
        if (!schoolName || !graduationDate || degreeGrade === '') {
=======
        if (!schoolName || !graduationDate || !degreeGrade) {
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
          toast({
            title: 'Required Fields',
            description: 'Please fill in all academic information fields',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

<<<<<<< HEAD
        if (Number.isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 100) {
          toast({
            title: 'Invalid grade value',
            description: 'Enter the equivalent of your graduation grade on a 0-100 scale.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

=======
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
        // Check if degree already exists
        const { data: existingDegree } = await supabase
          .from('student_degrees')
          .select('id')
          .eq('student_id', studentId)
          .maybeSingle();

        if (existingDegree) {
          // Update existing degree
          const { error } = await supabase
            .from('student_degrees')
            .update({
              school_name: schoolName.trim(),
              study_level: studyLevel || 'undergraduate',
              graduation_date: graduationDate,
<<<<<<< HEAD
              degree_grade: parsedGrade,
=======
              degree_grade: parseFloat(degreeGrade) || null,
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            })
            .eq('id', existingDegree.id);

          if (error) throw error;
        } else {
          // Insert new degree
          const { error } = await supabase
            .from('student_degrees')
            .insert({
              student_id: studentId,
              school_name: schoolName.trim(),
              study_level: studyLevel || 'undergraduate',
              graduation_date: graduationDate,
<<<<<<< HEAD
              degree_grade: parsedGrade,
=======
              degree_grade: parseFloat(degreeGrade) || null,
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            });

          if (error) throw error;
        }
      }

      // Step 2: Save standardized exams
      if (currentStep === 2) {
        // Delete existing exams first
        await supabase
          .from('student_exam_documents')
          .delete()
          .eq('student_id', studentId);

        // Insert new exams
        for (const exam of exams) {
          if (!exam.examName || !exam.score) continue;

          let fileUrl: string | null = null;
          
          // Upload exam document if provided
          if (exam.file) {
            const fileExt = exam.file.name.split('.').pop();
            const fileName = `${userId}/exam_${exam.examName}_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('documents')
              .upload(fileName, exam.file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('documents')
              .getPublicUrl(fileName);

            fileUrl = publicUrl;
          }

          const { error } = await supabase
            .from('student_exam_documents')
            .insert({
              student_id: studentId,
              exam_name: exam.examName,
              exam_score: exam.score,
              exam_date: exam.examDate || null,
              file_url: fileUrl,
            });

          if (error) throw error;
        }
      }

      // Step 3: Save academic documents
      if (currentStep === 3) {
        const documentsToUpload = [
          { file: academicTranscript, typeName: 'Academic Transcript' },
          { file: diplomaCertificate, typeName: 'Diploma/Certificate' },
          { file: degreeGradeCertificate, typeName: 'Degree Grade Certificate' },
        ];

        for (const doc of documentsToUpload) {
          if (!doc.file) continue;

          const docType = documentTypes.find(dt => dt.name === doc.typeName);
          if (!docType) continue;

          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${userId}/${docType.id}_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, doc.file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);

          await supabase
            .from('documents')
            .insert({
              student_id: studentId,
              doc_type_id: docType.id,
              file_name: doc.file.name,
              file_url: publicUrl,
              application_id: null,
            });
        }
      }

      // Step 4: Save additional documents and complete
      if (currentStep === 4) {
        for (const doc of additionalDocuments) {
          const docType = documentTypes.find(dt => dt.id === doc.type);
          if (!docType) continue;

          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${userId}/${doc.type}_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, doc.file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);

          await supabase
            .from('documents')
            .insert({
              student_id: studentId,
              doc_type_id: docType.id,
              file_name: doc.file.name,
              file_url: publicUrl,
              application_id: null,
            });
        }

        // Update completion status
        await supabase
          .from('students')
          .update({ profile_completion_status: 'complete' })
          .eq('user_id', userId);

        toast({
          title: 'Success',
          description: 'Academic information saved successfully!',
        });
        navigate('/dashboard');
        return;
      }

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error saving academic onboarding:', error);
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

  const handleSkip = async () => {
    if (!userId) return;

    try {
      await supabase
        .from('students')
        .update({ profile_completion_status: 'partial' })
        .eq('user_id', userId);

      toast({
        title: 'Reminder',
        description: 'You can complete your academic information later from your profile.',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      navigate('/dashboard');
    }
  };

  if (loading) {
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
              <CardTitle className="text-2xl font-bold">Academic Information</CardTitle>
              <CardDescription>Complete your academic profile</CardDescription>
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
                <GraduationCap className="mx-auto h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold text-foreground">Academic Information</h2>
                <p className="text-muted-foreground">Tell us about your educational history</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolName">Name of Graduated School/University <span className="text-destructive">*</span></Label>
                <Input
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Enter the name of your graduated institution"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studyLevel">Study Level</Label>
                <Select value={studyLevel} onValueChange={setStudyLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select study level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="associate">Associate Degree</SelectItem>
                    <SelectItem value="undergraduate">Bachelor's Degree</SelectItem>
                    <SelectItem value="graduate">Master's Degree</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationDate">Graduation Date <span className="text-destructive">*</span></Label>
                <Input
                  id="graduationDate"
                  type="date"
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
<<<<<<< HEAD
                <Label htmlFor="degreeGrade">Graduation Grade (out of 100) <span className="text-destructive">*</span></Label>
                <Input
                  id="degreeGrade"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={degreeGrade}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setDegreeGrade('');
                      return;
                    }
                    const parsed = Number(raw);
                    if (Number.isNaN(parsed)) return;
                    const clamped = Math.max(0, Math.min(100, parsed));
                    setDegreeGrade(clamped.toString());
                  }}
                  placeholder="Enter your final grade out of 100"
                />
                <p className="text-sm text-muted-foreground">
                  If your school uses another grading system, convert it to the equivalent value on a 0-100 scale before submitting.
                </p>
=======
                <Label htmlFor="degreeGrade">Graduation Grade / GPA <span className="text-destructive">*</span></Label>
                <Input
                  id="degreeGrade"
                  value={degreeGrade}
                  onChange={(e) => setDegreeGrade(e.target.value)}
                  placeholder="e.g., 3.75, 85/100, First Class Honours"
                />
                <p className="text-sm text-muted-foreground">Enter your grade in the format used by your institution</p>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <GraduationCap className="mx-auto h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold text-foreground">Standardized Exams</h2>
                <p className="text-muted-foreground">Add your test scores (optional)</p>
              </div>

              {exams.map((exam, index) => (
                <Card key={index} className="p-4 bg-muted/20">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Exam {index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExam(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Exam Type</Label>
                      <Select
                        value={exam.examName}
                        onValueChange={(value) => updateExam(index, 'examName', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          {examTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Score</Label>
                      <Input
                        value={exam.score}
                        onChange={(e) => updateExam(index, 'score', e.target.value)}
                        placeholder="Enter your score"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Exam Date</Label>
                      <Input
                        type="date"
                        value={exam.examDate}
                        onChange={(e) => updateExam(index, 'examDate', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Score Report Document</Label>
                      <FileUpload
                        onFileSelect={(file) => updateExam(index, 'file', file)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        maxSize={10}
                        placeholder="Upload score report"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <Button variant="outline" onClick={addExam} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Exam
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <GraduationCap className="mx-auto h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold text-foreground">Academic Documents</h2>
                <p className="text-muted-foreground">Upload your academic credentials</p>
              </div>

              <div className="space-y-2">
                <Label>Academic Transcript</Label>
                <FileUpload
                  onFileSelect={setAcademicTranscript}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  placeholder="Upload academic transcript"
                />
              </div>

              <div className="space-y-2">
                <Label>Diploma/Certificate</Label>
                <FileUpload
                  onFileSelect={setDiplomaCertificate}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  placeholder="Upload diploma or certificate"
                />
              </div>

              <div className="space-y-2">
                <Label>Degree Grade Certificate <span className="text-muted-foreground text-sm">(optional)</span></Label>
                <FileUpload
                  onFileSelect={setDegreeGradeCertificate}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10}
                  placeholder="Upload degree grade certificate"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <GraduationCap className="mx-auto h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold text-foreground">Additional Documents</h2>
                <p className="text-muted-foreground">Upload any additional supporting documents (optional)</p>
              </div>

              {additionalDocuments.map((doc, index) => (
                <Card key={index} className="p-4 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{doc.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {documentTypes.find(dt => dt.id === doc.type)?.name || 'Document'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAdditionalDocuments(additionalDocuments.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              <div className="space-y-4">
                <Label>Document Type</Label>
                <Select
                  onValueChange={(typeId) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.jpg,.jpeg,.png';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setAdditionalDocuments([...additionalDocuments, { type: typeId, file }]);
                      }
                    };
                    input.click();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type to upload" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes
                      .filter(dt => !['Passport', 'Nüfus Kayıt Örneği'].includes(dt.name))
                      .map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
                {saving ? 'Saving...' : currentStep === totalSteps ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcademicOnboarding;
