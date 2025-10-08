-- Allow students to delete their own applications (except if accepted)
CREATE POLICY "Students can delete own applications if not accepted"
ON applications
FOR DELETE
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  AND status != 'accepted'
);