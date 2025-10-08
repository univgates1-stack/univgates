-- Allow university officials to insert their own records
CREATE POLICY "Users can create their own university official profile"
ON public.university_officials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a trigger function to automatically create university_officials record
CREATE OR REPLACE FUNCTION public.handle_new_university_official()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user signed up with university_official role
  IF NEW.raw_user_meta_data->>'role' = 'university_official' THEN
    INSERT INTO public.university_officials (
      user_id,
      department,
      contact_phone
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'department', ''),
      COALESCE(NEW.raw_user_meta_data->>'contact_phone', '')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create university_officials record on signup
DROP TRIGGER IF EXISTS on_auth_user_created_university_official ON auth.users;
CREATE TRIGGER on_auth_user_created_university_official
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_university_official();