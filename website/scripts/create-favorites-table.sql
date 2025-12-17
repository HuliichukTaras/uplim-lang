-- Create post_favorites table for bookmarking posts
CREATE TABLE IF NOT EXISTS post_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE post_favorites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own favorites"
  ON post_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own favorites"
  ON post_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON post_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_post_favorites_user_id ON post_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_post_favorites_post_id ON post_favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_post_favorites_created_at ON post_favorites(created_at DESC);
