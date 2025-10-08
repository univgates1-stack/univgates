-- Fix RLS policy for student_exam_documents SELECT
DROP POLICY IF EXISTS "Students can view their own exam docs" ON student_exam_documents;

CREATE POLICY "Students can view their own exam docs" 
ON student_exam_documents 
FOR SELECT 
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);