-- Add thumbnail fields to posts table for SEO and OG previews
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_blurred_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_posts_thumbnail ON posts(thumbnail_url);

-- Add comment for documentation
COMMENT ON COLUMN posts.thumbnail_url IS 'Original thumbnail URL for post preview (1200x630 for OG)';
COMMENT ON COLUMN posts.thumbnail_blurred_url IS 'Blurred version of thumbnail for 18+ content previews';
