# 🚀 AI System - Quick Start Guide

## Prerequisites

- Node.js installed
- Database running (PostgreSQL/MySQL)
- API keys for Gemini and/or Perplexity

## Step 1: Install Dependencies

```bash
# From monorepo root
npm install @google/genai @perplexity-ai/perplexity_ai
```

## Step 2: Set Up Environment Variables

Create or update `.env` file in `apps/server/`:

```env
# Database
DATABASE_URL=your_database_url

# JWT
JWT_SECRET=your_jwt_secret

# AI Provider API Keys
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

### Getting API Keys

**Gemini:**
1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Copy and paste into `.env`

**Perplexity:**
1. Go to https://www.perplexity.ai/settings/api
2. Generate API key
3. Copy and paste into `.env`

## Step 3: Run Database Migration

```bash
# Option 1: Using psql (PostgreSQL)
psql -d your_database_name -f apps/server/migrations/20251215_add_ai_credits.sql

# Option 2: Using mysql (MySQL)
mysql -u your_user -p your_database_name < apps/server/migrations/20251215_add_ai_credits.sql

# Option 3: Manual execution
# Copy the SQL from the migration file and run it in your database client
```

**Migration SQL:**
```sql
ALTER TABLE users ADD COLUMN ai_credits INTEGER NOT NULL DEFAULT 10;
UPDATE users SET ai_credits = 10 WHERE ai_credits IS NULL;
CREATE INDEX idx_users_ai_credits ON users(ai_credits);
```

## Step 4: Start the Backend

```bash
# From monorepo root
cd apps/server
npm run dev
```

Server should start at `http://localhost:3000`

## Step 5: Start the Frontend

```bash
# From monorepo root (in a new terminal)
cd apps/client
npm run dev
```

Client should start at `http://localhost:8080`

## Step 6: Test the System

### Test 1: Check Constraints (No Auth Required)

```bash
curl http://localhost:3000/api/v1/ai/constraints
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "maxInputLength": 300,
    "maxTokenEstimate": 200,
    "creditCostPerRequest": 1,
    "supportedProviders": ["gemini", "perplexity"],
    "supportedModels": {
      "gemini": ["gemini-2.0-flash-exp", "gemini-exp-1206"],
      "perplexity": ["sonar", "sonar-pro"]
    }
  }
}
```

### Test 2: Check Credits (Auth Required)

```bash
curl http://localhost:3000/api/v1/ai/credits \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "credits": 10
  }
}
```

### Test 3: Generate AI Response (Auth Required)

```bash
curl -X POST http://localhost:3000/api/v1/ai/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "input": "Explain quantum computing in simple terms"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "AI response generated successfully",
  "data": {
    "content": "Quantum computing is...",
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "tokensUsed": 150,
    "remainingCredits": 9,
    "creditsUsed": 1
  }
}
```

### Test 4: Frontend UI

1. Open browser: `http://localhost:8080`
2. Log in to your account
3. Open a note
4. Click the AI icon to open the AI Drawer
5. You should see:
   - ✅ AI Credits: 10 (or 9 if you ran Test 3)
   - ✅ Quick action buttons
   - ✅ Input field with character counter
6. Type a message and press Enter
7. Watch credits decrement after successful response

## Troubleshooting

### Issue: "Module not found: @google/genai"

**Solution:**
```bash
npm install @google/genai @perplexity-ai/perplexity_ai
```

### Issue: "Cannot find module 'ai.route'"

**Solution:**
Make sure all files were created correctly. Check:
- `apps/server/src/modules/ai/ai.route.ts` exists
- `apps/server/src/server.ts` imports and uses the route

### Issue: "Column 'ai_credits' does not exist"

**Solution:**
Run the database migration (Step 3)

### Issue: "Invalid API key"

**Solution:**
1. Check `.env` file has correct API keys
2. Restart the server after adding API keys
3. Verify API keys are valid on provider websites

### Issue: "Insufficient AI credits"

**Solution:**
Reset credits manually:
```sql
UPDATE users SET ai_credits = 10 WHERE id = YOUR_USER_ID;
```

### Issue: Frontend shows "Network Error"

**Solution:**
1. Check backend is running on port 3000
2. Check CORS settings in `server.ts`
3. Verify `VITE_API_URL` in frontend `.env`

## Verification Checklist

- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Database migration run
- [ ] Backend server running
- [ ] Frontend client running
- [ ] Constraints endpoint works
- [ ] Credits endpoint works (with auth)
- [ ] Generate endpoint works (with auth)
- [ ] Frontend AI Drawer opens
- [ ] Credits display correctly
- [ ] AI requests work
- [ ] Credits decrement after request

## Next Steps

Once everything is working:

1. **Customize AI Prompts**: Edit `AI_PROMPTS` in `AiDrawer.tsx`
2. **Add More Providers**: Follow the guide in `README.md`
3. **Adjust Credit Limits**: Modify `AI_CONSTRAINTS` in `ai.types.ts`
4. **Implement Phase 2**: Add chat persistence
5. **Implement Phase 3**: Add BYOK (Bring Your Own Key)

## Support

If you encounter issues:

1. Check the comprehensive documentation in `apps/server/src/modules/ai/README.md`
2. Review the implementation summary in `AI_IMPLEMENTATION_SUMMARY.md`
3. Check server logs for detailed error messages
4. Verify all environment variables are set correctly

## Architecture Overview

```
Frontend (React)
    ↓ HTTP Requests
Backend (Express)
    ↓ Business Logic
Services (Credits, Validation, AI)
    ↓ Provider Resolution
AI Providers (Gemini, Perplexity)
    ↓ Credit Management
Database (Users with ai_credits)
```

Happy coding! 🎉
