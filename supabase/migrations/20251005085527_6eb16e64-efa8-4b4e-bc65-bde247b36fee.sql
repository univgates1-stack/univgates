-- Allow students to view university officials for chat functionality
CREATE POLICY "Students can view university officials"
ON university_officials
FOR SELECT
USING (
  status = 'approved' AND
  EXISTS (
    SELECT 1 FROM students WHERE students.user_id = auth.uid()
  )
);