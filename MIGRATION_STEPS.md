# Database Migration Required

## ⚠️ IMPORTANT: Manual Migration Needed

The code has been updated to support the `billed_by` field, but you need to **manually add the column** to your Vercel Postgres database.

## Steps to Run Migration

### Option 1: Via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project: `Gravity-1`

2. **Open Postgres Query Tab**
   - Click on **Storage** tab
   - Click on your **Postgres** database
   - Click on **Query** tab

3. **Run this SQL command:**
   ```sql
   ALTER TABLE bills ADD COLUMN IF NOT EXISTS billed_by TEXT;
   ```

4. **Verify the column was added:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'bills' 
   ORDER BY ordinal_position;
   ```
   
   You should see `billed_by` with type `text` in the results.

### Option 2: Via Vercel CLI

1. **Pull environment variables:**
   ```bash
   vercel env pull .env.local
   ```

2. **Run the migration script:**
   ```bash
   node migrate.js
   ```

## After Migration

Once the column is added:
1. The deployment will automatically use the new code
2. New bills will show the logged-in username in "Billed By" field
3. Old bills will continue to show "N/A" (backward compatible)

## Verification

After running the migration, create a new bill and check the PDF - it should show your username instead of "N/A".
