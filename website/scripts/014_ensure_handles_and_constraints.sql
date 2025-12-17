-- Generate handles for users who don't have one
UPDATE profiles
SET handle = LOWER(REGEXP_REPLACE(SPLIT_PART(id::text, '-', 1), '[^a-z0-9]', '', 'g'))
WHERE handle IS NULL OR handle = '';

-- Make handle NOT NULL and add UNIQUE constraint
ALTER TABLE profiles
ALTER COLUMN handle SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_handle_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_handle_key UNIQUE (handle);
  END IF;
END $$;

-- Create index for faster handle lookups
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);

-- Update RLS policy to allow handle-based lookups
DROP POLICY IF EXISTS "profiles_select_by_handle" ON profiles;
CREATE POLICY "profiles_select_by_handle" ON profiles
  FOR SELECT
  USING (true);
