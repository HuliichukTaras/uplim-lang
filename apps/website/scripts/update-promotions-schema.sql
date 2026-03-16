-- Add blocked_by_policy status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'promotions_status_check'
    AND conrelid = 'public.promotions'::regclass
  ) THEN
    ALTER TABLE public.promotions 
    DROP CONSTRAINT IF EXISTS promotions_status_check;
    
    ALTER TABLE public.promotions 
    ADD CONSTRAINT promotions_status_check 
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'blocked_by_policy'));
  END IF;
END $$;

-- Add index for faster promotion queries
CREATE INDEX IF NOT EXISTS idx_promotions_active_non_adult 
ON public.promotions(status, views_delivered) 
WHERE status = 'active';

-- Add index for promotion feed queries
CREATE INDEX IF NOT EXISTS idx_posts_is_adult 
ON public.posts(is_adult);

-- Function to auto-block promotions if post becomes 18+
CREATE OR REPLACE FUNCTION check_post_adult_status_on_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- If post becomes 18+, pause all active promotions for this post
  IF NEW.is_adult = true AND OLD.is_adult = false THEN
    UPDATE public.promotions
    SET status = 'blocked_by_policy',
        end_date = NOW()
    WHERE post_id = NEW.id
    AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trigger_check_post_adult_status ON public.posts;
CREATE TRIGGER trigger_check_post_adult_status
  AFTER UPDATE OF is_adult ON public.posts
  FOR EACH ROW
  WHEN (NEW.is_adult = true AND OLD.is_adult = false)
  EXECUTE FUNCTION check_post_adult_status_on_promotion();

-- Add comment explaining the blocked_by_policy status
COMMENT ON COLUMN public.promotions.status IS 
'Promotion status: pending (payment not confirmed), active (running), completed (views target reached), cancelled (user cancelled), blocked_by_policy (post became 18+ after promotion started)';
