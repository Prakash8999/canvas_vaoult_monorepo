# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## ✅ Pre-Deployment Setup

### Install Vercel CLI
- [ ] Run `npm install -g vercel`
- [ ] Run `vercel login`
- [ ] Verify login with `vercel whoami`

### Prepare Environment Variables

#### Client Environment Variables
Create a list of your client environment variables:
- [ ] `VITE_API_URL` = (will be set after server is deployed)

#### Server Environment Variables
Prepare values for these variables:
- [ ] `DATABASE_URL` = _________________________
- [ ] `JWT_SECRET` = _________________________
- [ ] `CORS_ORIGINS` = (will include client URL after deployment)
- [ ] `AWS_ACCESS_KEY_ID` = _____________________ (if using S3)
- [ ] `AWS_SECRET_ACCESS_KEY` = _________________ (if using S3)
- [ ] `AWS_S3_BUCKET_NAME` = ____________________ (if using S3)
- [ ] `AWS_REGION` = ____________________________ (if using S3)
- [ ] `REDIS_URL` = _____________________________ (if using Redis)
- [ ] `GEMINI_API_KEY` = ________________________ (if using AI)
- [ ] `PERPLEXITY_API_KEY` = ____________________ (if using AI)
- [ ] Other: ____________________________________

---

## 🚀 Deployment Steps

### Phase 1: Deploy Server

- [ ] **Step 1.1**: Navigate to server directory
  ```bash
  cd apps/server
  ```

- [ ] **Step 1.2**: Deploy to Vercel
  ```bash
  vercel --prod
  ```

- [ ] **Step 1.3**: Note the server URL
  ```
  Server URL: https://________________________________.vercel.app
  ```

