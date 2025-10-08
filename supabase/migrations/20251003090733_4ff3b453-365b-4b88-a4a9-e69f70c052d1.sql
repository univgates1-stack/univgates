-- Fix RLS policy for student_exam_documents INSERT
DROP POLICY IF EXISTS "Students can insert their own exam docs" ON student_exam_documents;

CREATE POLICY "Students can insert their own exam docs" 
ON student_exam_documents 
FOR INSERT 
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);