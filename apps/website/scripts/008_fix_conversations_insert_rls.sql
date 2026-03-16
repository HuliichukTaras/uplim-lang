-- Fix RLS policy for conversations INSERT
-- Allow users to create new conversations

DROP POLICY IF EXISTS conversations_insert_own ON conversations;

CREATE POLICY conversations_insert_own ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure conversation_participants allows insert
DROP POLICY IF EXISTS conversation_participants_insert_own ON conversation_participants;

CREATE POLICY conversation_participants_insert_own ON conversation_participants
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
