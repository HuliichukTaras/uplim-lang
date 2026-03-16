-- Add auth_provider and last_login fields to profiles
alter table public.profiles 
  add column if not exists auth_provider text default 'email',
  add column if not exists last_login timestamp with time zone default now();

-- Update the handle_new_user function to extract Google data
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_name text;
  user_avatar text;
  provider text;
begin
  -- Extract user metadata from Google OAuth or email signup
  user_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'display_name',
    split_part(new.email, '@', 1) -- fallback to email username
  );
  
  user_avatar := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );
  
  -- Determine auth provider
  provider := case 
    when new.raw_user_meta_data ->> 'provider' = 'google' then 'google'
    when new.raw_user_meta_data ->> 'iss' like '%google%' then 'google'
    else 'email'
  end;
  
  -- Insert profile with Google data
  insert into public.profiles (
    id, 
    username, 
    display_name, 
    avatar_url,
    auth_provider,
    last_login
  )
  values (
    new.id,
    null, -- Username can be set later by user
    user_name,
    user_avatar,
    provider,
    now()
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    last_login = now();
  
  return new;
end;
$$;

-- Create function to update last_login on each sign-in
create or replace function public.update_last_login()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set last_login = now()
  where id = new.id;
  
  return new;
end;
$$;

-- Create trigger to update last_login when user signs in
drop trigger if exists on_auth_user_login on auth.users;

create trigger on_auth_user_login
  after update on auth.users
  for each row
  when (old.last_sign_in_at is distinct from new.last_sign_in_at)
  execute function public.update_last_login();

-- Add index for faster lookups
create index if not exists idx_profiles_auth_provider on public.profiles(auth_provider);
create index if not exists idx_profiles_last_login on public.profiles(last_login desc);
