-- Add video_url column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment
COMMENT ON COLUMN public.posts.video_url IS 'URL of uploaded video (max 1 per post)';
