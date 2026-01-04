-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Create Platform Finance Table to track global stats
create table if not exists public.platform_finance (
  id uuid primary key default gen_random_uuid(),
  total_processing_fees decimal(20, 2) default 0.00 not null, -- 5% collected from users
  total_processing_profit decimal(20, 2) default 0.00 not null, -- 5% - stripe_fees
  total_withdrawal_fees decimal(20, 2) default 0.00 not null, -- 15% collected from creators
  total_stripe_costs decimal(20, 2) default 0.00 not null, -- All stripe fees paid
  total_profit decimal(20, 2) default 0.00 not null, -- processing_profit + withdrawal_fees
  updated_at timestamp with time zone default now()
);

-- Initialize platform finance record if it doesn't exist
insert into public.platform_finance (id) 
select gen_random_uuid()
where not exists (select 1 from public.platform_finance);

-- 2. Create Master Transactions Table (The "Truth" Log)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id), -- Payer
  creator_id uuid references auth.users(id), -- Receiver (if applicable)
  post_id uuid, -- Related content (if applicable)
  
  type text not null check (type in ('subscription', 'unlock', 'tip', 'micro', 'withdrawal', 'top_up')),
  status text default 'completed',
  
  -- Financial Breakdown
  price_original decimal(10, 2) default 0.00, -- Base price (e.g. $10)
  user_paid decimal(10, 2) default 0.00, -- What user actually paid (e.g. $10.50)
  processing_fee_user decimal(10, 2) default 0.00, -- The 5% fee (e.g. $0.50)
  stripe_fee decimal(10, 2) default 0.00, -- Actual cost from Stripe (e.g. $0.35)
  creator_earnings decimal(10, 2) default 0.00, -- What creator gets (e.g. $10.00)
  platform_profit decimal(10, 2) default 0.00, -- Net profit for platform
  
  currency text default 'usd',
  stripe_payment_id text, -- Stripe Payment Intent ID
  stripe_transfer_id text, -- Stripe Transfer ID (for payouts)
  
  created_at timestamp with time zone default now()
);

-- 3. Enhance Withdrawals Table (payout_requests)
-- We'll use the existing payout_requests but ensure it has necessary fields
alter table public.payout_requests 
add column if not exists platform_fee decimal(10, 2) default 0.00,
add column if not exists stripe_fee decimal(10, 2) default 0.00,
add column if not exists net_amount decimal(10, 2) default 0.00; -- What creator actually received

-- 4. Function to Update Platform Finance Stats
create or replace function public.update_platform_finance(
  p_processing_fee decimal,
  p_stripe_cost decimal,
  p_withdrawal_fee decimal
)
returns void as $$
begin
  update public.platform_finance
  set 
    total_processing_fees = total_processing_fees + coalesce(p_processing_fee, 0),
    total_stripe_costs = total_stripe_costs + coalesce(p_stripe_cost, 0),
    total_withdrawal_fees = total_withdrawal_fees + coalesce(p_withdrawal_fee, 0),
    
    -- Calculated fields
    total_processing_profit = total_processing_profit + (coalesce(p_processing_fee, 0) - coalesce(p_stripe_cost, 0)),
    total_profit = total_profit + (coalesce(p_processing_fee, 0) - coalesce(p_stripe_cost, 0)) + coalesce(p_withdrawal_fee, 0),
    
    updated_at = now();
end;
$$ language plpgsql security definer;

-- 5. Grant permissions
grant select, insert on public.transactions to authenticated;
grant select on public.platform_finance to authenticated; -- Admins only in real app, but simplified for now
