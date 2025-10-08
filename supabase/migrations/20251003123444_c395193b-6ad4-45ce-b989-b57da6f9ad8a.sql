-- Add DELETE policy for documents table
CREATE POLICY "Students can delete own documents"
ON public.documents
FOR DELETE
USING (student_id IN (
  SELECT students.id
  FROM students
  WHERE students.user_id = auth.uid()
));