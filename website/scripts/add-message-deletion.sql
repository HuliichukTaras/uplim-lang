-- Add columns for message deletion features
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS deleted_by UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT FALSE;
