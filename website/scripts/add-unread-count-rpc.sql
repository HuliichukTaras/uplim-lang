-- Function to count unread messages for the current user
-- Returns the count of messages in conversations the user participates in,
-- sent by others, created after the user's last read time,
-- and not deleted by the user.

CREATE OR REPLACE FUNCTION get_my_unread_message_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count integer;
BEGIN
  SELECT COUNT(*)
  INTO total_count
  FROM messages m
  JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
  WHERE cp.user_id = auth.uid()
  AND m.sender_id != auth.uid()
  AND m.created_at > cp.last_read_at
  -- deleted_by is uuid[], so we must compare with ARRAY[auth.uid()] which is uuid[]
  -- Removed ::text cast to fix "operator does not exist: uuid[] @> text[]" error
  AND NOT (m.deleted_by @> ARRAY[auth.uid()]);
  
  RETURN total_count;
END;
$$;
