-- Add country column to addresses table for storing address country
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS country TEXT;