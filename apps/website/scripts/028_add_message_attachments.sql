-- Enable attachments in messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachments jsonb[] DEFAULT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN public.messages.attachments IS 'Array of attachment objects: { type: "image" | "file", url: string, name: string, size: number, mimeType: string }';
