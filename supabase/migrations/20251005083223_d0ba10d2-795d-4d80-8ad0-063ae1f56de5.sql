-- Update conversations table to support direct user-to-user chats

-- Add participant columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS participant_1_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS participant_2_id UUID REFERENCES auth.users(id);

-- Make application_id fully optional since we now support direct chats
ALTER TABLE conversations ALTER COLUMN application_id DROP NOT NULL;

-- Create index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id);

-- Drop existing RLS policies for conversations
DROP POLICY IF EXISTS "Users can view conversations for their applications" ON conversations;

-- New RLS policies for conversations

-- Users can view conversations where they are a participant
CREATE POLICY "Users can view their conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = participant_1_id 
  OR auth.uid() = participant_2_id
  OR application_id IN (
    SELECT id FROM applications WHERE student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  )
);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() = participant_1_id 
  OR auth.uid() = participant_2_id
);

-- Users can update their own conversations
CREATE POLICY "Users can update their conversations"
ON conversations
FOR UPDATE
USING (
  auth.uid() = participant_1_id 
  OR auth.uid() = participant_2_id
);

-- Update RLS policies for chat_messages

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert messages where they are sender" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages where they are sender or receiver" ON chat_messages;

-- Users can view messages in their conversations
CREATE POLICY "Users can view their messages"
ON chat_messages
FOR SELECT
USING (
  auth.uid() = sender_user_id 
  OR auth.uid() = receiver_user_id
);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_user_id
  AND (
    -- Can message if conversation exists
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
    -- Or if messaging a university official (students can initiate)
    OR receiver_user_id IN (
      SELECT user_id FROM university_officials
    )
    -- Or if messaging a student who applied to their university (officials can initiate)
    OR (
      auth.uid() IN (SELECT user_id FROM university_officials)
      AND receiver_user_id IN (
        SELECT s.user_id FROM students s
        JOIN applications a ON a.student_id = s.id
        JOIN programs p ON p.id = a.program_id
        JOIN university_officials uo ON uo.university_id = p.university_id
        WHERE uo.user_id = auth.uid()
      )
    )
  )
);