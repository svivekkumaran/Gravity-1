-- Add new columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;

-- Add new columns to bills table
ALTER TABLE bills ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS customer_gstin TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS place_of_supply TEXT DEFAULT 'Tamil Nadu (33)';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS amount_in_words TEXT;
