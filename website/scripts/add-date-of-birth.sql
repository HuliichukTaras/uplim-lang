-- Add date_of_birth field to profiles table for age verification
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add constraint to ensure users are 18+ years old
ALTER TABLE profiles
ADD CONSTRAINT check_age_18_or_older
CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '18 years');

-- Update RLS policies to enforce age verification
CREATE POLICY "age_verified_required_for_sensitive_content"
ON post_unlocks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.age_verified = true
    AND profiles.date_of_birth <= CURRENT_DATE - INTERVAL '18 years'
  )
);
