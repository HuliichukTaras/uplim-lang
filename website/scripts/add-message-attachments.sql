-- Check if attachments column exists in messages table, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'attachments'
    ) THEN
        ALTER TABLE messages ADD COLUMN attachments JSONB DEFAULT NULL;
    END IF;
END $$;
