-- Create curiosity_unlocks table for the "like 3 free posts to unlock" feature
create table if not exists public.curiosity_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  likes_given integer default 0,
  unlocked boolean default false,
  created_at timestamp with time zone default now(),
  unlocked_at timestamp with time zone,
  unique(user_id, post_id)
);

-- Enable RLS
alter table public.curiosity_unlocks enable row level security;

-- Drop existing policies if they exist
drop policy if exists "curiosity_unlocks_select_own" on public.curiosity_unlocks;
drop policy if exists "curiosity_unlocks_insert_own" on public.curiosity_unlocks;
drop policy if exists "curiosity_unlocks_update_own" on public.curiosity_unlocks;

-- Create policies
create policy "curiosity_unlocks_select_own"
  on public.curiosity_unlocks for select
  using (auth.uid() = user_id);

create policy "curiosity_unlocks_insert_own"
  on public.curiosity_unlocks for insert
  with check (auth.uid() = user_id);

create policy "curiosity_unlocks_update_own"
  on public.curiosity_unlocks for update
  using (auth.uid() = user_id);

-- Add curiosity_unlock flag to posts
alter table public.posts add column if not exists curiosity_unlock boolean default false;

-- Add blur_level to posts table
alter table public.posts add column if not exists blur_level int default 1;

-- Add age_verified to profiles table
alter table public.profiles add column if not exists age_verified boolean default false;

comment on column public.posts.blur_level is '0 = none, 1 = soft, 2 = medium, 3 = hard';
comment on column public.profiles.age_verified is 'User has verified they are 18+';
