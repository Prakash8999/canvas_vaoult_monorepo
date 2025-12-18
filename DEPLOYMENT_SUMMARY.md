# Vercel Deployment Setup - Summary of Changes

## 📋 What Was Done

I've prepared your monorepo for **separate Vercel deployments** of the client and server applications.

---

## ✅ Files Created

### Configuration Files
1. **`apps/client/vercel.json`** - Client deployment configuration
2. **`apps/server/vercel.json`** - Server deployment configuration (serverless)
3. **`apps/client/.env.example`** - Client environment variables template
4. **`apps/server/.env.example`** - Server environment variables template

### Documentation
5. **`VERCEL_DEPLOYMENT_GUIDE.md`** - Comprehensive step-by-step deployment guide
6. **`DEPLOYMENT_QUICKSTART.md`** - Quick reference guide
7. **`DEPLOYMENT_SUMMARY.md`** - This file

### Deployment Scripts
8. **`scripts/deploy-client.sh`** - Quick client deployment script
9. **`scripts/deploy-server.sh`** - Quick server deployment script

### Server Refactoring (for Vercel compatibility)
10. **`apps/server/src/app.ts`** - Express app configuration (NEW)
11. **`apps/server/src/index.ts`** - Vercel serverless entry point (NEW)
12. **`apps/server/src/server.ts`** - Refactored to use app.ts (MODIFIED)

---

## 🔧 Key Changes Explained

### Server Architecture Refactoring

**Why?** Vercel requires serverless functions to export the Express app, while local development needs to start a server.

**What changed:**
- **`app.ts`**: Contains all Express app configuration (routes, middleware, etc.)
- **`index.ts`**: Exports the app for Vercel serverless functions
- **`server.ts`**: Imports the app and starts the server for local development

**Result:** The same codebase works both locally and on Vercel!

### CORS Configuration Update

**Before:**
```typescript
app.use(cors({ origin: ['http://localhost:8080'], ... }));
```

**After:**
```typescript
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:8080'];

app.use(cors({ origin: allowedOrigins, ... }));
```

**Why?** You can now configure CORS origins via environment variables, making it easy to add your production client URL.

---

## 🚀 Deployment Strategy

### Two Separate Vercel Projects

Your monorepo will be deployed as:

#### 1. **Client Project** (Frontend)
- **Framework**: Vite + React
- **Build**: `npm run build`
- **Output**: `dist/`
- **Root Directory**: `apps/client`
- **URL Example**: `https://canvas-vault-client.vercel.app`

#### 2. **Server Project** (Backend API)
- **Framework**: Express.js (serverless)
- **Entry Point**: `src/index.ts`
- **Root Directory**: `apps/server`
- **URL Example**: `https://canvas-vault-server.vercel.app`

---

## 🎯 Next Steps (In Order)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### Step 2: Deploy Server First
```bash
cd apps/server
vercel --prod
```
**Note:** Copy the server URL (e.g., `https://canvas-vault-server.vercel.app`)

### Step 3: Set Server Environment Variables
In Vercel Dashboard → Server Project → Settings → Environment Variables:
- Add `CORS_ORIGINS` = `http://localhost:8080,https://your-client-url.vercel.app`
- Add `DATABASE_URL`, `JWT_SECRET`, and all other required variables

### Step 4: Deploy Client
```bash
cd apps/client
vercel --prod
```
**Note:** Copy the client URL

### Step 5: Update Server CORS
Update the `CORS_ORIGINS` environment variable in your server project to include the client URL:
```
http://localhost:8080,https://your-actual-client-url.vercel.app
```

### Step 6: Set Client Environment Variable
In Vercel Dashboard → Client Project → Settings → Environment Variables:
- Add `VITE_API_URL` = `https://your-server-url.vercel.app/api/v1`

### Step 7: Redeploy Both
```bash
# Client
cd apps/client
vercel --prod

# Server
cd apps/server
vercel --prod
```

### Step 8: Test!
Visit your client URL and test all functionality.

---

## 📝 Environment Variables Checklist

### Client Variables (Prefix with `VITE_`)
✅ `VITE_API_URL` → Your server URL + `/api/v1`
   - Example: `https://canvas-vault-server.vercel.app/api/v1`

### Server Variables
✅ `CORS_ORIGINS` → Comma-separated allowed origins
   - Example: `http://localhost:8080,https://canvas-vault-client.vercel.app`
✅ `DATABASE_URL` → Database connection string
✅ `JWT_SECRET` → Secret for JWT tokens
✅ `AWS_ACCESS_KEY_ID` → (if using S3)
✅ `AWS_SECRET_ACCESS_KEY` → (if using S3)
✅ `AWS_S3_BUCKET_NAME` → (if using S3)
✅ `AWS_REGION` → AWS region
✅ `REDIS_URL` → Redis connection URL (if using Redis)
✅ Any AI API keys (GEMINI_API_KEY, PERPLEXITY_API_KEY, etc.)

---

## 🔄 Automatic Deployments (Recommended)

### Setup Git Integration

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import repository in Vercel** (twice, once for each app):
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   
3. **Configure Client Project**:
   - Root Directory: `apps/client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Configure Server Project**:
   - Root Directory: `apps/server`
   - Build Command: (leave empty)

5. **Add environment variables** in each project

6. **Done!** Every push to main branch auto-deploys

---

## ⚠️ Important Notes

### Serverless Limitations
- **Timeout**: 10 seconds (free), 50 seconds (Pro)
- **File System**: Read-only except `/tmp`
- **Cold Starts**: First requests may be slower

### Database Considerations
- Ensure your database is accessible from Vercel's IP ranges
- Consider using managed databases (Vercel Postgres, PlanetScale, etc.)
- Connection pooling is important for serverless

### Redis/BullMQ Considerations
- Vercel serverless functions are stateless
- Background workers (BullMQ) may not work as expected
- Consider using Vercel Cron Jobs or external worker services

---

## 🐛 Troubleshooting

### Issue: CORS Errors
**Solution:** Update `CORS_ORIGINS` env var with your client URL and redeploy

### Issue: "Module not found" errors
**Solution:** Ensure dependencies are in `dependencies`, not `devDependencies`

### Issue: Environment variables not loading
**Solution:** 
- Client: Ensure vars are prefixed with `VITE_`
- Redeploy after adding env vars

### Issue: 404 on API routes
**Solution:** Check `vercel.json` routes configuration

---

## 📚 Documentation References

- 📖 **Full Deployment Guide**: `VERCEL_DEPLOYMENT_GUIDE.md`
- 🚀 **Quick Start Guide**: `DEPLOYMENT_QUICKSTART.md`
- 🌐 **Vercel Docs**: https://vercel.com/docs
- 🔧 **Nx Monorepo Deployment**: https://nx.dev/recipes/deployment

---

## 🎉 You're Ready!

All the configuration is done. Just follow the **Next Steps** section above to deploy your applications!

**Questions?** Check the detailed guides mentioned above.

**Good luck with your deployment! 🚀**
