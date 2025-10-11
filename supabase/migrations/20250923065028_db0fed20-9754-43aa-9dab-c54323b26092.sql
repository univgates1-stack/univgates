-- Add missing fields to university_officials table for authorized person data
ALTER TABLE public.university_officials 
ADD COLUMN IF NOT EXISTS authorized_person_name TEXT,
ADD COLUMN IF NOT EXISTS authorized_person_email TEXT;

-- Add missing fields to universities table for acceptance criteria and requirements
ALTER TABLE public.universities 
ADD COLUMN IF NOT EXISTS acceptance_criteria TEXT,
ADD COLUMN IF NOT EXISTS required_documents JSONB;

-- Ensure RLS policies allow university officials to create universities
CREATE POLICY "University officials can create universities" 
ON public.universities 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow university officials to update their own university
CREATE POLICY "University officials can update their own university" 
ON public.universities 
FOR UPDATE 
USING (id IN (
  SELECT university_id 
  FROM university_officials 
  WHERE user_id = auth.uid()
));