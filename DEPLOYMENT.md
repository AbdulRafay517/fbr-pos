# Deployment Guide

This guide will help you deploy the FBR POS system across three platforms:
- **Database**: Supabase (PostgreSQL)
- **Backend**: Render (NestJS)
- **Frontend**: Vercel (React)

## 1. Database Setup (Supabase)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Set project details:
   - **Name**: `fbr-pos-db`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

### Step 2: Get Database URL
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Find the "Connection string" section
3. Copy the **URI** format connection string
4. It will look like: `postgresql://postgres.abcdefghijklmn:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
5. Replace `[PASSWORD]` with your actual database password

### Step 3: Enable Row Level Security (Optional)
Since we're using Prisma for authentication, you can:
1. Go to **Authentication** → **Settings**
2. Turn off "Enable row level security" if you prefer to handle auth through your backend

## 2. Backend Deployment (Render)

### Step 1: Prepare Repository
1. Ensure your code is pushed to GitHub/GitLab
2. Make sure `backend/package.json` has the `postinstall` script (already added)

### Step 2: Create Render Web Service
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your repository
4. Configure the service:
   - **Name**: `fbr-pos-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma migrate deploy`
   - **Start Command**: `npm run start:prod`

### Step 3: Set Environment Variables
In Render's environment variables section, add:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-supabase-connection-string>
JWT_SECRET=<generate-a-strong-secret-key>
JWT_EXPIRATION=24h
FRONTEND_URL=<your-vercel-url-will-be-added-later>
```

**Important**: 
- For `JWT_SECRET`, generate a strong random string (at least 32 characters)
- You can use: `openssl rand -base64 32` or an online generator
- `JWT_EXPIRATION` sets how long tokens are valid (24h = 24 hours)
- Leave `FRONTEND_URL` as `*` for now, update it after frontend deployment

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically deploy your backend
3. Your backend URL will be: `https://fbr-pos-backend.onrender.com`

## 3. Frontend Deployment (Vercel)

### Step 1: Create Vercel Project
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)

### Step 2: Set Environment Variables
In Vercel's project settings, add environment variables:

```
VITE_API_URL=https://fbr-pos-backend.onrender.com/api
```

### Step 3: Deploy
1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Your frontend URL will be: `https://your-project-name.vercel.app`

## 4. Final Configuration

### Update CORS Settings
1. Go back to Render
2. Update the `FRONTEND_URL` environment variable with your Vercel URL:
   ```
   FRONTEND_URL=https://your-project-name.vercel.app
   ```
3. Redeploy the backend service

### Test Your Application
1. Visit your Vercel URL
2. Try logging in with the default admin credentials
3. Test creating invoices, clients, etc.

## 5. Environment Variables Summary

### Backend (Render)
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres
JWT_SECRET=your-32-character-random-string
JWT_EXPIRATION=24h
FRONTEND_URL=https://your-project.vercel.app
```

### Frontend (Vercel)
```bash
VITE_API_URL=https://fbr-pos-backend.onrender.com/api
```

## 6. Free Tier Limitations

### Supabase Free Tier
- 500MB database size
- 2GB bandwidth per month
- 50,000 monthly active users

### Render Free Tier
- Service sleeps after 15 minutes of inactivity
- 750 hours/month (basically unlimited for one app)
- Services spin down, causing cold starts

### Vercel Free Tier
- 100GB bandwidth per month
- Unlimited personal projects
- Custom domains included

## 7. Post-Deployment Checklist

- [ ] Database deployed on Supabase
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Application tested end-to-end
- [ ] Default admin user can login
- [ ] Invoice creation works
- [ ] PDF generation works

## 8. Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify DATABASE_URL is correct
- Ensure Prisma migrations ran successfully
- Check if JWT_SECRET is set

### Frontend Issues
- Verify VITE_API_URL points to correct backend
- Check browser console for CORS errors
- Ensure Vercel build completed successfully

### Database Issues
- Verify Supabase connection string
- Check if database is accessible from Render
- Ensure password is correct in connection string

## 9. Monitoring and Maintenance

### Render
- Monitor service health in dashboard
- Check logs regularly
- Set up notifications for downtime

### Vercel
- Monitor deployment status
- Check function logs if needed
- Set up analytics if desired

### Supabase
- Monitor database usage
- Check query performance
- Review security settings

## Support

If you encounter issues:
1. Check the logs in each platform's dashboard
2. Verify all environment variables are set correctly
3. Test API endpoints directly using tools like Postman
4. Check CORS configuration if seeing network errors 