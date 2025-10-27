-- Create table for multiple student degrees
CREATE TABLE IF NOT EXISTS public.student_degrees (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_name TEXT,
  study_level TEXT,
  graduation_date DATE,
  degree_grade NUMERIC,
  degree_certificate_doc_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_degrees ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_degrees
CREATE POLICY "Students can view own degrees"
  ON public.student_degrees
  FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Students can insert own degrees"
  ON public.student_degrees
  FOR INSERT
  WITH CHECK (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Students can update own degrees"
  ON public.student_degrees
  FOR UPDATE
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Students can delete own degrees"
  ON public.student_degrees
  FOR DELETE
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

-- Create table for multiple student passports
CREATE TABLE IF NOT EXISTS public.student_passports (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  passport_number TEXT,
  nationality TEXT,
  expiry_date DATE,
  passport_doc_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_passports ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_passports
CREATE POLICY "Students can view own passports"
  ON public.student_passports
  FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Students can insert own passports"
  ON public.student_passports
  FOR INSERT
  WITH CHECK (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Students can update own passports"
  ON public.student_passports
  FOR UPDATE
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Students can delete own passports"
  ON public.student_passports
  FOR DELETE
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));