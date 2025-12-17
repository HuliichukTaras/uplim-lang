-- Fix deleted_by null values to ensure simplified queries work
UPDATE messages SET deleted_by = '{}' WHERE deleted_by IS NULL;
ALTER TABLE messages ALTER COLUMN deleted_by SET DEFAULT '{}';

-- If the column was nullable, we can now make it not null to prevent future issues
-- But first ensuring no nulls exist (which we just did)
ALTER TABLE messages ALTER COLUMN deleted_by SET NOT NULL;
