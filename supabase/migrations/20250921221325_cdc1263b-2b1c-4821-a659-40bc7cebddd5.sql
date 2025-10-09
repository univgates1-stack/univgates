-- Add missing fields to university_officials table and create missing tables
ALTER TABLE public.university_officials 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Add RLS policies for university_onboarding_steps table
ALTER TABLE public.university_onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "University officials can manage own onboarding steps" 
ON public.university_onboarding_steps 
FOR ALL 
USING (official_id = auth.uid()) 
WITH CHECK (official_id = auth.uid());

-- Add RLS policies for user_addresses table  
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses" 
ON public.user_addresses 
FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Add RLS policies for user_phones table
ALTER TABLE public.user_phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own phones" 
ON public.user_phones 
FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());