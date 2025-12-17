-- Add new fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS link_in_bio TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Create index on handle for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);

-- Fixed: DROP existing policy first, then CREATE (IF NOT EXISTS not supported for policies)
DROP POLICY IF EXISTS "profiles_select_by_handle" ON profiles;

CREATE POLICY "profiles_select_by_handle"
ON profiles FOR SELECT
USING (true);
