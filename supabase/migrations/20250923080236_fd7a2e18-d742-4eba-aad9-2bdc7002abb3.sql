-- Add missing fields to students table for better data mapping
ALTER TABLE students ADD COLUMN IF NOT EXISTS interested_program TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_country TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_phones_user_id ON user_phones(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_student_id ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_documents_student_id ON student_exam_documents(student_id);

-- Ensure proper constraints for address and phone tables
ALTER TABLE user_addresses ADD CONSTRAINT unique_user_address_type UNIQUE(user_id, address_type);
ALTER TABLE user_phones ADD CONSTRAINT unique_user_phone_type UNIQUE(user_id, phone_type);

-- Add proper foreign key relationships
DO $$ BEGIN
    -- Add foreign key from students to users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_user_id_fkey'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key from user_addresses to users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_addresses_user_id_fkey'
    ) THEN
        ALTER TABLE user_addresses ADD CONSTRAINT user_addresses_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key from user_phones to users if it doesn't exist  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_phones_user_id_fkey'
    ) THEN
        ALTER TABLE user_phones ADD CONSTRAINT user_phones_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update RLS policies for better data access patterns
DROP POLICY IF EXISTS "Users can manage own addresses" ON user_addresses;
CREATE POLICY "Users can manage own addresses" ON user_addresses
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own phones" ON user_phones;  
CREATE POLICY "Users can manage own phones" ON user_phones
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure countries table has proper data
INSERT INTO countries (name, description_en) VALUES 
    ('Turkey', 'Republic of Turkey'),
    ('United States', 'United States of America'),
    ('United Kingdom', 'United Kingdom'),
    ('Germany', 'Federal Republic of Germany'),
    ('Canada', 'Canada'),
    ('Australia', 'Commonwealth of Australia')
ON CONFLICT (name) DO NOTHING;