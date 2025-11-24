-- Migration: Add billed_by column to bills table
-- Run this migration to add the billed_by column to existing bills table

-- Add billed_by column if it doesn't exist
ALTER TABLE bills ADD COLUMN IF NOT EXISTS billed_by TEXT;

-- Optionally, you can set a default value for existing records
-- UPDATE bills SET billed_by = 'Unknown' WHERE billed_by IS NULL;