- [ ] **Step 1.4**: Set server environment variables
  - [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
  - [ ] Select your server project
  - [ ] Go to Settings → Environment Variables
  - [ ] Add all server environment variables listed above
  - [ ] Temporarily set `CORS_ORIGINS` = `http://localhost:8080`
  - [ ] Click "Save"

- [ ] **Step 1.5**: Redeploy server with environment variables
  ```bash
  vercel --prod
  ```

### Phase 2: Deploy Client

- [ ] **Step 2.1**: Navigate to client directory
  ```bash
  cd ../../apps/client
  ```

- [ ] **Step 2.2**: Deploy to Vercel
  ```bash
  vercel --prod
  ```

- [ ] **Step 2.3**: Note the client URL
  ```
  Client URL: https://________________________________.vercel.app
  ```

### Phase 3: Configure Cross-Communication

- [ ] **Step 3.1**: Update server CORS configuration
  - [ ] Go to Vercel Dashboard → Server Project → Settings → Environment Variables
  - [ ] Find `CORS_ORIGINS`
  - [ ] Update value to: `http://localhost:8080,https://YOUR-CLIENT-URL.vercel.app`
  - [ ] Save changes

- [ ] **Step 3.2**: Set client API URL
  - [ ] Go to Vercel Dashboard → Client Project → Settings → Environment Variables
  - [ ] Add new variable:
    - Name: `VITE_API_URL`
    - Value: `https://YOUR-SERVER-URL.vercel.app/api/v1`
  - [ ] Save changes

### Phase 4: Redeploy Both Apps

- [ ] **Step 4.1**: Redeploy server
  ```bash
  cd apps/server
  vercel --prod
  ```

- [ ] **Step 4.2**: Redeploy client
  ```bash
  cd ../client
  vercel --prod
  ```

---

## 🧪 Testing

### Basic Functionality Tests
- [ ] Visit client URL
- [ ] Check browser console for errors
- [ ] Test user authentication (login/signup)
- [ ] Test API calls (check Network tab in browser DevTools)
- [ ] Test file uploads (if applicable)
- [ ] Test all critical features

### Error Checking
- [ ] Check for CORS errors in browser console
- [ ] Check Vercel Function Logs for server errors
  - Go to Server Project → Deployments → [Latest] → Functions
- [ ] Verify database connections are working
- [ ] Verify external API calls work (S3, Redis, etc.)

---

## 🔄 Optional: Set Up Automatic Deployments

### Connect to Git Repository

- [ ] **Step 1**: Push code to GitHub/GitLab/Bitbucket
  ```bash
  git add .
  git commit -m "Add Vercel deployment configuration"
  git push origin main
  ```

- [ ] **Step 2**: Import repository in Vercel (for Client)
  - [ ] Go to [vercel.com/new](https://vercel.com/new)
  - [ ] Click "Import Git Repository"
  - [ ] Select your repository
  - [ ] Configure:
    - Project Name: `canvas-vault-client`
    - Framework Preset: Vite
    - Root Directory: `apps/client`
    - Build Command: `npm run build`
    - Output Directory: `dist`
  - [ ] Add environment variables
  - [ ] Click "Deploy"

- [ ] **Step 3**: Import repository in Vercel (for Server)
  - [ ] Go to [vercel.com/new](https://vercel.com/new)
  - [ ] Click "Import Git Repository"
  - [ ] Select your repository
  - [ ] Configure:
    - Project Name: `canvas-vault-server`
    - Framework Preset: Other
    - Root Directory: `apps/server`
    - Build Command: (leave empty)
    - Output Directory: (leave empty)
  - [ ] Add environment variables
  - [ ] Click "Deploy"

- [ ] **Step 4**: Verify automatic deployments work
  - [ ] Make a small change to your code
  - [ ] Push to GitHub
  - [ ] Check Vercel Dashboard for automatic deployment

---

## 📝 Post-Deployment

### Documentation
- [ ] Document your deployment URLs in team docs
- [ ] Update README with deployment information
- [ ] Share access to Vercel project with team members

### Monitoring
- [ ] Set up error notifications (Vercel Settings → Integrations)
- [ ] Configure uptime monitoring (optional)
- [ ] Set up analytics (Vercel Analytics)

### Custom Domain (Optional)
- [ ] Purchase domain (if needed)
- [ ] Add custom domain in Vercel Dashboard
- [ ] Configure DNS settings
- [ ] Update CORS_ORIGINS with custom domain

---

## 🐛 Troubleshooting

If you encounter issues, check these common problems:

### CORS Errors
- [ ] Verify `CORS_ORIGINS` includes your client URL
- [ ] Check that server was redeployed after updating CORS
- [ ] Ensure no typos in URLs

### Environment Variables Not Working
- [ ] Verify client variables are prefixed with `VITE_`
- [ ] Confirm you redeployed after adding variables
- [ ] Check variable values don't have extra spaces

### Build Failures
- [ ] Review build logs in Vercel Dashboard
- [ ] Ensure all dependencies are in `dependencies` (not just `devDependencies`)
- [ ] Check Node.js version compatibility

### API Not Responding
- [ ] Check Vercel Function Logs
- [ ] Verify database is accessible from Vercel
- [ ] Check for missing environment variables
- [ ] Verify serverless function timeout isn't exceeded

### 404 Errors on Routes
- [ ] Check `vercel.json` configuration
- [ ] Verify SPA rewrites are configured for client
- [ ] Check API routes are properly defined

---

## 📞 Need Help?

- 📖 **[Full Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)**
- 🏗️ **[Architecture Overview](./DEPLOYMENT_ARCHITECTURE.md)**
- 🚀 **[Quick Start Guide](./DEPLOYMENT_QUICKSTART.md)**
- 🌐 **[Vercel Documentation](https://vercel.com/docs)**

---

## ✅ Deployment Complete!

Once all boxes are checked, your application should be live! 🎉

**Your URLs:**
- Client: `https://________________________________.vercel.app`
- Server: `https://________________________________.vercel.app`

Don't forget to:
- Test thoroughly
- Monitor error logs
- Set up custom domain (if desired)
- Share with your team!
