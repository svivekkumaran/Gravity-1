-- Add discount, transport details, and billing notes to bills table
ALTER TABLE bills ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS transport_vehicle_number TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS transport_charge DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS billing_notes TEXT;
