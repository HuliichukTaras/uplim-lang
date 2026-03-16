-- Create livestream chat table
CREATE TABLE IF NOT EXISTS livestream_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livestream_id UUID NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_livestream_chat_livestream ON livestream_chat(livestream_id, created_at DESC);

-- Enable RLS
ALTER TABLE livestream_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read chat messages"
  ON livestream_chat FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON livestream_chat FOR INSERT
  WITH CHECK (auth.uid() = user_id);
