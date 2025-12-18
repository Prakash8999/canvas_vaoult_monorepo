# Deploying Monorepo to Vercel - Complete Guide

This guide explains how to deploy the **client** and **server** apps from this monorepo to Vercel as separate deployments.

## Overview

- **Client**: React + Vite frontend app
- **Server**: Express.js backend API
- **Strategy**: Deploy as two separate Vercel projects

---

## Prerequisites

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

---

## Part 1: Deploy the Client (Frontend)

### Step 1: Navigate to Client Directory
```bash
cd apps/client
```

### Step 2: Deploy to Vercel
```bash
vercel
```

### Step 3: Follow the Prompts
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (for first deployment)
- **Project name?** → `canvas-vault-client` (or your preferred name)
- **In which directory is your code located?** → `./` (current directory)
- **Want to modify settings?** → No (the `vercel.json` will handle this)

### Step 4: Note the Deployment URL
Vercel will provide a URL like: `https://canvas-vault-client.vercel.app`

**Save this URL** - you'll need it later for CORS configuration.

### Step 5: Set Environment Variables (if needed)
If your client needs environment variables (like API base URL):

```bash
# Set production environment variable
vercel env add VITE_API_BASE_URL production

# When prompted, enter your server URL (you'll get this in Part 2)
# Example: https://canvas-vault-server.vercel.app
```

Or set in Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `VITE_API_BASE_URL` with value: `https://your-server-url.vercel.app`

---

## Part 2: Deploy the Server (Backend)

### Step 1: Navigate to Server Directory
```bash
cd ../server  # If you're in apps/client
# OR
cd apps/server  # If you're at the root
```

### Step 2: Build the Server First
```bash
# From the monorepo root:
cd ../../
npx nx build server
```

### Step 3: Deploy to Vercel
```bash
cd apps/server
vercel
```

### Step 4: Follow the Prompts
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No
- **Project name?** → `canvas-vault-server` (or your preferred name)
- **In which directory is your code located?** → `./`
- **Want to modify settings?** → No

### Step 5: Note the Server URL
Vercel will provide a URL like: `https://canvas-vault-server.vercel.app`

**Important**: Copy this URL!

### Step 6: Configure CORS on Server

You need to update your server's CORS configuration to allow requests from your client URL.

Find your CORS configuration file (usually in `src/server.ts` or `src/config/cors.ts`) and add your client URL to the allowed origins:

```typescript
// Example CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',  // Local development
    'https://canvas-vault-client.vercel.app',  // Your production client URL
  ],
  credentials: true,
};

app.use(cors(corsOptions));
```

### Step 7: Set Environment Variables

Set all required environment variables for your server:

```bash
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
# ... add all other required env vars
```

Or use the Vercel Dashboard:
1. Go to project → Settings → Environment Variables
2. Add each variable with its value
3. Select the environment (Production/Preview/Development)

---

## Part 3: Update Client with Server URL

### Step 1: Update Client Environment Variable

Go back to your **client** project on Vercel and update the API URL:

```bash
cd ../client
vercel env add VITE_API_BASE_URL production
# Enter: https://canvas-vault-server.vercel.app
```

### Step 2: Redeploy Client

After adding the environment variable, redeploy:

```bash
vercel --prod
```

---

## Part 4: Production Deployment

For production deployments:

### Client
```bash
cd apps/client
vercel --prod
```

### Server
```bash
cd apps/server
vercel --prod
```

---

## Automatic Deployments (Optional but Recommended)

### Connect to Git

1. Push your code to GitHub/GitLab/Bitbucket
2. In Vercel Dashboard:
   - Import the repository
   - Create **two separate projects**:
     - **Project 1**: Root Directory → `apps/client`
     - **Project 2**: Root Directory → `apps/server`

3. Vercel will automatically deploy on every push to your main branch

### Configure Root Directory in Vercel Dashboard

For each project:
1. Go to Settings → General
2. Set **Root Directory**:
   - Client: `apps/client`
   - Server: `apps/server`
3. Set **Build Command**:
   - Client: `npm run build`
   - Server: `npx nx build server` (if needed)

---

## Important Notes

### Server Deployment Considerations

1. **Database Connections**: Ensure your database is accessible from Vercel's IP ranges
2. **Serverless Functions**: Vercel has a 10-second timeout for serverless functions (50s for Pro)
3. **Cold Starts**: First request might be slow due to cold starts
4. **File System**: Serverless functions have read-only file system (except `/tmp`)

### Client Deployment Considerations

1. **Environment Variables**: Must be prefixed with `VITE_` to be accessible in the client
2. **API Calls**: Always use the production server URL in production
3. **SPA Routing**: The `vercel.json` rewrites handle client-side routing

---

## Troubleshooting

### CORS Errors
- Ensure server CORS configuration includes client URL
- Check that credentials are properly configured
- Verify environment variables are set correctly

### Build Failures
- Check Node.js version compatibility
- Ensure all dependencies are in `dependencies` (not just `devDependencies`)
- Review build logs in Vercel Dashboard

### TypeScript Config Resolution Error
If you see an error like:
```
failed to resolve "extends":"../../tsconfig.base.json" in /vercel/path0/tsconfig.json
```

**Solution**: The client's `tsconfig.json` should be self-contained without extending parent configs. When Vercel builds with `apps/client` as the root directory, it can't access files outside that directory.

**Fix Applied**: The client's `tsconfig.json` has been updated to include all necessary compiler options directly instead of extending `../../tsconfig.base.json`.

### Environment Variables Not Working
- Client vars must be prefixed with `VITE_`
- After adding env vars, redeploy the project
- Check the environment (Production/Preview/Development)

### API Not Responding
- Check server logs in Vercel Dashboard
- Verify database connection strings
- Check for missing environment variables

---

## Environment Variables Checklist

### Client (`apps/client`)
- [ ] `VITE_API_BASE_URL` → Your server URL

### Server (`apps/server`)
- [ ] `DATABASE_URL` → Your database connection string
- [ ] `JWT_SECRET` → Secret for JWT tokens
- [ ] `AWS_ACCESS_KEY_ID` → AWS credentials (if using S3)
- [ ] `AWS_SECRET_ACCESS_KEY` → AWS credentials
- [ ] `AWS_S3_BUCKET_NAME` → S3 bucket name
- [ ] `AWS_REGION` → AWS region
- [ ] Any other API keys or secrets

---

## Quick Reference

### Deploy Client
```bash
cd apps/client
vercel --prod
```

### Deploy Server
```bash
cd apps/server
vercel --prod
```

### Check Deployment Status
```bash
vercel ls
```

### View Deployment Logs
```bash
vercel logs [deployment-url]
```

---

## Next Steps

1. ✅ Create `vercel.json` files (Already done!)
2. 🎯 Deploy client → Get client URL
3. 🎯 Deploy server → Get server URL
4. 🎯 Update CORS on server with client URL
5. 🎯 Update client env with server URL
6. 🎯 Redeploy both
7. 🎯 Test the production deployment
8. 🎯 (Optional) Connect to Git for automatic deployments

---

## Support

If you encounter issues:
1. Check Vercel's deployment logs
2. Review this guide's troubleshooting section
3. Consult [Vercel Documentation](https://vercel.com/docs)
