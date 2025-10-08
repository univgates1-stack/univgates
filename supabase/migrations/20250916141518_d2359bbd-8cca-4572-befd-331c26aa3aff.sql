-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the function to handle existing users gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert into users table with conflict handling
  INSERT INTO public.users (id, email, first_name, last_name, language_preference)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'language_preference', 'en')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    language_preference = COALESCE(EXCLUDED.language_preference, users.language_preference);

  -- Insert role-specific data based on the user's role (only if not exists)
  CASE new.raw_user_meta_data->>'role'
    WHEN 'student' THEN
      INSERT INTO public.students (user_id)
      VALUES (new.id)
      ON CONFLICT (user_id) DO NOTHING;
    
    WHEN 'agent' THEN
      INSERT INTO public.agents (
        user_id, 
        company_name, 
        contact_phone, 
        agency_license_number
      )
      VALUES (
        new.id,
        new.raw_user_meta_data->>'company_name',
        new.raw_user_meta_data->>'contact_phone',
        new.raw_user_meta_data->>'agency_license_number'
      )
      ON CONFLICT (user_id) DO NOTHING;
    
    WHEN 'administrator' THEN
      INSERT INTO public.administrators (user_id)
      VALUES (new.id)
      ON CONFLICT (user_id) DO NOTHING;
    
    WHEN 'university_official' THEN
      INSERT INTO public.university_officials (
        user_id,
        contact_phone,
        department
      )
      VALUES (
        new.id,
        new.raw_user_meta_data->>'contact_phone',
        new.raw_user_meta_data->>'department'
      )
      ON CONFLICT (user_id) DO NOTHING;
    
    ELSE
      -- Default to student if no role specified
      INSERT INTO public.students (user_id)
      VALUES (new.id)
      ON CONFLICT (user_id) DO NOTHING;
  END CASE;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block the signup
    RAISE LOG 'Error in handle_new_user function: %', SQLERRM;
    RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();