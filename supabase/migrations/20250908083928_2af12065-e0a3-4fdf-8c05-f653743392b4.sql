-- Enable RLS and create policies for role-specific tables

-- Students table policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile"
ON public.students
FOR UPDATE
USING (auth.uid() = user_id);

-- Agents table policies
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own profile"
ON public.agents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Agents can update own profile"
ON public.agents
FOR UPDATE
USING (auth.uid() = user_id);

-- Administrators table policies
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrators can view own profile"
ON public.administrators
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Administrators can update own profile"
ON public.administrators
FOR UPDATE
USING (auth.uid() = user_id);

-- University officials table policies
ALTER TABLE public.university_officials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "University officials can view own profile"
ON public.university_officials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "University officials can update own profile"
ON public.university_officials
FOR UPDATE
USING (auth.uid() = user_id);

-- Documents table policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own documents"
ON public.documents
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own documents"
ON public.documents
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own documents"
ON public.documents
FOR UPDATE
USING (auth.uid() = student_id);

-- Student addresses table policies
ALTER TABLE public.student_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own addresses"
ON public.student_addresses
FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

CREATE POLICY "Students can insert own addresses"
ON public.student_addresses
FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

CREATE POLICY "Students can update own addresses"
ON public.student_addresses
FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

-- Student phones table policies
ALTER TABLE public.student_phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own phone numbers"
ON public.student_phones
FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

CREATE POLICY "Students can insert own phone numbers"
ON public.student_phones
FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));

CREATE POLICY "Students can update own phone numbers"
ON public.student_phones
FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_id));