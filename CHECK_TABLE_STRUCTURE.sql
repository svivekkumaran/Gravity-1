-- =====================================================
-- CHECK: Verify bills table structure
-- =====================================================
-- Run this in your Vercel Postgres Query tab to see the current table structure
-- =====================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bills' 
ORDER BY ordinal_position;
