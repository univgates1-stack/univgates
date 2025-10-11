-- Fix RLS policies for student_exam_documents UPDATE and DELETE
DROP POLICY IF EXISTS "Students can update their own exam docs" ON student_exam_documents;
DROP POLICY IF EXISTS "Students can delete their own exam docs" ON student_exam_documents;

CREATE POLICY "Students can update their own exam docs" 
ON student_exam_documents 
FOR UPDATE 
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can delete their own exam docs" 
ON student_exam_documents 
FOR DELETE 
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);