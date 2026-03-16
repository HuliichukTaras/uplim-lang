-- Add foreign key constraints from various tables to profiles table
-- This allows PostgREST to understand the relationships and enables efficient joins

-- First, we need to ensure all user_ids in posts exist in profiles
-- (they should, but let's be safe)
DO $$
BEGIN
  -- Check if any posts have user_ids that don't exist in profiles
  IF EXISTS (
    SELECT 1 FROM public.posts p
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p.user_id)
  ) THEN
    RAISE NOTICE 'Found posts with missing profiles. Creating profiles for orphaned posts.';
    
    -- Create profiles for any missing user_ids
    INSERT INTO public.profiles (id, username, display_name)
    SELECT DISTINCT p.user_id, NULL, 'User'
    FROM public.posts p
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p.user_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Now add the foreign key constraint from posts to profiles
-- We need to drop the existing constraint to auth.users first
ALTER TABLE public.posts 
  DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- Add new constraint to profiles instead
ALTER TABLE public.posts
  ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Do the same for comments
ALTER TABLE public.comments 
  DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Do the same for likes
ALTER TABLE public.likes 
  DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

ALTER TABLE public.likes
  ADD CONSTRAINT likes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Do the same for follows (both follower and following)
ALTER TABLE public.follows 
  DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;

ALTER TABLE public.follows
  ADD CONSTRAINT follows_follower_id_fkey 
  FOREIGN KEY (follower_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.follows 
  DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

ALTER TABLE public.follows
  ADD CONSTRAINT follows_following_id_fkey 
  FOREIGN KEY (following_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Do the same for post_unlocks
ALTER TABLE public.post_unlocks 
  DROP CONSTRAINT IF EXISTS post_unlocks_user_id_fkey;

ALTER TABLE public.post_unlocks
  ADD CONSTRAINT post_unlocks_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';
