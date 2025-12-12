-- =====================================================
-- MIGRATION: Add billed_by column to bills table
-- =====================================================
-- Run this in your Vercel Postgres Query tab
-- 
-- Instructions:
-- 1. Go to Vercel Dashboard
-- 2. Select your project
-- 3. Go to Storage → Postgres
-- 4. Click on "Query" tab
-- 5. Copy and paste the SQL below
-- 6. Click "Run Query"
-- =====================================================

-- Add the billed_by column to the bills table
ALTER TABLE bills ADD COLUMN IF NOT EXISTS billed_by TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bills' 
ORDER BY ordinal_position;
