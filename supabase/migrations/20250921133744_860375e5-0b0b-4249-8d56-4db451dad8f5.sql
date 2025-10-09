-- Fix the function search path security issue
DROP FUNCTION IF EXISTS public.handle_new_university_official();

-- Since we already have a comprehensive handle_new_user function that creates 
-- university_officials records, we don't need the new function.
-- The existing function already handles university official creation properly.