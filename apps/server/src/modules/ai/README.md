# AI System - Phase 1 Implementation

## Overview

This is a **modular, provider-agnostic AI system** that implements:
- ✅ AI credits management
- ✅ AI request flow (without chat persistence)
- ✅ Pluggable provider architecture
- ✅ Input validation and cost control

## Architecture

### Backend Structure

```
apps/server/src/modules/ai/
├── ai.types.ts                    # Core types and interfaces
├── ai.controller.ts               # HTTP request handlers
├── ai.route.ts                    # Route definitions
├── providers/
│   ├── provider.factory.ts        # Provider resolution
│   ├── gemini.provider.ts         # Gemini implementation
│   └── perplexity.provider.ts     # Perplexity implementation
└── services/
    ├── ai.service.ts              # Main orchestration service
    ├── credits.service.ts         # Credit management
    └── validation.service.ts      # Input validation
```

### Key Design Principles

1. **Provider Agnostic**: All AI providers implement the `IAIProvider` interface
2. **Separation of Concerns**: Each service has a single responsibility
3. **No Hard-coding**: Provider logic is completely isolated from controllers
4. **Extensible**: Adding new providers requires zero changes to existing code

## Features

### 1. AI Credits System

- Each user starts with **10 AI credits**
- Each AI request consumes **1 credit**
- Credits are deducted **only on successful responses**
- Requests are blocked when credits reach 0

**Database Schema:**
```sql
ALTER TABLE users ADD COLUMN ai_credits INTEGER NOT NULL DEFAULT 10;
```

### 2. Supported Providers

#### Gemini (Google)
- Models: `gemini-2.0-flash-exp`, `gemini-exp-1206`
- Package: `@google/genai`

#### Perplexity
- Models: `sonar`, `sonar-pro`
- Package: `@perplexity-ai/perplexity_ai`

### 3. Input Validation

- **Max input length**: 300 characters
- **Estimated token limit**: 200 tokens
- **Provider/model validation**: Ensures valid combinations

### 4. API Endpoints

#### POST `/api/v1/ai/generate`
Generate AI response (requires authentication)

**Request:**
```json
{
  "provider": "gemini",
  "model": "gemini-2.0-flash-exp",
  "input": "Explain how AI works",
  "options": {
    "temperature": 0.7,
    "maxTokens": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI response generated successfully",
  "data": {
    "content": "AI works by...",
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "tokensUsed": 150,
    "remainingCredits": 9,
    "creditsUsed": 1
  }
}
```

#### GET `/api/v1/ai/credits`
Get remaining AI credits (requires authentication)

**Response:**
```json
{
  "success": true,
  "data": {
    "credits": 9
  }
}
```

#### GET `/api/v1/ai/constraints`
Get AI constraints and supported providers (public)

**Response:**
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

## Frontend Integration

### API Module (`aiApi.ts`)

Provides typed functions for AI operations:
```typescript
import { generateAIResponse, getAICredits, getAIConstraints } from '@/api/aiApi';
```

### React Hooks (`useAI.ts`)

TanStack Query hooks for AI operations:

```typescript
import { useAICredits, useAIConstraints, useGenerateAI } from '@/hooks/useAI';

function MyComponent() {
  const { data: credits } = useAICredits();
  const { data: constraints } = useAIConstraints();
  const generateAI = useGenerateAI();

  const handleGenerate = async () => {
    const response = await generateAI.mutateAsync({
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      input: 'Hello AI',
    });
  };
}
```

### AiDrawer Component

Fully integrated AI chat interface with:
- Real-time credit display
- Input length validation
- Error handling
- Loading states

## Environment Variables

Add these to your `.env` file:

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Perplexity API Key
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

## Error Handling

The system handles various error scenarios:

### Insufficient Credits (402)
```json
{
  "success": false,
  "message": "Insufficient AI credits",
  "data": {
    "required": 1,
    "available": 0
  }
}
```

### Invalid Input (400)
```json
{
  "success": false,
  "message": "Input exceeds maximum length of 300 characters"
}
```

### Provider Error (500)
```json
{
  "success": false,
  "message": "Gemini API error: Rate limit exceeded",
  "data": {
    "provider": "gemini"
  }
}
```

## Adding a New Provider

To add a new AI provider:

1. **Create provider implementation:**
```typescript
// providers/openai.provider.ts
import { IAIProvider, AIResponse } from '../ai.types';

export class OpenAIProvider implements IAIProvider {
  readonly name = 'openai' as const;

  async generateResponse(
    input: string,
    model: string,
    apiKey: string,
    options?: any
  ): Promise<AIResponse> {
    // Implementation
  }

  isModelSupported(model: string): boolean {
    // Validation
  }
}
```

2. **Update types:**
```typescript
// ai.types.ts
export type AIProvider = 'gemini' | 'perplexity' | 'openai';

export const PROVIDER_MODELS = {
  gemini: ['gemini-2.0-flash-exp', 'gemini-exp-1206'],
  perplexity: ['sonar', 'sonar-pro'],
  openai: ['gpt-4', 'gpt-3.5-turbo'],
};
```

3. **Register in factory:**
```typescript
// providers/provider.factory.ts
export class AIProviderFactory {
  private static providers: Map<AIProvider, IAIProvider> = new Map([
    ['gemini', new GeminiProvider()],
    ['perplexity', new PerplexityProvider()],
    ['openai', new OpenAIProvider()], // Add here
  ]);
}
```

That's it! No changes needed to controllers, services, or routes.

## Testing

### Manual Testing

1. **Check credits:**
```bash
curl http://localhost:3000/api/v1/ai/credits \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Generate AI response:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "input": "What is AI?"
  }'
```

3. **Get constraints:**
```bash
curl http://localhost:3000/api/v1/ai/constraints
```

## Migration

Run the migration to add the `ai_credits` column:

```bash
# If using a migration tool
npm run migrate

# Or manually execute the SQL
psql -d your_database -f apps/server/migrations/20251215_add_ai_credits.sql
```

## Future Phases

### Phase 2: Chat Persistence
- Store chat history in database
- Retrieve past conversations
- Associate chats with notes/canvases

### Phase 3: Bring Your Own Key (BYOK)
- Allow users to add their own API keys
- Unlimited requests with user's keys
- Secure key storage

## Security Considerations

1. **API Keys**: Never expose API keys to the frontend
2. **Rate Limiting**: Consider adding rate limiting per user
3. **Input Sanitization**: All inputs are validated before processing
4. **Credit Tracking**: Credits are atomic operations to prevent race conditions

## Performance

- **Caching**: Constraints are cached indefinitely (staleTime: Infinity)
- **Optimistic Updates**: Credits are updated immediately in the UI
- **Lazy Loading**: AI constraints fetched only when needed

## Troubleshooting

### "Module not found" errors
```bash
npm install @google/genai @perplexity-ai/perplexity_ai
```

### Credits not updating
- Check if migration was run
- Verify user has `ai_credits` column
- Check browser console for errors

### AI requests failing
- Verify API keys in `.env`
- Check provider API status
- Review server logs for detailed errors

## License

MIT
