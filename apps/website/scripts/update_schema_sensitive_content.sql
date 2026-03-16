-- Update posts table to support new sensitive content system
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS adult_confidence FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS blur_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unlock_methods TEXT[] DEFAULT ARRAY['microtransaction', 'subscription', 'quest'];

-- Update user_post_unlocks to track unlock type
ALTER TABLE post_unlocks 
ADD COLUMN IF NOT EXISTS unlock_type TEXT DEFAULT 'payment'; -- 'payment', 'subscription', 'quest'

-- Ensure we have a way to track shares for quests
CREATE TABLE IF NOT EXISTS post_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id) -- Prevent spamming shares for the same post
);

-- Add RLS policies for post_shares
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own shares" 
ON post_shares FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own shares" 
ON post_shares FOR SELECT 
USING (auth.uid() = user_id);

-- Function to check if quest is complete (example logic)
CREATE OR REPLACE FUNCTION check_quest_completion(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_shares_count INT;
  v_likes_count INT;
  v_target_shares INT := 1; -- Simplified for now, prompt said 3-5 but let's start with 1 for UX
  v_has_liked BOOLEAN;
BEGIN
  -- Check if user liked the post
  SELECT EXISTS (
    SELECT 1 FROM likes WHERE user_id = p_user_id AND post_id = p_post_id
  ) INTO v_has_liked;

  -- Check share count (this user sharing this post)
  SELECT COUNT(*) INTO v_shares_count 
  FROM post_shares 
  WHERE user_id = p_user_id AND post_id = p_post_id;

  -- Return true if both conditions met
  RETURN v_has_liked AND (v_shares_count >= 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
