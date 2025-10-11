-- Fix the function search path security issue by removing the redundant trigger and function
-- Drop the trigger first, then the function
DROP TRIGGER IF EXISTS on_auth_user_created_university_official ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_university_official();

-- The existing handle_new_user function already handles university official creation properly
-- and has the correct search_path set