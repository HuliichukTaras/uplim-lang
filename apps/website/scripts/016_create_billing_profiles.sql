-- Create billing_profiles table
create table if not exists public.billing_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text not null,
  tax_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.billing_profiles enable row level security;

-- Policies
create policy "Users can view their own billing profile"
  on public.billing_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own billing profile"
  on public.billing_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own billing profile"
  on public.billing_profiles for update
  using (auth.uid() = user_id);

-- Create index
create index if not exists idx_billing_profiles_user_id on public.billing_profiles(user_id);
