-- Add payment card verification to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_card_verified BOOLEAN DEFAULT FALSE;

-- Update RLS policies to allow public read access
DROP POLICY IF EXISTS posts_select_all ON posts;
CREATE POLICY posts_select_all ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_select_all ON profiles;
CREATE POLICY profiles_select_all ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS likes_select_all ON likes;
CREATE POLICY likes_select_all ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS comments_select_all ON comments;
CREATE POLICY comments_select_all ON comments FOR SELECT USING (true);
