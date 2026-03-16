-- Add moderation fields to posts table
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS moderation_meta jsonb,
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

-- Add index for moderation queries
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);

-- Update RLS policies to hide rejected posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (
    moderation_status IN ('approved', 'pending') OR 
    user_id = auth.uid()
  );

COMMENT ON COLUMN posts.moderation_meta IS 'Stores moderation API responses and scores';
COMMENT ON COLUMN posts.moderation_status IS 'pending: awaiting moderation, approved: passed, rejected: blocked, flagged: needs human review';
