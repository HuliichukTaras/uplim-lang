-- Create post_views table for deduped view tracking
CREATE TABLE IF NOT EXISTS post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID,
  viewed_at TIMESTAMP DEFAULT NOW(),
  
  -- UNIQUE constraint: one user (or anonymous session) per post
  UNIQUE(post_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id);

-- Enable RLS
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can insert their own views
CREATE POLICY post_views_insert_own ON post_views FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: anyone can read all views
CREATE POLICY post_views_select_all ON post_views FOR SELECT USING (true);
