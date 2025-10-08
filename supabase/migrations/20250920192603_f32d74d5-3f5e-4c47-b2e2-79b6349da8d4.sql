-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );

  -- If role is student, create student record
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'student' THEN
    INSERT INTO public.students (user_id, profile_completion_status)
    VALUES (NEW.id, 'incomplete');
  END IF;

  -- If role is agent, create agent record
  IF NEW.raw_user_meta_data->>'role' = 'agent' THEN
    INSERT INTO public.agents (
      user_id,
      company_name,
      contact_phone,
      agency_license_number
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'company_name',
      NEW.raw_user_meta_data->>'contact_phone',
      NEW.raw_user_meta_data->>'agency_license_number'
    );
  END IF;

  -- If role is university_official, create university official record
  IF NEW.raw_user_meta_data->>'role' = 'university_official' THEN
    INSERT INTO public.university_officials (
      user_id,
      department
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'department'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();