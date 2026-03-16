-- Create handle_history table to store old handles for redirects
CREATE TABLE IF NOT EXISTS public.handle_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_handle text NOT NULL,
  new_handle text NOT NULL,
  changed_at timestamp with time zone DEFAULT now(),
  UNIQUE(old_handle)
);

-- Add handle_updated_at column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS handle_updated_at timestamp with time zone DEFAULT now();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_handle_history_old_handle ON public.handle_history(old_handle);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);

-- Enable RLS
ALTER TABLE public.handle_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for handle_history
CREATE POLICY "handle_history_select_all" ON public.handle_history
  FOR SELECT USING (true);

CREATE POLICY "handle_history_insert_own" ON public.handle_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to generate unique handle from display name
CREATE OR REPLACE FUNCTION generate_unique_handle(base_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  clean_handle text;
  final_handle text;
  counter integer := 1;
BEGIN
  -- Clean the base name: lowercase, remove special chars except ._-
  clean_handle := lower(regexp_replace(base_name, '[^a-zA-Z0-9._-]', '', 'g'));
  
  -- Remove leading/trailing dots, underscores, hyphens
  clean_handle := trim(both '._-' from clean_handle);
  
  -- If empty after cleaning, use 'user'
  IF clean_handle = '' OR length(clean_handle) < 3 THEN
    clean_handle := 'user';
  END IF;
  
  -- Limit to 30 characters
  clean_handle := substring(clean_handle from 1 for 30);
  
  final_handle := clean_handle;
  
  -- Check for duplicates and add numbers if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = final_handle) LOOP
    counter := counter + 1;
    final_handle := clean_handle || counter::text;
  END LOOP;
  
  RETURN final_handle;
END;
$$;

-- Update existing profiles without handles
UPDATE public.profiles
SET handle = generate_unique_handle(COALESCE(display_name, 'user' || substring(id::text from 1 for 8)))
WHERE handle IS NULL OR handle = '' OR handle ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Make handle NOT NULL and add constraint
ALTER TABLE public.profiles 
ALTER COLUMN handle SET NOT NULL,
ADD CONSTRAINT handle_format CHECK (handle ~ '^[a-z0-9._-]{3,30}$'),
ADD CONSTRAINT handle_unique UNIQUE (handle);

COMMENT ON TABLE public.handle_history IS 'Stores old handles for redirect support';
COMMENT ON COLUMN public.profiles.handle_updated_at IS 'Last time handle was changed (30-day limit)';
