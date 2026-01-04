-- Add message request status to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked'));

-- Add rate limiting table for spam prevention
CREATE TABLE IF NOT EXISTS message_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipient_id)
);

-- Add spam reports table
CREATE TABLE IF NOT EXISTS spam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE message_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE spam_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_rate_limits
CREATE POLICY message_rate_limits_select_own ON message_rate_limits
  FOR SELECT USING (user_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY message_rate_limits_insert_system ON message_rate_limits
  FOR INSERT WITH CHECK (true);

CREATE POLICY message_rate_limits_update_system ON message_rate_limits
  FOR UPDATE USING (true);

-- RLS policies for spam_reports
CREATE POLICY spam_reports_insert_own ON spam_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY spam_reports_select_own ON spam_reports
  FOR SELECT USING (reporter_id = auth.uid() OR reported_user_id = auth.uid());

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_message_rate_limits_user_recipient ON message_rate_limits(user_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_spam_reports_reported_user ON spam_reports(reported_user_id);
