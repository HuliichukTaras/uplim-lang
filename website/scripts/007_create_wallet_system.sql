-- Create wallets table
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  available_balance decimal(10, 2) default 0.00 not null check (available_balance >= 0),
  pending_balance decimal(10, 2) default 0.00 not null check (pending_balance >= 0),
  total_earned decimal(10, 2) default 0.00 not null,
  total_withdrawn decimal(10, 2) default 0.00 not null,
  currency text default 'usd' not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create wallet_transactions table (immutable ledger)
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount decimal(10, 2) not null,
  type text not null check (type in ('credit', 'debit')),
  category text not null check (category in ('top_up', 'post_unlock_earning', 'subscription_earning', 'withdrawal', 'refund', 'platform_fee')),
  reference_id uuid,
  reference_type text,
  balance_after decimal(10, 2) not null,
  description text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Create payout_requests table
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  amount decimal(10, 2) not null check (amount > 0),
  currency text default 'usd' not null,
  status text default 'pending' not null check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payout_method text not null check (payout_method in ('bank_transfer', 'card', 'stripe_connect')),
  payout_details jsonb,
  stripe_payout_id text unique,
  failure_reason text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for performance
create index if not exists idx_wallets_user_id on public.wallets(user_id);
create index if not exists idx_wallet_transactions_wallet_id on public.wallet_transactions(wallet_id);
create index if not exists idx_wallet_transactions_user_id on public.wallet_transactions(user_id);
create index if not exists idx_wallet_transactions_created_at on public.wallet_transactions(created_at desc);
create index if not exists idx_payout_requests_user_id on public.payout_requests(user_id);
create index if not exists idx_payout_requests_status on public.payout_requests(status);

-- Enable RLS
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payout_requests enable row level security;

-- Drop existing policies before creating to avoid conflicts
drop policy if exists "wallets_select_own" on public.wallets;
drop policy if exists "wallets_insert_own" on public.wallets;
drop policy if exists "wallets_update_own" on public.wallets;
drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
drop policy if exists "payout_requests_select_own" on public.payout_requests;
drop policy if exists "payout_requests_insert_own" on public.payout_requests;
drop policy if exists "payout_requests_update_own" on public.payout_requests;

-- Wallets policies
create policy "wallets_select_own"
  on public.wallets for select
  using (auth.uid() = user_id);

create policy "wallets_insert_own"
  on public.wallets for insert
  with check (auth.uid() = user_id);

create policy "wallets_update_own"
  on public.wallets for update
  using (auth.uid() = user_id);

-- Wallet transactions policies (read-only for users)
create policy "wallet_transactions_select_own"
  on public.wallet_transactions for select
  using (auth.uid() = user_id);

-- Payout requests policies
create policy "payout_requests_select_own"
  on public.payout_requests for select
  using (auth.uid() = user_id);

create policy "payout_requests_insert_own"
  on public.payout_requests for insert
  with check (auth.uid() = user_id);

create policy "payout_requests_update_own"
  on public.payout_requests for update
  using (auth.uid() = user_id);

-- Function to automatically create wallet for new users
create or replace function public.create_wallet_for_user()
returns trigger as $$
begin
  insert into public.wallets (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create wallet on user creation
drop trigger if exists on_auth_user_created_create_wallet on auth.users;
create trigger on_auth_user_created_create_wallet
  after insert on auth.users
  for each row execute function public.create_wallet_for_user();

-- Function to record wallet transaction
create or replace function public.record_wallet_transaction(
  p_wallet_id uuid,
  p_user_id uuid,
  p_amount decimal,
  p_type text,
  p_category text,
  p_reference_id uuid default null,
  p_reference_type text default null,
  p_description text default null,
  p_metadata jsonb default null
)
returns uuid as $$
declare
  v_current_balance decimal;
  v_new_balance decimal;
  v_transaction_id uuid;
begin
  -- Get current balance
  select available_balance into v_current_balance
  from public.wallets
  where id = p_wallet_id;

  -- Calculate new balance
  if p_type = 'credit' then
    v_new_balance := v_current_balance + p_amount;
  else
    v_new_balance := v_current_balance - p_amount;
  end if;

  -- Insert transaction record
  insert into public.wallet_transactions (
    wallet_id,
    user_id,
    amount,
    type,
    category,
    reference_id,
    reference_type,
    balance_after,
    description,
    metadata
  ) values (
    p_wallet_id,
    p_user_id,
    p_amount,
    p_type,
    p_category,
    p_reference_id,
    p_reference_type,
    v_new_balance,
    p_description,
    p_metadata
  ) returning id into v_transaction_id;

  -- Update wallet balance
  if p_type = 'credit' then
    update public.wallets
    set 
      available_balance = available_balance + p_amount,
      total_earned = case when p_category in ('post_unlock_earning', 'subscription_earning', 'top_up') then total_earned + p_amount else total_earned end,
      updated_at = now()
    where id = p_wallet_id;
  else
    update public.wallets
    set 
      available_balance = available_balance - p_amount,
      total_withdrawn = case when p_category = 'withdrawal' then total_withdrawn + p_amount else total_withdrawn end,
      updated_at = now()
    where id = p_wallet_id;
  end if;

  return v_transaction_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission on the function
grant execute on function public.record_wallet_transaction to authenticated;
