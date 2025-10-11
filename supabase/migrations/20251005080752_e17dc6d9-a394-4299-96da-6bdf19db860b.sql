-- Create offer letters storage and table

-- Create offer letters storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-letters',
  'offer-letters',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
);

-- Create offer letters table
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES university_officials(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS on offer_letters
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;

-- Students can view offer letters for their applications
CREATE POLICY "Students can view their offer letters"
ON offer_letters
FOR SELECT
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN students s ON s.id = a.student_id
    WHERE s.user_id = auth.uid()
  )
);

-- University officials can insert offer letters for their programs
CREATE POLICY "University officials can upload offer letters"
ON offer_letters
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT a.id
    FROM applications a
    JOIN programs p ON p.id = a.program_id
    JOIN university_officials uo ON uo.university_id = p.university_id
    WHERE uo.user_id = auth.uid()
  )
);

-- University officials can view offer letters they uploaded
CREATE POLICY "University officials can view offer letters"
ON offer_letters
FOR SELECT
USING (
  uploaded_by IN (
    SELECT id FROM university_officials WHERE user_id = auth.uid()
  )
);

-- Storage policies for offer letters

-- Students can view offer letters for their applications
CREATE POLICY "Students can download their offer letters"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'offer-letters'
  AND name IN (
    SELECT ol.file_path
    FROM offer_letters ol
    JOIN applications a ON a.id = ol.application_id
    JOIN students s ON s.id = a.student_id
    WHERE s.user_id = auth.uid()
  )
);

-- University officials can upload offer letters
CREATE POLICY "University officials can upload offer letters to storage"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'offer-letters'
  AND auth.uid() IN (
    SELECT user_id FROM university_officials
  )
);

-- University officials can view offer letters they uploaded
CREATE POLICY "University officials can view offer letters in storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'offer-letters'
  AND auth.uid() IN (
    SELECT user_id FROM university_officials
  )
);