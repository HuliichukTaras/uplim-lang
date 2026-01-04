-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Email notifications
  email_new_follower BOOLEAN DEFAULT true,
  email_new_like BOOLEAN DEFAULT true,
  email_new_comment BOOLEAN DEFAULT true,
  email_new_message BOOLEAN DEFAULT true,
  email_new_post_from_following BOOLEAN DEFAULT true,
  email_purchase_notification BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT true,
  
  -- Push notifications (for future)
  push_enabled BOOLEAN DEFAULT false,
  push_new_follower BOOLEAN DEFAULT true,
  push_new_like BOOLEAN DEFAULT true,
  push_new_comment BOOLEAN DEFAULT true,
  push_new_message BOOLEAN DEFAULT true,
  
  -- Frequency settings
  email_frequency TEXT DEFAULT 'instant', -- instant, daily, weekly
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  last_digest_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "notification_preferences_select_own" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_insert_own" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences_update_own" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Email queue table for batch sending
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- new_follower, new_like, new_comment, new_post, weekly_digest
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Allow service role to access
CREATE POLICY "email_queue_service_all" ON email_queue
  FOR ALL USING (true);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
