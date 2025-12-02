-- Add discount, transport details, and billing notes to bills table (SQLite)
ALTER TABLE bills ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN transport_vehicle_number TEXT;
ALTER TABLE bills ADD COLUMN transport_charge DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN billing_notes TEXT;
