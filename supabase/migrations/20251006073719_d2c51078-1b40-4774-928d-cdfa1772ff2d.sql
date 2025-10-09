-- Add admin policies for agent_students table
CREATE POLICY "Admins can view all agent_students"
ON agent_students FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert agent_students"
ON agent_students FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update agent_students"
ON agent_students FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete agent_students"
ON agent_students FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM administrators WHERE user_id = auth.uid()
  )
);