-- Create storage buckets for profile pictures and documents
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('profiles', 'profiles', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile pictures
CREATE POLICY "Users can view their own profile pictures" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own profile pictures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile pictures" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile pictures" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for documents
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert document types if they don't exist
INSERT INTO document_types (id, name, description) VALUES 
  (gen_random_uuid(), 'Passport Photo', 'Official passport-style photograph'),
  (gen_random_uuid(), 'Academic Transcript', 'Official academic transcript or grade report'),
  (gen_random_uuid(), 'Diploma/Certificate', 'Graduation diploma or degree certificate'),
  (gen_random_uuid(), 'Degree Grade Certificate', 'Official document showing final degree grade'),
  (gen_random_uuid(), 'Other', 'Additional supporting documents')
ON CONFLICT (name) DO NOTHING;