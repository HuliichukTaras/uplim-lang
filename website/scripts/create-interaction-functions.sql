-- Create database functions to update counts atomically

-- Function to increment likes_count
CREATE OR REPLACE FUNCTION increment_likes_count(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes_count
CREATE OR REPLACE FUNCTION decrement_likes_count(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comments_count
CREATE OR REPLACE FUNCTION increment_comments_count(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment shares_count
CREATE OR REPLACE FUNCTION increment_shares_count(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET shares_count = shares_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
