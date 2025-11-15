# 🚀 Deployment Guide

## Overview

This project uses a monorepo structure with separate deployments:
- **Frontend (SvelteKit)**: Deployed to Vercel or Netlify
- **Backend (Express)**: Deployed to Railway

## Prerequisites

- GitHub account with this repository
- Railway account (for backend)
- Vercel or Netlify account (for frontend)

---

## 🔧 Setup CI/CD Pipeline

### 1. Enable Branch Protection

In GitHub:
1. Go to **Settings → Branches**
2. Add branch protection rule for `main`
3. Enable:
   - ✅ Require status checks before merging
   - ✅ Require branches to be up to date
   - ✅ Select `Backend CI` and `Frontend CI` as required checks

### 2. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

#### For Railway (Backend):
- `RAILWAY_DEPLOY_HOOK`: Get from Railway dashboard
  - Railway → Your Project → Settings → Deploy Triggers
  - Create a new deploy trigger
  - Copy the webhook URL

#### For Vercel (Frontend):
- `VERCEL_DEPLOY_HOOK`: Get from Vercel dashboard
  - Vercel → Your Project → Settings → Git → Deploy Hooks
  - Create a new hook for `main` branch
  - Copy the webhook URL

#### For Netlify (Frontend alternative):
- `NETLIFY_BUILD_HOOK`: Get from Netlify dashboard
  - Netlify → Site settings → Build & deploy → Build hooks
  - Add a new build hook
  - Copy the webhook URL

---

## 🚂 Deploy Backend to Railway

### Option A: Automatic Git Deploy (Recommended)

1. **Create Railway Project**
   ```
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository
   ```

2. **Configure Railway**
   ```
   Root Directory: /backend
   Build Command: npm install
   Start Command: npm start
   ```

3. **Set Environment Variables**
   In Railway → Variables, add:
   ```
   PORT=3000
   MONGODB_STRING=your_mongodb_connection_string
   DB_STRING=your_mongodb_connection_string
   CLOUD_NAME=your_cloudinary_cloud_name
   API_KEY=your_cloudinary_api_key
   API_SECRET=your_cloudinary_api_secret
   SESSION_SECRET=your_session_secret
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

4. **Deploy**
   - Railway will auto-deploy on every push to `main`
   - Get your Railway URL: `https://your-app.railway.app`

### Option B: Using GitHub Actions

If you added `RAILWAY_DEPLOY_HOOK` secret:
- Push to `main` → GitHub Actions triggers Railway deploy

---

## ☁️ Deploy Frontend to Vercel

### Setup

1. **Import Project**
   ```
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   ```

2. **Configure Build Settings**
   ```
   Framework Preset: SvelteKit
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **Set Environment Variables**
   In Vercel → Settings → Environment Variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

4. **Deploy**
   - Vercel auto-deploys on every push to `main`
   - Get your Vercel URL: `https://your-app.vercel.app`

---

## 🌐 Deploy Frontend to Netlify (Alternative)

### Setup

1. **Import Project**
   ```
   - Go to https://netlify.com
   - Click "Add new site" → "Import from Git"
   - Choose your GitHub repository
   ```

2. **Configure Build Settings**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/build
   ```

3. **Set Environment Variables**
   In Netlify → Site settings → Environment variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

4. **Deploy**
   - Netlify auto-deploys on every push to `main`
   - Get your Netlify URL: `https://your-app.netlify.app`

---

## 🔄 CI/CD Workflow

### How It Works

```
1. Developer pushes to feature branch
   ↓
2. Open Pull Request
   ↓
3. GitHub Actions runs CI
   - Backend: lint, test
   - Frontend: type-check, lint, test, build
   ↓
4. If CI passes → Merge to main
   ↓
5. GitHub Actions triggers deployments
   - Railway deploys backend
   - Vercel/Netlify deploys frontend
```

### Manual Deployment

You can manually trigger deployment:
```
GitHub → Actions → Deploy → Run workflow
```

---

## 🧪 Testing Deployment

### Test Backend
```bash
curl https://your-backend.railway.app/api/feed
```

Should return JSON with jams.

### Test Frontend
```
Open https://your-frontend.vercel.app
Should see the jam feed page
```

### Test Full Integration
1. Visit frontend URL
2. Feed page should load jams from backend
3. Check browser console for errors
4. Verify CORS is working (no CORS errors)

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Fails**
- Check `MONGODB_STRING` is set correctly in Railway
- Ensure MongoDB Atlas allows Railway IPs (or allow all: 0.0.0.0/0)

**CORS Errors**
- Verify `FRONTEND_URL` in Railway matches your Vercel URL
- Update backend `.env` if URLs change

### Frontend Issues

**API Calls Fail**
- Check `VITE_API_URL` is set in Vercel/Netlify
- Verify Railway backend is running
- Check browser console for errors

**Build Fails**
- Check build logs in Vercel/Netlify
- Ensure all dependencies are in `package.json`
- Try building locally first: `cd frontend && npm run build`

---

## 📊 Monitoring

### Railway
- View logs: Railway → Project → Deployments → Logs
- Monitor metrics: Railway → Project → Metrics

### Vercel
- View deployments: Vercel → Project → Deployments
- Check analytics: Vercel → Project → Analytics

### Netlify
- View deploys: Netlify → Site → Deploys
- Check functions: Netlify → Site → Functions

---

## 🔐 Environment Variables Summary

### Backend (Railway)
```
PORT=3000
MONGODB_STRING=mongodb+srv://...
DB_STRING=mongodb+srv://...
CLOUD_NAME=...
API_KEY=...
API_SECRET=...
SESSION_SECRET=...
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel/Netlify)
```
VITE_API_URL=https://your-backend.railway.app
```

### GitHub Secrets
```
RAILWAY_DEPLOY_HOOK=https://railway.app/...
VERCEL_DEPLOY_HOOK=https://vercel.com/...
NETLIFY_BUILD_HOOK=https://netlify.com/...
```

---

## 🎉 Success!

Once everything is deployed:
- ✅ CI runs on every PR
- ✅ Auto-deploy on merge to `main`
- ✅ Backend on Railway
- ✅ Frontend on Vercel/Netlify
- ✅ Full CI/CD pipeline active

**Your app is now production-ready!** 🚀
