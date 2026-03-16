-- Fix notifications table foreign key to point to profiles instead of auth.users
-- This fixes the PostgREST relationship error

-- Drop the existing foreign key constraint if it exists
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

-- Add the correct foreign key constraint pointing to profiles
ALTER TABLE notifications
ADD CONSTRAINT notifications_actor_id_fkey 
FOREIGN KEY (actor_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Create index for better performance on actor_id lookups
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);

-- Ensure user_id foreign key also exists
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE notifications
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
