-- Add new columns to products table
ALTER TABLE products ADD COLUMN hsn_code TEXT;

-- Add new columns to bills table
ALTER TABLE bills ADD COLUMN customer_address TEXT;
ALTER TABLE bills ADD COLUMN customer_gstin TEXT;
ALTER TABLE bills ADD COLUMN place_of_supply TEXT DEFAULT 'Tamil Nadu (33)';
ALTER TABLE bills ADD COLUMN amount_in_words TEXT;
