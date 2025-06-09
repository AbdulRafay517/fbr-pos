# Database Migration Guide: Local PostgreSQL → Supabase

This guide will help you transfer your local PostgreSQL database to Supabase for production deployment.

## Option 1: Using Prisma Migrations (Recommended)

This is the cleanest approach - let Prisma recreate your schema on Supabase and optionally migrate data.

### Step 1: Set up Supabase
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project: `fbr-pos-db`
3. Choose region closest to your users
4. Generate and save a strong database password
5. Wait for project to initialize (~2 minutes)

### Step 2: Get Supabase Connection String
1. In Supabase dashboard → **Settings** → **Database**
2. Find "Connection string" section
3. Copy the **URI** format:
   ```
   postgresql://postgres.abcdefghijklmn:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Update Local Environment
Create a temporary environment file for migration:

```bash
# In backend directory
cp .env .env.backup  # Backup current .env if exists
```

Create/update `.env` with Supabase URL:
```bash
DATABASE_URL="postgresql://postgres.abcdefghijklmn:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
JWT_SECRET="your-local-jwt-secret"
```

### Step 4: Run Prisma Migrations
```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
```

This creates all tables with proper structure in Supabase.

### Step 5: Seed Initial Data (if needed)
If you have a seed script or initial admin user:
```bash
npx prisma db seed  # if you have a seed script
```

Or manually create the admin user through your application.

## Option 2: Full Data Migration (if you have important data)

If you have existing data you want to preserve, follow this approach:

### Step 1: Export Local Database
```bash
# Export schema and data
pg_dump -h localhost -p 5432 -U your_username -d your_database_name -f local_backup.sql

# Or export only data (if schema will be created by Prisma)
pg_dump -h localhost -p 5432 -U your_username -d your_database_name --data-only -f local_data.sql
```

### Step 2: Set up Supabase (same as Option 1)
Follow Steps 1-2 from Option 1.

### Step 3: Create Schema with Prisma
```bash
cd backend
# Update .env with Supabase URL
npx prisma migrate deploy
```

### Step 4: Import Data
```bash
# Connect to Supabase and import data
psql "postgresql://postgres.abcdefghijklmn:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f local_data.sql
```

## Option 3: Using Supabase Dashboard (for small datasets)

### Step 1: Export Data as CSV
```bash
# Export each table as CSV
psql -h localhost -p 5432 -U your_username -d your_database_name -c "\copy users TO 'users.csv' CSV HEADER"
psql -h localhost -p 5432 -U your_username -d your_database_name -c "\copy clients TO 'clients.csv' CSV HEADER"
psql -h localhost -p 5432 -U your_username -d your_database_name -c "\copy branches TO 'branches.csv' CSV HEADER"
psql -h localhost -p 5432 -U your_username -d your_database_name -c "\copy invoices TO 'invoices.csv' CSV HEADER"
# ... etc for all tables
```

### Step 2: Set up Schema
Follow Steps 1-3 from Option 1 to create tables.

### Step 3: Import via Supabase Dashboard
1. Go to Supabase Dashboard → **Table Editor**
2. Select each table
3. Click "Insert" → "Import from CSV"
4. Upload your CSV files

## Troubleshooting Common Issues

### Issue: Connection Refused
**Solution**: Check if your connection string is correct and Supabase project is active.

### Issue: Permission Denied
**Solution**: Ensure you're using the correct password and the postgres user.

### Issue: SSL Required
**Solution**: Add `?sslmode=require` to your connection string:
```
postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres?sslmode=require
```

### Issue: Migration Fails
**Solution**: 
1. Check if tables already exist in Supabase
2. Reset Prisma migrations: `npx prisma migrate reset`
3. Try again with `npx prisma migrate deploy`

## Verification Steps

### 1. Check Tables Created
```sql
-- In Supabase SQL Editor
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### 2. Verify Data
```sql
-- Check record counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'branches', COUNT(*) FROM branches
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices;
```

### 3. Test Application Connection
```bash
cd backend
npm run start:dev
# Try logging in through your frontend
```

## Post-Migration Cleanup

### 1. Update Production Environment
In your deployment (Render), set:
```bash
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres
```

### 2. Secure Your Local Environment
```bash
# Restore local .env for development
cp .env.backup .env
```

### 3. Test Production Deployment
Follow the deployment checklist to ensure everything works.

## Security Notes

1. **Never commit** `.env` files with production credentials
2. **Use different passwords** for local vs production
3. **Enable RLS** in Supabase if needed (though your app handles auth)
4. **Backup your data** before migration

## Quick Migration Script

Here's a one-liner for the recommended approach:

```bash
# Replace YOUR_SUPABASE_URL with actual URL
export DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres"
cd backend && npx prisma migrate deploy && npx prisma generate
```

## Need Help?

If you encounter issues:
1. Check Supabase project status
2. Verify connection string format
3. Ensure password is correct
4. Try connecting with a simple psql command first
5. Check Supabase logs in dashboard 