-- Add default PPV price to creator settings
ALTER TABLE creator_settings
ADD COLUMN IF NOT EXISTS default_ppv_price NUMERIC(10, 2) DEFAULT 5.00;

-- Update existing creators with default price
UPDATE creator_settings
SET default_ppv_price = 5.00
WHERE default_ppv_price IS NULL;
