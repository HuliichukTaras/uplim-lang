-- Add new columns to wallets table for pending/available earnings
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS earnings_pending_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS earnings_available_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_profit_cents INTEGER DEFAULT 0;

-- Add monetization status to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS monetization_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS monetization_unlocked_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Function to check if user can monetize (2500+ followers)
CREATE OR REPLACE FUNCTION check_monetization_eligibility(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  follower_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO follower_count
  FROM follows
  WHERE following_id = user_uuid;
  
  RETURN follower_count >= 2500;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock monetization when user reaches 2500 followers
CREATE OR REPLACE FUNCTION unlock_monetization_if_eligible()
RETURNS TRIGGER AS $$
DECLARE
  follower_count INTEGER;
  is_eligible BOOLEAN;
BEGIN
  -- Count followers for the user being followed
  SELECT COUNT(*) INTO follower_count
  FROM follows
  WHERE following_id = NEW.following_id;
  
  -- Check if they just crossed the 2500 threshold
  IF follower_count >= 2500 THEN
    is_eligible := true;
    
    -- Update profile to enable monetization
    UPDATE profiles
    SET 
      monetization_enabled = true,
      monetization_unlocked_at = CASE 
        WHEN monetization_unlocked_at IS NULL THEN NOW()
        ELSE monetization_unlocked_at
      END
    WHERE id = NEW.following_id
    AND monetization_enabled = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-unlock monetization
DROP TRIGGER IF EXISTS trigger_unlock_monetization ON follows;
CREATE TRIGGER trigger_unlock_monetization
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION unlock_monetization_if_eligible();

-- Function to process earnings split (50/50)
CREATE OR REPLACE FUNCTION process_earnings_split(
  p_creator_id UUID,
  p_total_amount_cents INTEGER,
  p_transaction_type TEXT,
  p_reference_id TEXT
)
RETURNS TABLE(
  creator_share_cents INTEGER,
  platform_share_cents INTEGER,
  goes_to_pending BOOLEAN
) AS $$
DECLARE
  v_creator_share INTEGER;
  v_platform_share INTEGER;
  v_is_monetization_enabled BOOLEAN;
  v_wallet_id UUID;
BEGIN
  -- Calculate 50/50 split
  v_creator_share := FLOOR(p_total_amount_cents / 2.0);
  v_platform_share := p_total_amount_cents - v_creator_share;
  
  -- Check if creator has monetization enabled
  SELECT monetization_enabled INTO v_is_monetization_enabled
  FROM profiles
  WHERE id = p_creator_id;
  
  -- Get or create wallet
  SELECT id INTO v_wallet_id
  FROM wallets
  WHERE user_id = p_creator_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, available_balance, pending_balance, currency)
    VALUES (p_creator_id, 0, 0, 'USD')
    RETURNING id INTO v_wallet_id;
  END IF;
  
  -- Update wallet based on monetization status
  IF v_is_monetization_enabled THEN
    -- Goes to available earnings
    UPDATE wallets
    SET 
      earnings_available_cents = COALESCE(earnings_available_cents, 0) + v_creator_share,
      available_balance = COALESCE(available_balance, 0) + (v_creator_share / 100.0),
      total_earned = COALESCE(total_earned, 0) + (v_creator_share / 100.0),
      platform_profit_cents = COALESCE(platform_profit_cents, 0) + v_platform_share,
      updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Record transaction
    INSERT INTO wallet_transactions (
      wallet_id,
      user_id,
      amount,
      type,
      category,
      description,
      reference_id,
      reference_type,
      metadata
    ) VALUES (
      v_wallet_id,
      p_creator_id,
      v_creator_share / 100.0,
      'credit',
      'earnings',
      'Creator earnings (50% of ' || p_transaction_type || ')',
      p_reference_id,
      'payment',
      jsonb_build_object('split_type', 'available', 'platform_share_cents', v_platform_share)
    );
    
    RETURN QUERY SELECT v_creator_share, v_platform_share, false;
  ELSE
    -- Goes to pending earnings
    UPDATE wallets
    SET 
      earnings_pending_cents = COALESCE(earnings_pending_cents, 0) + v_creator_share,
      pending_balance = COALESCE(pending_balance, 0) + (v_creator_share / 100.0),
      platform_profit_cents = COALESCE(platform_profit_cents, 0) + v_platform_share,
      updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Record transaction
    INSERT INTO wallet_transactions (
      wallet_id,
      user_id,
      amount,
      type,
      category,
      description,
      reference_id,
      reference_type,
      metadata
    ) VALUES (
      v_wallet_id,
      p_creator_id,
      v_creator_share / 100.0,
      'credit',
      'earnings_pending',
      'Pending earnings (50% of ' || p_transaction_type || ' - unlocks at 2500 followers)',
      p_reference_id,
      'payment',
      jsonb_build_object('split_type', 'pending', 'platform_share_cents', v_platform_share)
    );
    
    RETURN QUERY SELECT v_creator_share, v_platform_share, true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION process_earnings_split IS 'Splits payments 50/50 between creator and platform. Earnings go to pending if creator has <2500 followers, otherwise to available balance.';
COMMENT ON FUNCTION check_monetization_eligibility IS 'Returns true if user has 2500+ followers and can withdraw earnings.';
COMMENT ON FUNCTION unlock_monetization_if_eligible IS 'Automatically enables monetization when user reaches 2500 followers.';
