-- Add SELECT policy for administrators to view contact form submissions
CREATE POLICY "Administrators can view contact forms"
ON public.contact_forms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.administrators 
    WHERE administrators.user_id = auth.uid()
  )
);

-- Optional: Add policy for university officials to view contact forms
CREATE POLICY "University officials can view contact forms"
ON public.contact_forms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.university_officials 
    WHERE university_officials.user_id = auth.uid()
  )
);