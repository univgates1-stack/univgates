-- Ensure RLS is enabled on student_exam_documents table
ALTER TABLE public.student_exam_documents ENABLE ROW LEVEL SECURITY;

-- Add INSERT policy for students to create their own exam documents
CREATE POLICY "Students can insert their own exam docs"
ON public.student_exam_documents
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Add UPDATE policy for students to update their own exam documents
CREATE POLICY "Students can update their own exam docs"
ON public.student_exam_documents
FOR UPDATE
USING (student_id = auth.uid());

-- Add DELETE policy for students to delete their own exam documents
CREATE POLICY "Students can delete their own exam docs"
ON public.student_exam_documents
FOR DELETE
USING (student_id = auth.uid());

-- Make student_id NOT NULL to prevent security issues
ALTER TABLE public.student_exam_documents 
ALTER COLUMN student_id SET NOT NULL;