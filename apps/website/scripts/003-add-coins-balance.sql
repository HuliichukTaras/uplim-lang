-- Add coins_balance column to wallets table if it doesn't exist
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS coins_balance INTEGER DEFAULT 0;

-- Create RPC function for atomic coin payment processing
CREATE OR REPLACE FUNCTION process_coin_payment(
  p_user_id UUID,
  p_creator_id UUID,
  p_amount_coins INTEGER,
  p_author_coins INTEGER,
  p_post_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user_wallet_id UUID;
  v_creator_wallet_id UUID;
BEGIN
  -- Get user wallet
  SELECT id INTO v_user_wallet_id FROM wallets WHERE user_id = p_user_id;
  
  -- Get or create creator wallet
  SELECT id INTO v_creator_wallet_id FROM wallets WHERE user_id = p_creator_id;
  
  IF v_creator_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, coins_balance, available_balance, pending_balance, total_earned, total_withdrawn)
    VALUES (p_creator_id, 0, 0, 0, 0, 0)
    RETURNING id INTO v_creator_wallet_id;
  END IF;
  
  -- Deduct coins from user
  UPDATE wallets 
  SET coins_balance = coins_balance - p_amount_coins,
      updated_at = NOW()
  WHERE id = v_user_wallet_id;
  
  -- Add coins to creator (author share)
  UPDATE wallets 
  SET coins_balance = coins_balance + p_author_coins,
      total_earned = total_earned + (p_author_coins / 10.0), -- Convert back to EUR
      updated_at = NOW()
  WHERE id = v_creator_wallet_id;
  
  -- Create unlock record
  INSERT INTO post_unlocks (post_id, user_id, unlock_type, created_at)
  VALUES (p_post_id, p_user_id, 'payment', NOW())
  ON CONFLICT DO NOTHING;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to add coins after top-up
CREATE OR REPLACE FUNCTION add_coins_to_wallet(
  p_user_id UUID,
  p_coins INTEGER,
  p_eur_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE wallets 
  SET coins_balance = COALESCE(coins_balance, 0) + p_coins,
      available_balance = COALESCE(available_balance, 0) + p_eur_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no wallet exists, create one
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, coins_balance, available_balance, pending_balance, total_earned, total_withdrawn)
    VALUES (p_user_id, p_coins, p_eur_amount, 0, 0, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
