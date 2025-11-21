# Vercel Deployment Guide

## Prerequisites

1. GitHub account with your code pushed
2. Vercel account (free tier works fine)
3. Your repository: https://github.com/svivekkumaran/Gravity-1

## Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `svivekkumaran/Gravity-1`
4. Click "Import"

## Step 2: Add Vercel Postgres Database

1. In your project dashboard, go to the "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Choose a database name (e.g., `retail-shop-db`)
5. Select a region close to your users
6. Click "Create"

**Important**: Vercel will automatically add the required environment variables to your project.

## Step 3: Initialize Database Schema

After your first deployment, you need to initialize the database:

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run the schema initialization
vercel env pull .env.local
node -e "require('./lib/db').initializeDatabase()"
```

### Option B: Manual SQL Execution

1. Go to your Vercel project → Storage → Your Postgres database
2. Click "Query" tab
3. Copy and paste the contents of `schema.sql`
4. Click "Run Query"

## Step 4: Deploy

Your application will auto-deploy when you push to GitHub!

```bash
git add .
git commit -m "Migrated to Vercel Postgres"
git push origin main
```

## Step 5: Verify Deployment

1. Wait for deployment to complete (usually 1-2 minutes)
2. Click on the deployment URL (e.g., `https://gravity-1.vercel.app`)
3. Test login with default credentials:
   - **Admin**: `admin` / `admin123`
   - **Billing**: `billing` / `billing123`

## Local Development

To run locally with Vercel Postgres:

```bash
# Install dependencies
npm install

# Pull environment variables from Vercel
vercel env pull .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Migrating Existing Data

If you have existing data in SQLite:

1. Export data from the old system (Settings → Export Backup)
2. Save the JSON file
3. In the new Vercel deployment, go to Settings → Import Backup
4. Upload the JSON file

## Troubleshooting

### Database Connection Errors

- Verify environment variables are set in Vercel project settings
- Check that the database is in the same region as your deployment
- Ensure the schema has been initialized

### API Errors

- Check Vercel function logs in the dashboard
- Verify all API endpoints are deployed
- Check browser console for CORS errors

### Build Failures

- Ensure `package.json` has correct dependencies
- Check that all required files are committed to Git
- Review build logs in Vercel dashboard

## Environment Variables

The following environment variables are automatically set by Vercel when you add a Postgres database:

- `POSTGRES_URL` - Main connection string
- `POSTGRES_PRISMA_URL` - Connection pooling URL
- `POSTGRES_URL_NON_POOLING` - Direct connection URL
- `POSTGRES_USER` - Database username
- `POSTGRES_HOST` - Database host
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name

## Useful Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs

# Open project in browser
vercel open

# Remove project
vercel remove
```

## Support

For issues specific to:
- **Vercel**: https://vercel.com/docs
- **Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **This Application**: Check the main README.md
