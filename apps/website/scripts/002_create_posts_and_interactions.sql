-- Create posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text,
  media_urls text[] not null, -- Array of media URLs
  is_paid boolean default false,
  price decimal(10, 2) default 0,
  is_nsfw boolean default false,
  tags text[] default '{}',
  likes_count integer default 0,
  comments_count integer default 0,
  views_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create likes table
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, post_id)
);

-- Create comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create follows table
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(follower_id, following_id)
);

-- Create post_unlocks table (for pay-per-post)
create table if not exists public.post_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, post_id)
);

-- Enable RLS on all tables
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.post_unlocks enable row level security;

-- Posts policies
create policy "posts_select_all"
  on public.posts for select
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "posts_update_own"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "posts_delete_own"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Likes policies
create policy "likes_select_all"
  on public.likes for select
  using (true);

create policy "likes_insert_own"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "likes_delete_own"
  on public.likes for delete
  using (auth.uid() = user_id);

-- Comments policies
create policy "comments_select_all"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "comments_update_own"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "comments_delete_own"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Follows policies
create policy "follows_select_all"
  on public.follows for select
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Post unlocks policies
create policy "post_unlocks_select_own"
  on public.post_unlocks for select
  using (auth.uid() = user_id);

create policy "post_unlocks_insert_own"
  on public.post_unlocks for insert
  with check (auth.uid() = user_id);

-- Function to increment likes count
create or replace function public.increment_likes_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.posts
  set likes_count = likes_count + 1
  where id = new.post_id;
  return new;
end;
$$;

-- Function to decrement likes count
create or replace function public.decrement_likes_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.posts
  set likes_count = likes_count - 1
  where id = old.post_id;
  return old;
end;
$$;

-- Function to increment comments count
create or replace function public.increment_comments_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.posts
  set comments_count = comments_count + 1
  where id = new.post_id;
  return new;
end;
$$;

-- Function to decrement comments count
create or replace function public.decrement_comments_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.posts
  set comments_count = comments_count - 1
  where id = old.post_id;
  return old;
end;
$$;

-- Triggers for likes
drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert on public.likes
  for each row
  execute function public.increment_likes_count();

drop trigger if exists on_like_deleted on public.likes;
create trigger on_like_deleted
  after delete on public.likes
  for each row
  execute function public.decrement_likes_count();

-- Triggers for comments
drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row
  execute function public.increment_comments_count();

drop trigger if exists on_comment_deleted on public.comments;
create trigger on_comment_deleted
  after delete on public.comments
  for each row
  execute function public.decrement_comments_count();
