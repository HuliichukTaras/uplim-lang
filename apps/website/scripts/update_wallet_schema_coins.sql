-- Update Wallets table for Coins
ALTER TABLE wallets 
ADD COLUMN coins_balance INTEGER DEFAULT 0;

-- Update Wallet Transactions for detailed profit tracking
ALTER TABLE wallet_transactions
ADD COLUMN amount_coins INTEGER,
ADD COLUMN stripe_fee DECIMAL(10, 2),
ADD COLUMN platform_profit DECIMAL(10, 2),
ADD COLUMN fee_amount DECIMAL(10, 2); -- To store the +10% fee

-- Update Content Unlocks for Coins
ALTER TABLE content_unlocks
ADD COLUMN coins_spent INTEGER,
ADD COLUMN platform_profit_coins INTEGER;

-- Creator Settings for payout share
ALTER TABLE creator_settings
ADD COLUMN payout_percentage INTEGER DEFAULT 80;
