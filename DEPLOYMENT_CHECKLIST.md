# Quick Deployment Checklist

## Pre-Deployment
- [ ] Code is committed and pushed to GitHub/GitLab
- [ ] All environment variables are documented
- [ ] Database schema is finalized

## 1. Database (Supabase) - 5 minutes
- [ ] Create Supabase account
- [ ] Create new project: `fbr-pos-db`
- [ ] Copy connection string
- [ ] Save database password securely

## 2. Backend (Render) - 10 minutes
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Create Web Service:
  - Root Directory: `backend`
  - Build Command: `npm install && npm run build && npx prisma migrate deploy`
  - Start Command: `npm run start:prod`
- [ ] Set environment variables:
  - `NODE_ENV=production`
  - `PORT=3000`  
  - `DATABASE_URL=<supabase-url>`
  - `JWT_SECRET=<random-32-char-string>`
  - `FRONTEND_URL=*` (update later)
- [ ] Deploy and verify backend is running
- [ ] Test health endpoint: `https://your-backend.onrender.com/api/health`

## 3. Frontend (Vercel) - 5 minutes
- [ ] Create Vercel account
- [ ] Import repository
- [ ] Set Root Directory: `frontend`
- [ ] Set environment variable:
  - `VITE_API_URL=https://your-backend.onrender.com/api`
- [ ] Deploy and verify frontend loads
- [ ] Copy Vercel URL

## 4. Final Configuration - 2 minutes
- [ ] Update backend `FRONTEND_URL` with Vercel URL
- [ ] Redeploy backend on Render
- [ ] Test complete application flow

## 5. Testing - 5 minutes
- [ ] Login with default admin credentials
- [ ] Create a test client
- [ ] Create a test invoice
- [ ] Generate PDF
- [ ] Test tax calculations

## URLs to Save
```
Frontend: https://your-project.vercel.app
Backend:  https://your-backend.onrender.com
Database: https://app.supabase.com/project/your-project-id
```

## Default Admin Login
```
Email: admin@fbr-pos.com
Password: admin123
```

**Total Time: ~30 minutes** 