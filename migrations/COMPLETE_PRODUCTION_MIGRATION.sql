-- ============================================
-- COMPLETE MIGRATION SCRIPT FOR PRODUCTION
-- Run this on your Vercel PostgreSQL database
-- ============================================

-- Migration 1: Add invoice fields (address, GSTIN, HSN, POS, amount in words)
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;

ALTER TABLE bills ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS customer_gstin TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS place_of_supply TEXT DEFAULT 'Tamil Nadu (33)';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS amount_in_words TEXT;

-- Migration 2: Add discount, transport details, and billing notes
ALTER TABLE bills ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS transport_vehicle_number TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS transport_charge DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS billing_notes TEXT;
