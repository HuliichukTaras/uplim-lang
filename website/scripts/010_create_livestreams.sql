-- Live Streams Tables
CREATE TABLE IF NOT EXISTS livestreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stream_url TEXT, -- URL для відео стріму (WebRTC, RTMP, тощо)
  thumbnail_url TEXT,
  is_live BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations Table
CREATE TABLE IF NOT EXISTS livestream_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livestream_id UUID NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  stripe_payment_intent_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Livestream Viewers (для tracking хто дивиться)
CREATE TABLE IF NOT EXISTS livestream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livestream_id UUID NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(livestream_id, viewer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_livestreams_creator ON livestreams(creator_id);
CREATE INDEX IF NOT EXISTS idx_livestreams_is_live ON livestreams(is_live);
CREATE INDEX IF NOT EXISTS idx_donations_livestream ON livestream_donations(livestream_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON livestream_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_viewers_livestream ON livestream_viewers(livestream_id);

-- RLS Policies
ALTER TABLE livestreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream_viewers ENABLE ROW LEVEL SECURITY;

-- Livestreams: всі можуть читати активні стріми
CREATE POLICY livestreams_select_all ON livestreams
  FOR SELECT USING (true);

-- Livestreams: тільки автор може створювати/оновлювати свої стріми
CREATE POLICY livestreams_insert_own ON livestreams
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY livestreams_update_own ON livestreams
  FOR UPDATE USING (auth.uid() = creator_id);

-- Donations: всі можуть читати
CREATE POLICY donations_select_all ON livestream_donations
  FOR SELECT USING (true);

-- Donations: автентифіковані можуть створювати
CREATE POLICY donations_insert_authenticated ON livestream_donations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Viewers: всі можуть читати
CREATE POLICY viewers_select_all ON livestream_viewers
  FOR SELECT USING (true);

-- Viewers: автентифіковані можуть додавати себе
CREATE POLICY viewers_insert_own ON livestream_viewers
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY viewers_update_own ON livestream_viewers
  FOR UPDATE USING (auth.uid() = viewer_id);
