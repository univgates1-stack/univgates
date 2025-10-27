-- Fix infinite recursion in students RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "University officials can view student profiles" ON students;

-- Create a security definer function to check if user is university official for a student
CREATE OR REPLACE FUNCTION public.is_university_official_for_student(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM applications a
    JOIN programs p ON p.id = a.program_id
    JOIN university_officials uo ON uo.university_id = p.university_id
    WHERE uo.user_id = _user_id
    AND a.student_id = _student_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "University officials can view student profiles"
ON students
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.is_university_official_for_student(auth.uid(), id)
);

-- Also fix the student_passports policy
DROP POLICY IF EXISTS "University officials can view student passports" ON student_passports;

CREATE POLICY "University officials can view student passports"
ON student_passports
FOR SELECT
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR public.is_university_official_for_student(auth.uid(), student_id)
);