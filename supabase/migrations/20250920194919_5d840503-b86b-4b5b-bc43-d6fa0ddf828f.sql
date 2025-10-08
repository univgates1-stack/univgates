-- Add INSERT policy for students table to allow user creation during onboarding
CREATE POLICY "Users can create their own student profile" 
ON public.students 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update the student_addresses RLS policies to be more robust
DROP POLICY IF EXISTS "Students can insert own addresses" ON public.student_addresses;
DROP POLICY IF EXISTS "Students can update own addresses" ON public.student_addresses;
DROP POLICY IF EXISTS "Students can view own addresses" ON public.student_addresses;

CREATE POLICY "Students can view own addresses" 
ON public.student_addresses 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

CREATE POLICY "Students can insert own addresses" 
ON public.student_addresses 
FOR INSERT 
WITH CHECK (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

CREATE POLICY "Students can update own addresses" 
ON public.student_addresses 
FOR UPDATE 
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

-- Update the student_phones RLS policies to be more robust
DROP POLICY IF EXISTS "Students can insert own phone numbers" ON public.student_phones;
DROP POLICY IF EXISTS "Students can update own phone numbers" ON public.student_phones;
DROP POLICY IF EXISTS "Students can view own phone numbers" ON public.student_phones;

CREATE POLICY "Students can view own phone numbers" 
ON public.student_phones 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

CREATE POLICY "Students can insert own phone numbers" 
ON public.student_phones 
FOR INSERT 
WITH CHECK (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

CREATE POLICY "Students can update own phone numbers" 
ON public.student_phones 
FOR UPDATE 
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

-- Update documents RLS policies to use correct student_id reference
DROP POLICY IF EXISTS "Students can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Students can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Students can view own documents" ON public.documents;

CREATE POLICY "Students can view own documents" 
ON public.documents 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

CREATE POLICY "Students can insert own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

CREATE POLICY "Students can update own documents" 
ON public.documents 
FOR UPDATE 
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));