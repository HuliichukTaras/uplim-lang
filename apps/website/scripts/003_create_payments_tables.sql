-- Create subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  status text not null, -- active, canceled, past_due, etc.
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(subscriber_id, creator_id)
);

-- Create transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  stripe_payment_intent_id text unique,
  amount decimal(10, 2) not null,
  currency text default 'usd',
  status text not null, -- succeeded, pending, failed
  type text not null, -- post_unlock, subscription
  created_at timestamp with time zone default now()
);

-- Create creator_settings table
create table if not exists public.creator_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text unique,
  stripe_account_status text, -- pending, active, restricted
  subscription_price decimal(10, 2) default 9.99,
  subscription_enabled boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.subscriptions enable row level security;
alter table public.transactions enable row level security;
alter table public.creator_settings enable row level security;

-- Subscriptions policies
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = subscriber_id or auth.uid() = creator_id);

create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = subscriber_id);

create policy "subscriptions_update_own"
  on public.subscriptions for update
  using (auth.uid() = subscriber_id or auth.uid() = creator_id);

-- Transactions policies
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id or auth.uid() = creator_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Creator settings policies
create policy "creator_settings_select_all"
  on public.creator_settings for select
  using (true);

create policy "creator_settings_insert_own"
  on public.creator_settings for insert
  with check (auth.uid() = id);

create policy "creator_settings_update_own"
  on public.creator_settings for update
  using (auth.uid() = id);
