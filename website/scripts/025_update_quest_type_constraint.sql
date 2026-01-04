-- Update quest_type constraint to allow combined quest types
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_quest_type_check;

ALTER TABLE posts ADD CONSTRAINT posts_quest_type_check 
CHECK (quest_type IN ('shares', 'likes', 'follows', 'like_and_share', 'combined'));

-- Update comment to reflect new values
COMMENT ON COLUMN posts.quest_type IS 'Quest unlock type: shares, likes, follows, like_and_share (like + share required), or combined (all three required)';
