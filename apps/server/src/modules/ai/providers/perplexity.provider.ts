import Perplexity from '@perplexity-ai/perplexity_ai';
import { IAIProvider, AIResponse, AIProviderError, PROVIDER_MODELS } from '../ai.types';

/**
 * Perplexity AI Provider Implementation
 * Handles all interactions with Perplexity API
 */
export class PerplexityProvider implements IAIProvider {
    readonly name = 'perplexity' as const;

    /**
     * Generate AI response using Perplexity
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
                    `Model "${model}" is not supported by Perplexity. Supported models: ${PROVIDER_MODELS.perplexity.join(', ')}`,
                    'perplexity',
                    400
                );
            }

            // Initialize Perplexity client with API key
            const client = new Perplexity({ apiKey });

            // Make API call
            const completion = await client.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that provides concise, accurate answers.',
                    },
                    {
                        role: 'user',
                        content: input,
                    },
                ],
                temperature: options?.temperature,
                max_tokens: options?.maxTokens,
            });

            // Extract content from response
            // Perplexity API can return content as string or array of content chunks
            const rawContent = completion.choices?.[0]?.message?.content;

            let content: string;
            if (typeof rawContent === 'string') {
                content = rawContent;
            } else if (Array.isArray(rawContent)) {
                // Extract text from content chunks (for multimodal responses)
                content = rawContent
                    .filter((chunk: any) => chunk.type === 'text')
                    .map((chunk: any) => chunk.text || '')
                    .join('');
            } else {
                content = '';
            }

            if (!content) {
                throw new AIProviderError(
                    'Perplexity returned an empty response',
                    'perplexity',
                    500
                );
            }

            // Strip citation markers like [1], [2], [3] from Perplexity responses
            const cleanContent = this.stripCitations(content);

            // Return normalized response
            return {
                content: cleanContent,
                provider: 'perplexity',
                model,
                tokensUsed: completion.usage?.total_tokens,
                metadata: {
                    finishReason: completion.choices?.[0]?.finish_reason,
                    citations: completion.citations,
                },
            };
        } catch (error) {
            // Handle Perplexity-specific errors
            if (error instanceof AIProviderError) {
                throw error;
            }

            // Handle API errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new AIProviderError(
                `Perplexity API error: ${errorMessage}`,
                'perplexity',
                500
            );
        }
    }

    /**
     * Strip citation markers from Perplexity responses
     * Removes patterns like [1], [2], [3], [1][2], etc.
     * @param text - Text with citation markers
     * @returns Clean text without citations
     */
    private stripCitations(text: string): string {
        // Remove citation markers like [1], [2], [3], [1][2][3], etc.
        return text.replace(/\[\d+\](\[\d+\])*/g, '').trim();
    }

    /**
     * Check if model is supported by Perplexity
     */
    isModelSupported(model: string): boolean {
        return PROVIDER_MODELS.perplexity.includes(model as any);
    }
}
