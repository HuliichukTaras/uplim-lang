-- ============================================
-- NOTIFICATION SYSTEM V2 - Event-based with Aggregation
-- ============================================

-- 1) notification_events - raw event storage
CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- like|comment|follow|subscribe|unlock|tip|view|post_created|message
  entity_type TEXT NOT NULL, -- post|comment|profile|subscription
  entity_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_sensitive BOOLEAN DEFAULT FALSE, -- for 18+ content; emails must not include explicit preview
  processed_at TIMESTAMPTZ -- used by aggregators
);

-- Indexes for notification_events
CREATE INDEX IF NOT EXISTS idx_notification_events_recipient_created 
  ON public.notification_events(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_recipient_processed 
  ON public.notification_events(recipient_id, processed_at);
CREATE INDEX IF NOT EXISTS idx_notification_events_type 
  ON public.notification_events(type);
CREATE INDEX IF NOT EXISTS idx_notification_events_unprocessed 
  ON public.notification_events(recipient_id) WHERE processed_at IS NULL;

-- Enable RLS for notification_events
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Policies for notification_events
DROP POLICY IF EXISTS "notification_events_select_own" ON public.notification_events;
DROP POLICY IF EXISTS "notification_events_insert_service" ON public.notification_events;

CREATE POLICY "notification_events_select_own" ON public.notification_events
  FOR SELECT USING (auth.uid() = recipient_id);

-- Allow service role to insert (via API routes)
CREATE POLICY "notification_events_insert_service" ON public.notification_events
  FOR INSERT WITH CHECK (true);


-- 2) Add aggregation fields to existing notifications table
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS group_key TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id TEXT,
  ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ DEFAULT NOW();

-- Unique constraint for grouping
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_group 
  ON public.notifications(user_id, group_key) WHERE group_key IS NOT NULL;

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_last_event 
  ON public.notifications(user_id, read, last_event_at DESC);


-- 3) Enhance notification_preferences with new fields
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Kyiv',
  ADD COLUMN IF NOT EXISTS email_daily_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_weekly_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_product_updates BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_promos_enabled BOOLEAN DEFAULT FALSE, -- opt-in
  ADD COLUMN IF NOT EXISTS email_behavioral_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS digest_hour_local INTEGER DEFAULT 19, -- 0-23 local hour
  ADD COLUMN IF NOT EXISTS max_emails_per_week INTEGER DEFAULT 4, -- global cap
  ADD COLUMN IF NOT EXISTS quiet_hours_start INTEGER DEFAULT 22,
  ADD COLUMN IF NOT EXISTS quiet_hours_end INTEGER DEFAULT 9,
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT,
  ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ; -- pause all emails until this date

-- Generate unsubscribe tokens for existing rows
UPDATE public.notification_preferences 
SET unsubscribe_token = encode(gen_random_bytes(32), 'hex')
WHERE unsubscribe_token IS NULL;

-- Make unsubscribe_token unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_unsubscribe_token 
  ON public.notification_preferences(unsubscribe_token);


-- 4) email_send_log - anti-spam + analytics
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template TEXT NOT NULL, -- daily_digest|weekly_digest|winback|new_subscriber|promo|product_update
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_message_id TEXT,
  open_tracked BOOLEAN DEFAULT FALSE,
  click_tracked BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for email_send_log
CREATE INDEX IF NOT EXISTS idx_email_send_log_user_sent 
  ON public.email_send_log(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_template 
  ON public.email_send_log(template, sent_at DESC);

-- Enable RLS for email_send_log
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

-- Policies for email_send_log
DROP POLICY IF EXISTS "email_send_log_select_own" ON public.email_send_log;
DROP POLICY IF EXISTS "email_send_log_insert_service" ON public.email_send_log;

CREATE POLICY "email_send_log_select_own" ON public.email_send_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_send_log_insert_service" ON public.email_send_log
  FOR INSERT WITH CHECK (true);


-- 5) Update email_queue with new fields
ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS template TEXT, -- daily_digest|weekly_digest|winback|new_subscriber|promo|product_update
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT;


-- 6) Function to aggregate notification event into in-app notification
CREATE OR REPLACE FUNCTION aggregate_notification_event(
  p_recipient_id UUID,
  p_actor_id UUID,
  p_type TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_is_sensitive BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_group_key TEXT;
  v_notification_id UUID;
  v_existing_id UUID;
BEGIN
  -- Create group key for aggregation
  v_group_key := p_type || ':' || p_entity_type || ':' || p_entity_id;
  
  -- Check if notification with this group_key exists
  SELECT id INTO v_existing_id
  FROM public.notifications
  WHERE user_id = p_recipient_id AND group_key = v_group_key;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing notification
    UPDATE public.notifications
    SET 
      count = count + 1,
      last_actor_id = p_actor_id,
      last_event_at = NOW(),
      read = FALSE,
      metadata = p_metadata,
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_notification_id;
  ELSE
    -- Create new notification
    INSERT INTO public.notifications (
      user_id, actor_id, type, group_key, entity_type, entity_id, 
      count, last_actor_id, last_event_at, metadata, read
    )
    VALUES (
      p_recipient_id, p_actor_id, p_type, v_group_key, p_entity_type, p_entity_id,
      1, p_actor_id, NOW(), p_metadata, FALSE
    )
    RETURNING id INTO v_notification_id;
  END IF;
  
  -- Insert raw event for email digests
  INSERT INTO public.notification_events (
    recipient_id, actor_id, type, entity_type, entity_id, metadata, is_sensitive
  )
  VALUES (
    p_recipient_id, p_actor_id, p_type, p_entity_type, p_entity_id, p_metadata, p_is_sensitive
  );
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7) Function to get emails sent this week for rate limiting
CREATE OR REPLACE FUNCTION get_emails_sent_this_week(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.email_send_log
  WHERE user_id = p_user_id 
    AND sent_at >= NOW() - INTERVAL '7 days';
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8) Function to check if user is in quiet hours
CREATE OR REPLACE FUNCTION is_user_in_quiet_hours(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_prefs RECORD;
  v_user_hour INTEGER;
BEGIN
  SELECT * INTO v_prefs
  FROM public.notification_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get current hour in user's timezone
  v_user_hour := EXTRACT(HOUR FROM NOW() AT TIME ZONE COALESCE(v_prefs.timezone, 'UTC'));
  
  -- Check quiet hours (handles overnight range like 22-9)
  IF v_prefs.quiet_hours_start > v_prefs.quiet_hours_end THEN
    -- Overnight quiet hours (e.g., 22:00 to 09:00)
    RETURN v_user_hour >= v_prefs.quiet_hours_start OR v_user_hour < v_prefs.quiet_hours_end;
  ELSE
    -- Same-day quiet hours
    RETURN v_user_hour >= v_prefs.quiet_hours_start AND v_user_hour < v_prefs.quiet_hours_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
