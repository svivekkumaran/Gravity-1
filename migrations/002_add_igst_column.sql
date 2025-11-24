-- =====================================================
-- MIGRATION: Add igst column to bills table
-- =====================================================
-- Run this in your Vercel Postgres Query tab IMMEDIATELY
-- This fixes the 500 error when generating bills
-- =====================================================

-- Add the igst column to the bills table
ALTER TABLE bills ADD COLUMN IF NOT EXISTS igst DECIMAL(10, 2) DEFAULT 0;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'bills' 
ORDER BY ordinal_position;
