-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_eur NUMERIC(10, 2) NOT NULL,
  estimated_views INTEGER NOT NULL,
  views_delivered INTEGER DEFAULT 0,
  profile_visits_delivered INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promotion impressions tracking table
CREATE TABLE IF NOT EXISTS public.promotion_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_post_id ON public.promotions(post_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_views_delivered ON public.promotions(views_delivered);
CREATE INDEX IF NOT EXISTS idx_promotion_impressions_promotion_id ON public.promotion_impressions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_impressions_viewer_id ON public.promotion_impressions(viewer_id);
CREATE INDEX IF NOT EXISTS idx_promotion_impressions_timestamp ON public.promotion_impressions(timestamp DESC);

-- RLS Policies for promotions table
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_select_own"
  ON public.promotions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "promotions_insert_own"
  ON public.promotions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "promotions_update_own"
  ON public.promotions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for promotion_impressions table
ALTER TABLE public.promotion_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotion_impressions_select_own"
  ON public.promotion_impressions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.promotions
      WHERE promotions.id = promotion_impressions.promotion_id
      AND promotions.user_id = auth.uid()
    )
  );

CREATE POLICY "promotion_impressions_insert_authenticated"
  ON public.promotion_impressions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Function to auto-complete promotions when views are reached
CREATE OR REPLACE FUNCTION check_promotion_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.views_delivered >= NEW.estimated_views AND NEW.status = 'active' THEN
    NEW.status = 'completed';
    NEW.end_date = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_promotion_completion
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION check_promotion_completion();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotions_updated_at();
