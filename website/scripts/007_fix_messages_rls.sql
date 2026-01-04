-- Fix infinite recursion in RLS policies

-- Drop problematic policies
DROP POLICY IF EXISTS conversation_participants_select_own ON conversation_participants;
DROP POLICY IF EXISTS conversation_participants_insert_own ON conversation_participants;
DROP POLICY IF EXISTS conversation_participants_update_own ON conversation_participants;

-- Recreate conversation_participants policies without recursion
CREATE POLICY conversation_participants_select_own ON conversation_participants
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY conversation_participants_insert_own ON conversation_participants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY conversation_participants_update_own ON conversation_participants
  FOR UPDATE
  USING (user_id = auth.uid());
