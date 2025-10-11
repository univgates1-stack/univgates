-- Add storage policies for documents bucket

-- Allow students to upload their own documents
CREATE POLICY "Students can upload own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT user_id::text FROM students WHERE user_id = auth.uid()
  )
);

-- Allow students to view their own documents
CREATE POLICY "Students can view own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT user_id::text FROM students WHERE user_id = auth.uid()
  )
);

-- Allow students to update their own documents
CREATE POLICY "Students can update own documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT user_id::text FROM students WHERE user_id = auth.uid()
  )
);

-- Allow students to delete their own documents
CREATE POLICY "Students can delete own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT user_id::text FROM students WHERE user_id = auth.uid()
  )
);

-- Allow university officials to view documents of students who applied to their programs
CREATE POLICY "University officials can view student application documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM students s
    JOIN applications a ON a.student_id = s.id
    JOIN programs p ON p.id = a.program_id
    JOIN university_officials uo ON uo.university_id = p.university_id
    WHERE uo.user_id = auth.uid()
    AND s.user_id::text = (storage.foldername(name))[1]
  )
);

-- Add policy for university officials to view student documents
CREATE POLICY "University officials can view application documents"
ON documents
FOR SELECT
USING (
  student_id IN (
    SELECT s.id FROM students s
    JOIN applications a ON a.student_id = s.id
    JOIN programs p ON p.id = a.program_id
    JOIN university_officials uo ON uo.university_id = p.university_id
    WHERE uo.user_id = auth.uid()
  )
);