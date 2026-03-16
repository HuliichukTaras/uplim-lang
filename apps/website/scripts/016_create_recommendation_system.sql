-- TELLOOS Recommendation System
-- TikTok/Instagram level personalization engine

-- 1. User Signal Events
-- Track ALL user interactions for ranking
CREATE TABLE IF NOT EXISTS user_signal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'like', 'unlike', 'share', 'comment', 'watch', 'watch_full', 'rewatch',
    'scroll_pause', 'scroll_skip', 'profile_visit', 'unlock', 'subscribe',
    'follow', 'save', 'report', 'block', 'search_click'
  )),
  value JSONB, -- {duration_ms: 5000, percentage: 95, etc}
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_signals_user_time ON user_signal_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_signals_post ON user_signal_events(post_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_type ON user_signal_events(event_type);

-- 2. Post Features
-- Content characteristics for matching
CREATE TABLE IF NOT EXISTS post_features (
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  hashtags TEXT[] DEFAULT '{}',
  content_category TEXT, -- fitness, art, cosplay, etc
  velocity_score NUMERIC DEFAULT 0, -- engagement rate in first hour
  trending_score NUMERIC DEFAULT 0,
  quality_score NUMERIC DEFAULT 0,
  creator_trust_score NUMERIC DEFAULT 0,
  upload_hour INTEGER, -- 0-23
  is_viral BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_features_velocity ON post_features(velocity_score DESC);
CREATE INDEX IF NOT EXISTS idx_post_features_trending ON post_features(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_post_features_category ON post_features(content_category);

-- 3. Creator Affinity
-- User's preference for specific creators
CREATE TABLE IF NOT EXISTS creator_affinity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0, -- calculated from interactions
  interactions_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_affinity_user ON creator_affinity(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_creator_affinity_creator ON creator_affinity(creator_id);

-- 4. Hashtag Affinity
-- User's interest in specific hashtags
CREATE TABLE IF NOT EXISTS hashtag_affinity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  interactions_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hashtag)
);

CREATE INDEX IF NOT EXISTS idx_hashtag_affinity_user ON hashtag_affinity(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_affinity_tag ON hashtag_affinity(hashtag);

-- 5. Recommendation Queue
-- Pre-generated personalized feeds
CREATE TABLE IF NOT EXISTS recommendation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_ids UUID[] NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
  algorithm_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_queue_user ON recommendation_queue(user_id, generated_at DESC);

-- 6. User Preferences
-- Learned user behavior patterns
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  adult_content_affinity NUMERIC DEFAULT 0, -- 0-1 scale
  preferred_content_types TEXT[] DEFAULT '{}', -- video, image, reel
  preferred_categories TEXT[] DEFAULT '{}',
  peak_activity_hours INTEGER[] DEFAULT '{}', -- when user is most active
  avg_session_duration INTEGER DEFAULT 0, -- seconds
  fast_skip_threshold NUMERIC DEFAULT 1.0, -- seconds before skip = dislike
  cold_start_completed BOOLEAN DEFAULT false,
  interactions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Content Similarity Cache
-- Pre-computed similar posts
CREATE TABLE IF NOT EXISTS content_similarity (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  similar_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  similarity_score NUMERIC NOT NULL,
  similarity_type TEXT NOT NULL, -- hashtag, semantic, creator, category
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, similar_post_id)
);

CREATE INDEX IF NOT EXISTS idx_content_similarity_score ON content_similarity(post_id, similarity_score DESC);

-- 8. Seen Posts Log
-- Track what users have already seen
CREATE TABLE IF NOT EXISTS seen_posts (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_seen_posts_user_time ON seen_posts(user_id, seen_at DESC);

-- Cleanup old seen posts (keep last 7 days)
-- Drop function before recreating to avoid parameter name conflicts
DROP FUNCTION IF EXISTS cleanup_old_seen_posts();
CREATE OR REPLACE FUNCTION cleanup_old_seen_posts()
RETURNS void AS $$
BEGIN
  DELETE FROM seen_posts WHERE seen_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 9. RLS Policies
-- Drop existing policies before recreating them

ALTER TABLE user_signal_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_signal_events_insert_own ON user_signal_events;
DROP POLICY IF EXISTS user_signal_events_select_own ON user_signal_events;
CREATE POLICY user_signal_events_insert_own ON user_signal_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_signal_events_select_own ON user_signal_events
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE creator_affinity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS creator_affinity_select_own ON creator_affinity;
CREATE POLICY creator_affinity_select_own ON creator_affinity
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE hashtag_affinity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hashtag_affinity_select_own ON hashtag_affinity;
CREATE POLICY hashtag_affinity_select_own ON hashtag_affinity
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE recommendation_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recommendation_queue_select_own ON recommendation_queue;
CREATE POLICY recommendation_queue_select_own ON recommendation_queue
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_preferences_select_own ON user_preferences;
DROP POLICY IF EXISTS user_preferences_update_own ON user_preferences;
CREATE POLICY user_preferences_select_own ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_preferences_update_own ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE seen_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS seen_posts_insert_own ON seen_posts;
DROP POLICY IF EXISTS seen_posts_select_own ON seen_posts;
CREATE POLICY seen_posts_insert_own ON seen_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY seen_posts_select_own ON seen_posts
  FOR SELECT USING (auth.uid() = user_id);

-- 10. Functions for Ranking

-- Drop all functions before recreating to avoid parameter conflicts
DROP FUNCTION IF EXISTS calculate_user_signal_score(UUID, UUID);
DROP FUNCTION IF EXISTS check_monetization_eligibility(UUID);
DROP FUNCTION IF EXISTS trigger_check_monetization();

-- Calculate user signal score
CREATE OR REPLACE FUNCTION calculate_user_signal_score(
  p_user_id UUID,
  p_post_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
  v_event RECORD;
BEGIN
  -- Weight configuration
  FOR v_event IN 
    SELECT event_type, value, timestamp
    FROM user_signal_events
    WHERE user_id = p_user_id
    AND timestamp > NOW() - INTERVAL '30 days'
    LIMIT 1000
  LOOP
    CASE v_event.event_type
      WHEN 'unlock' THEN v_score := v_score + 30;
      WHEN 'subscribe' THEN v_score := v_score + 20;
      WHEN 'share' THEN v_score := v_score + 10;
      WHEN 'comment' THEN v_score := v_score + 8;
      WHEN 'like' THEN v_score := v_score + 6;
      WHEN 'watch_full' THEN v_score := v_score + 5;
      WHEN 'watch' THEN v_score := v_score + 3;
      WHEN 'scroll_pause' THEN v_score := v_score + 1;
      WHEN 'scroll_skip' THEN v_score := v_score - 5;
      WHEN 'report' THEN v_score := v_score - 20;
      WHEN 'block' THEN v_score := v_score - 100;
    END CASE;
  END LOOP;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Check if user is eligible for monetization (2500+ followers)
CREATE OR REPLACE FUNCTION check_monetization_eligibility(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_followers_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_followers_count
  FROM follows
  WHERE following_id = p_user_id;
  
  IF v_followers_count >= 2500 THEN
    -- Auto-enable monetization
    UPDATE profiles
    SET monetization_enabled = true,
        monetization_unlocked_at = COALESCE(monetization_unlocked_at, NOW())
    WHERE id = p_user_id
    AND monetization_enabled = false;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check monetization on new follower
DROP TRIGGER IF EXISTS follows_check_monetization ON follows;
CREATE OR REPLACE FUNCTION trigger_check_monetization()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_monetization_eligibility(NEW.following_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follows_check_monetization
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION trigger_check_monetization();
