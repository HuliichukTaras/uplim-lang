-- Add 'promotion' to wallet_transactions category enum
ALTER TABLE public.wallet_transactions 
DROP CONSTRAINT IF EXISTS wallet_transactions_category_check;

ALTER TABLE public.wallet_transactions 
ADD CONSTRAINT wallet_transactions_category_check 
CHECK (category IN ('top_up', 'post_unlock_earning', 'subscription_earning', 'withdrawal', 'refund', 'platform_fee', 'promotion'));
