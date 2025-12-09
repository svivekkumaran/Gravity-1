-- Add tamil_blessing to settings table and delivery_address to bills table

-- Add tamil_blessing column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tamil_blessing TEXT DEFAULT 'உ
ஸ்ரீ ராம ஜெயம்';

-- Add delivery_address column to bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS delivery_address TEXT;
