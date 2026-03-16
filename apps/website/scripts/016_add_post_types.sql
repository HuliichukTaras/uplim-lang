-- Add post_type enum to distinguish between regular posts, reels, and live streams
DO $$ BEGIN
  CREATE TYPE post_type AS ENUM ('post', 'reel', 'live');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add post_type column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS post_type post_type DEFAULT 'post';

-- Add duration column for reels (in seconds)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS duration integer;

-- Add index for faster filtering by post_type
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);

-- Add index for reels feed (type + created_at)
CREATE INDEX IF NOT EXISTS idx_posts_reels_feed ON posts(post_type, created_at DESC) WHERE post_type = 'reel';
