-- Fix RLS policies for document viewing and student information access

-- Allow university officials to view student profiles
CREATE POLICY "University officials can view student profiles"
ON students
FOR SELECT
USING (
  id IN (
    SELECT a.student_id
    FROM applications a
    JOIN programs p ON p.id = a.program_id
    JOIN university_officials uo ON uo.university_id = p.university_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Allow university officials to view student passport information
CREATE POLICY "University officials can view student passports"
ON student_passports
FOR SELECT
USING (
  student_id IN (
    SELECT a.student_id
    FROM applications a
    JOIN programs p ON p.id = a.program_id
    JOIN university_officials uo ON uo.university_id = p.university_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Drop and recreate storage policies with correct logic
DROP POLICY IF EXISTS "Students can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Students can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Students can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "University officials can view student application documents" ON storage.objects;

-- Recreate storage policies with fixed folder structure
CREATE POLICY "Students can upload own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IN (
    SELECT user_id FROM students WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Students can view own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid() IN (
    SELECT user_id FROM students WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Students can update own documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND auth.uid() IN (
    SELECT user_id FROM students WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Students can delete own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' 
  AND auth.uid() IN (
    SELECT user_id FROM students WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "University officials can view student application documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 
    FROM students s
    JOIN applications a ON a.student_id = s.id
    JOIN programs p ON p.id = a.program_id
    JOIN university_officials uo ON uo.university_id = p.university_id
    WHERE uo.user_id = auth.uid()
    AND s.id::text = (storage.foldername(name))[1]
  )
);