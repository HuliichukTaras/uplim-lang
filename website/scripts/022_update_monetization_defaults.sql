-- Ensure creator_settings table has correct structure for subscription pricing
-- Add subscription_price if it doesn't exist (it already exists based on schema)

-- Update posts table to ensure monetization fields are correct
ALTER TABLE posts
  ALTER COLUMN unlock_via_subscription SET DEFAULT false,
  ALTER COLUMN unlock_via_ppv SET DEFAULT false,
  ALTER COLUMN unlock_via_quest SET DEFAULT true;

-- Set default quest settings for existing posts
UPDATE posts
SET 
  quest_type = 'combined',
  quest_target = 5
WHERE quest_type IS NULL OR quest_target IS NULL;

-- Add combined quest type support
COMMENT ON COLUMN posts.quest_type IS 'Quest unlock type: shares, likes, follows, or combined (all three required)';
