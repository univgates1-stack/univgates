-- Ensure unique constraint exists for address upsert
-- This allows proper upsert behavior based on user_id and address_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'addresses_user_id_address_type_key'
  ) THEN
    ALTER TABLE public.addresses 
    ADD CONSTRAINT addresses_user_id_address_type_key 
    UNIQUE (user_id, address_type);
  END IF;
END $$;