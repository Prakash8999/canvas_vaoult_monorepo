# Vercel Deployment - Quick Start

## 📋 What Was Created

I've set up your monorepo for **separate Vercel deployments**:

### Configuration Files
- ✅ `apps/client/vercel.json` - Client deployment config
- ✅ `apps/server/vercel.json` - Server deployment config
- ✅ `apps/client/.env.example` - Client environment variables template
- ✅ `apps/server/.env.example` - Server environment variables template
- ✅ `scripts/deploy-client.sh` - Quick client deployment script
- ✅ `scripts/deploy-server.sh` - Quick server deployment script
- ✅ `VERCEL_DEPLOYMENT_GUIDE.md` - Complete deployment guide

## 🎯 The Strategy

Your monorepo will be deployed as **TWO separate Vercel projects**:

1. **Client Project** (`apps/client`) → React + Vite frontend
2. **Server Project** (`apps/server`) → Express.js API backend

## 🚀 Quick Deployment Steps

### Prerequisites
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

### Deploy Client (Frontend)
```bash
# Navigate to client directory
cd apps/client

# Deploy
vercel --prod

# Note the URL: https://your-client.vercel.app
```

### Deploy Server (Backend)
```bash
# Navigate to server directory
cd apps/server

# Deploy
vercel --prod

# Note the URL: https://your-server.vercel.app
```

## 🔧 Critical Configuration Steps

### 1. Update Server CORS
After deploying the client, update your server's CORS configuration to allow the client URL:

```typescript
// In your server CORS config
const corsOptions = {
  origin: [
    'http://localhost:8080',  // Local
    'https://your-client.vercel.app',  // Production client
  ],
  credentials: true,
};
```

### 2. Set Client Environment Variable
After deploying the server, set the API URL in your client:

```bash
cd apps/client
vercel env add VITE_API_URL production
# Enter: https://your-server.vercel.app/api/v1
```

Then redeploy:
```bash
vercel --prod
```

### 3. Set Server Environment Variables
Set all required environment variables in Vercel:

```bash
cd apps/server
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
# ... add all other required variables
```

Or use the Vercel Dashboard:
- Go to your project → Settings → Environment Variables
- Add each variable one by one

## 📝 Environment Variables Checklist

### Client Variables
- [ ] `VITE_API_URL` → Your server URL (e.g., https://your-server.vercel.app/api/v1)

### Server Variables  
- [ ] `DATABASE_URL` → Database connection string
- [ ] `JWT_SECRET` → JWT secret key
- [ ] `CORS_ORIGINS` → Allowed origins (include your client URL)
- [ ] `AWS_ACCESS_KEY_ID` → (if using S3)
- [ ] `AWS_SECRET_ACCESS_KEY` → (if using S3)
- [ ] `AWS_S3_BUCKET_NAME` → (if using S3)
- [ ] `AWS_REGION` → (if using S3)
- [ ] Any other API keys or secrets

## 🔄 Automatic Deployments (Recommended)

### Option 1: Using Vercel Dashboard

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import Repository in Vercel** (do this twice, once for each app):
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   
3. **Configure Client Project**:
   - Project Name: `canvas-vault-client` (or your choice)
   - Framework Preset: Vite
   - Root Directory: `apps/client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Configure Server Project**:
   - Project Name: `canvas-vault-server` (or your choice)
   - Framework Preset: Other
   - Root Directory: `apps/server`
   - Build Command: Leave empty (serverless functions don't need build)
   - Output Directory: Leave empty

5. **Add Environment Variables** in each project's settings

6. **Deploy!** Vercel will auto-deploy on every push to your main branch

### Option 2: Using Vercel CLI with Git

```bash
# Link projects to Git repos
cd apps/client
vercel --prod

cd ../server
vercel --prod
```

## 🧪 Testing Your Deployment

After deploying both:

1. Visit your client URL: `https://your-client.vercel.app`
2. Check that API calls work (check browser console for errors)
3. Test authentication flows
4. Test file uploads (if applicable)
5. Check server logs in Vercel Dashboard

## 🐛 Common Issues & Solutions

### CORS Errors
**Problem**: "Access-Control-Allow-Origin" errors in browser console

**Solution**:
1. Update server CORS config with client URL
2. Ensure `credentials: true` is set
3. Redeploy server

### Environment Variables Not Loading
**Problem**: App can't connect to database or API

**Solution**:
1. Check env vars are set in Vercel Dashboard
2. For client: Ensure vars are prefixed with `VITE_`
3. Redeploy after adding env vars

### Build Failures
**Problem**: Deployment fails during build

**Solution**:
1. Check build logs in Vercel Dashboard
2. Ensure all dependencies are in `dependencies` (not `devDependencies`)
3. Check Node.js version compatibility

### API Routes Not Working
**Problem**: 404 errors on API endpoints

**Solution**:
1. Check `vercel.json` routes configuration
2. Ensure server exports the Express app correctly
3. Check serverless function logs in Vercel

## 📚 Additional Resources

- 📖 **Full Guide**: `VERCEL_DEPLOYMENT_GUIDE.md`
- 🌐 **Vercel Docs**: https://vercel.com/docs
- 🔧 **Nx Docs**: https://nx.dev/recipes/deployment

## 💡 Pro Tips

1. **Commit before deploying** - Always commit your changes before deploying
2. **Test locally first** - Run `npm run build` locally to catch build errors
3. **Use Preview Deployments** - Every git branch gets a preview URL
4. **Monitor logs** - Check Vercel Dashboard → Functions → Logs for debugging
5. **Set up alerts** - Configure error notifications in Vercel Dashboard
6. **Use environment-specific configs** - Different env vars for preview vs production

## 🎉 Next Steps

1. Deploy client → Get URL
2. Deploy server → Get URL  
3. Update CORS on server
4. Update client env with server URL
5. Redeploy both
6. Test thoroughly
7. (Optional) Connect to Git for auto-deployments

---

**Need help?** Check `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions!
