-- Add RLS policies for university officials to view applications for their university's programs
CREATE POLICY "University officials can view applications for their programs" 
ON applications 
FOR SELECT 
TO authenticated
USING (
  program_id IN (
    SELECT p.id 
    FROM programs p
    INNER JOIN university_officials uo ON uo.university_id = p.university_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Add RLS policy for university officials to update application status
CREATE POLICY "University officials can update applications for their programs" 
ON applications 
FOR UPDATE 
TO authenticated
USING (
  program_id IN (
    SELECT p.id 
    FROM programs p
    INNER JOIN university_officials uo ON uo.university_id = p.university_id
    WHERE uo.user_id = auth.uid()
  )
);