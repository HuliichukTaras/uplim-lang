-- Add new monetization and content detection fields to posts table
-- This supports subscription unlock, PPV, and quest unlock

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'image_post' CHECK (content_type IN ('image_post', 'video_post', 'reel', 'gallery_post')),
ADD COLUMN IF NOT EXISTS adult_confidence FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unlock_via_subscription BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unlock_via_ppv BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unlock_via_quest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ppv_price_cents INTEGER,
ADD COLUMN IF NOT EXISTS quest_type TEXT CHECK (quest_type IN ('shares', 'likes', 'follows')),
ADD COLUMN IF NOT EXISTS quest_target INTEGER;

-- Update existing posts to have content_type based on post_type
UPDATE posts 
SET content_type = CASE 
  WHEN post_type = 'reel' THEN 'reel'
  WHEN video_url IS NOT NULL THEN 'video_post'
  WHEN array_length(media_urls, 1) > 1 THEN 'gallery_post'
  ELSE 'image_post'
END
WHERE content_type IS NULL OR content_type = 'image_post';

-- Create index for content_type filtering
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_is_locked ON posts(is_locked);

-- Create quest_progress table to track user progress on quest unlocks
CREATE TABLE IF NOT EXISTS quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL,
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on quest_progress
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for quest_progress
CREATE POLICY quest_progress_select_own ON quest_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY quest_progress_insert_own ON quest_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY quest_progress_update_own ON quest_progress
  FOR UPDATE USING (user_id = auth.uid());

-- Create index for quest_progress lookups
CREATE INDEX IF NOT EXISTS idx_quest_progress_user_post ON quest_progress(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_completed ON quest_progress(completed);

-- Function to increment quest progress
CREATE OR REPLACE FUNCTION increment_quest_progress(
  p_user_id UUID,
  p_post_id UUID,
  p_quest_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target INTEGER;
  v_current INTEGER;
  v_creator_id UUID;
  v_completed BOOLEAN;
BEGIN
  -- Get post details
  SELECT user_id, quest_target INTO v_creator_id, v_target
  FROM posts
  WHERE id = p_post_id AND quest_type = p_quest_type;

  IF v_target IS NULL THEN
    RETURN false;
  END IF;

  -- Insert or update progress
  INSERT INTO quest_progress (user_id, post_id, creator_id, quest_type, current_progress, target_progress)
  VALUES (p_user_id, p_post_id, v_creator_id, p_quest_type, p_increment, v_target)
  ON CONFLICT (user_id, post_id)
  DO UPDATE SET
    current_progress = quest_progress.current_progress + p_increment,
    updated_at = NOW();

  -- Check if completed
  SELECT current_progress >= target_progress, current_progress
  INTO v_completed, v_current
  FROM quest_progress
  WHERE user_id = p_user_id AND post_id = p_post_id;

  -- Mark as completed and unlock post
  IF v_completed AND NOT EXISTS (
    SELECT 1 FROM post_unlocks WHERE user_id = p_user_id AND post_id = p_post_id
  ) THEN
    UPDATE quest_progress
    SET completed = true, completed_at = NOW()
    WHERE user_id = p_user_id AND post_id = p_post_id;

    INSERT INTO post_unlocks (user_id, post_id)
    VALUES (p_user_id, p_post_id);
  END IF;

  RETURN v_completed;
END;
$$;
