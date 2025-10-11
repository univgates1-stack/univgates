-- Update the handle_new_user function to handle role-specific data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, first_name, last_name, language_preference)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'language_preference', 'en')
  );

  -- Insert role-specific data based on the user's role
  CASE new.raw_user_meta_data->>'role'
    WHEN 'student' THEN
      INSERT INTO public.students (user_id)
      VALUES (new.id);
    
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
      );
    
    WHEN 'administrator' THEN
      INSERT INTO public.administrators (user_id)
      VALUES (new.id);
    
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
      );
    
    ELSE
      -- Default to student if no role specified
      INSERT INTO public.students (user_id)
      VALUES (new.id);
  END CASE;

  RETURN new;
END;
$$;