-- Allow authenticated users to read basic profile info of other users for chat functionality
CREATE POLICY "Authenticated users can read basic profile info"
ON users
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);