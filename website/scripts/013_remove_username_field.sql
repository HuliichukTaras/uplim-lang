-- Remove redundant username field, keep only handle
-- handle is the unique identifier used in URLs (without @)
-- display_name is the display name shown to users

-- Drop username column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS username;

-- Ensure handle is unique and not null for existing users
UPDATE public.profiles 
SET handle = COALESCE(handle, id::text)
WHERE handle IS NULL OR handle = '';

-- Add unique constraint on handle if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_handle_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_handle_key UNIQUE (handle);
  END IF;
END $$;

-- Update the trigger to only use handle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, handle)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(
      new.raw_user_meta_data->>'preferred_username',
      split_part(new.email, '@', 1)
    )
  );
  RETURN new;
END;
$$;
