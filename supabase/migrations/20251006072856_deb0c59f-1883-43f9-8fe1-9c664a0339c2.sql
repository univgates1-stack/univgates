-- Add agent fields to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS institution_name TEXT,
ADD COLUMN IF NOT EXISTS role_title TEXT,
ADD COLUMN IF NOT EXISTS company_number TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES administrators(id),
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT;

-- Create agent_students junction table for agents managing multiple students
CREATE TABLE IF NOT EXISTS agent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_id, student_id)
);

-- Enable RLS on agent_students
ALTER TABLE agent_students ENABLE ROW LEVEL SECURITY;

-- Agents can view their own students
CREATE POLICY "Agents can view their students"
ON agent_students FOR SELECT
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);

-- Agents can add students
CREATE POLICY "Agents can add students"
ON agent_students FOR INSERT
TO authenticated
WITH CHECK (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);

-- Agents can remove students
CREATE POLICY "Agents can remove students"
ON agent_students FOR DELETE
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);

-- Add admin policies for viewing all users
CREATE POLICY "Admins can view all students"
ON students FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update students"
ON students FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all agents"
ON agents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update agents"
ON agents FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all university officials"
ON university_officials FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update university officials"
ON university_officials FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all universities"
ON universities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert universities"
ON universities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update universities"
ON universities FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete universities"
ON universities FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all programs"
ON programs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert programs"
ON programs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update programs"
ON programs FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete programs"
ON programs FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all applications"
ON applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update applications"
ON applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

-- Admin chat policies - admins can see all chats
CREATE POLICY "Admins can view all conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all messages"
ON chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can send messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

-- Agents can view students they manage  
CREATE POLICY "Agents can view managed students"
ON students FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT student_id 
    FROM agent_students 
    WHERE agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  )
);

-- Agents can update managed students
CREATE POLICY "Agents can update managed students"
ON students FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT student_id 
    FROM agent_students 
    WHERE agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  )
);

-- Agents can view documents of managed students
CREATE POLICY "Agents can view managed student documents"
ON documents FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT student_id 
    FROM agent_students 
    WHERE agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  )
);

-- Agents can upload documents for managed students
CREATE POLICY "Agents can upload documents for managed students"
ON documents FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT student_id 
    FROM agent_students 
    WHERE agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  )
);

-- Agents can view applications of managed students
CREATE POLICY "Agents can view managed student applications"
ON applications FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT student_id 
    FROM agent_students 
    WHERE agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  )
);

-- Agents can create applications for managed students
CREATE POLICY "Agents can create applications for managed students"
ON applications FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT student_id 
    FROM agent_students 
    WHERE agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  )
);

-- Agents can update applications of managed students
CREATE POLICY "Agents can update managed student applications"
ON applications FOR UPDATE
TO authenticated
USING (
  student_id IN (
    SELECT student_id 
    FROM agent_students 
    WHERE agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  )
);