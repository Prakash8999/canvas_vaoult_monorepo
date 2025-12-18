import { z } from 'zod';

// -----------------------------
// 🧩 AI Provider Types
// -----------------------------

/**
 * Supported AI providers
 */
export type AIProvider = 'gemini' | 'perplexity';

/**
 * Supported models per provider
 */
export const PROVIDER_MODELS = {
    gemini: ['gemini-2.0-flash-exp', 'gemini-exp-1206', 'gemini-3-pro-preview'] as const,
    perplexity: ['sonar', 'sonar-pro'] as const,
} as const;

export type GeminiModel = typeof PROVIDER_MODELS.gemini[number];
export type PerplexityModel = typeof PROVIDER_MODELS.perplexity[number];
export type AIModel = GeminiModel | PerplexityModel;

/**
 * Input/Output constraints
 */
export const AI_CONSTRAINTS = {
    MAX_INPUT_LENGTH: 300, // Maximum characters allowed in input
    MAX_TOKEN_ESTIMATE: 200, // Approximate token limit
    CREDIT_COST_PER_REQUEST: 1, // Credits consumed per request
    DEFAULT_USER_CREDITS: 10, // Starting credits for new users
} as const;

// -----------------------------
// 🧩 Request/Response Schemas
// -----------------------------

/**
 * AI Request Schema
 */
export const AIRequestSchema = z.object({
    provider: z.enum(['gemini', 'perplexity']),
    model: z.string().min(1),
    input: z.string()
        .min(1, 'Input cannot be empty')
        .max(AI_CONSTRAINTS.MAX_INPUT_LENGTH, `Input must not exceed ${AI_CONSTRAINTS.MAX_INPUT_LENGTH} characters`),
    options: z.object({
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().int().positive().optional(),
    }).optional(),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;

/**
 * Normalized AI Response
 */
export interface AIResponse {
    content: string;
    provider: AIProvider;
    model: string;
    tokensUsed?: number;
    metadata?: Record<string, unknown>;
}

/**
 * AI Service Response (includes credits)
 */
export interface AIServiceResponse extends AIResponse {
    remainingCredits: number;
    creditsUsed: number;
    usingCustomKey: boolean; // Flag to indicate if BYOK is being used
}

// -----------------------------
// 🧩 AI Provider Interface
// -----------------------------

/**
 * Common interface that all AI providers must implement
 * This ensures provider-agnostic architecture
 */
export interface IAIProvider {
    /**
     * Provider identifier
     */
    readonly name: AIProvider;

    /**
     * Generate AI response
     * @param input - User input text
     * @param model - Model to use
     * @param apiKey - API key for the provider
     * @param options - Optional parameters
     * @returns Normalized AI response
     */
    generateResponse(
        input: string,
        model: string,
        apiKey: string,
        options?: {
            temperature?: number;
            maxTokens?: number;
        }
    ): Promise<AIResponse>;

    /**
     * Validate if the model is supported by this provider
     * @param model - Model name to validate
     */
    isModelSupported(model: string): boolean;
}

// -----------------------------
// 🧩 Error Types
// -----------------------------

export class AIProviderError extends Error {
    constructor(
        message: string,
        public provider: AIProvider,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'AIProviderError';
    }
}

export class InsufficientCreditsError extends Error {
    constructor(
        public required: number,
        public available: number
    ) {
        super(`Insufficient AI credits. Required: ${required}, Available: ${available}`);
        this.name = 'InsufficientCreditsError';
    }
}

export class InvalidInputError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidInputError';
    }
}
