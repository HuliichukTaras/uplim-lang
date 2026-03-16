-- Add shares_count field to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Update existing posts to have 0 shares
UPDATE posts
SET shares_count = 0
WHERE shares_count IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_shares_count ON posts(shares_count);
