import { GoogleGenAI } from '@google/genai';
import { IAIProvider, AIResponse, AIProviderError, PROVIDER_MODELS } from '../ai.types';

/**
 * Gemini AI Provider Implementation
 * Handles all interactions with Google's Gemini API
 */
export class GeminiProvider implements IAIProvider {
    readonly name = 'gemini' as const;

    /**
     * Generate AI response using Gemini
     */
    async generateResponse(
        input: string,
        model: string,
        apiKey: string,
        options?: {
            temperature?: number;
            maxTokens?: number;
        }
    ): Promise<AIResponse> {
        try {
            // Validate model
            if (!this.isModelSupported(model)) {
                throw new AIProviderError(
                    `Model "${model}" is not supported by Gemini. Supported models: ${PROVIDER_MODELS.gemini.join(', ')}`,
                    'gemini',
                    400
                );
            }

            // Initialize Gemini client
            const ai = new GoogleGenAI({ apiKey });

            // Make API call with generation config
            const response = await ai.models.generateContent({
                model,
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: input }],
                    },
                ],
                config: {
                    temperature: options?.temperature,
                    maxOutputTokens: options?.maxTokens,
                },
            });

            // Extract text from response
            const content = response.text || '';

            if (!content) {
                throw new AIProviderError(
                    'Gemini returned an empty response',
                    'gemini',
                    500
                );
            }

            // Return normalized response
            return {
                content,
                provider: 'gemini',
                model,
                tokensUsed: response.usageMetadata?.totalTokenCount,
                metadata: {
                    candidateCount: response.candidates?.length,
                    finishReason: response.candidates?.[0]?.finishReason,
                },
            };
        } catch (error) {
            // Handle Gemini-specific errors
            if (error instanceof AIProviderError) {
                throw error;
            }

            // Handle API errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new AIProviderError(
                `Gemini API error: ${errorMessage}`,
                'gemini',
                500
            );
        }
    }

    /**
     * Check if model is supported by Gemini
     */
    isModelSupported(model: string): boolean {
        return PROVIDER_MODELS.gemini.includes(model as any);
    }
}
