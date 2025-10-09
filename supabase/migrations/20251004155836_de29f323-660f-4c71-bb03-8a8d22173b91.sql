-- Drop existing policies
DROP POLICY IF EXISTS "Students can insert own applications" ON applications;
DROP POLICY IF EXISTS "Students can update own applications" ON applications;
DROP POLICY IF EXISTS "Students can view own applications" ON applications;

-- Create corrected policies that check if student_id belongs to the authenticated user
CREATE POLICY "Students can insert own applications" 
ON applications 
FOR INSERT 
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can update own applications" 
ON applications 
FOR UPDATE 
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can view own applications" 
ON applications 
FOR SELECT 
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);