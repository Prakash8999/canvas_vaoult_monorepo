import { IAIProvider, AIProvider, AIProviderError } from '../ai.types';
import { GeminiProvider } from './gemini.provider';
import { PerplexityProvider } from './perplexity.provider';

/**
 * Provider Factory
 * Resolves and returns the appropriate AI provider instance
 * This is the single point of provider instantiation
 */
export class AIProviderFactory {
    private static providers: Map<AIProvider, IAIProvider> = new Map<AIProvider, IAIProvider>([
        ['gemini', new GeminiProvider()],
        ['perplexity', new PerplexityProvider()],
    ]);

    /**
     * Get provider instance by name
     * @param providerName - Name of the provider to retrieve
     * @returns Provider instance
     * @throws AIProviderError if provider is not supported
     */
    static getProvider(providerName: AIProvider): IAIProvider {
        const provider = this.providers.get(providerName);

        if (!provider) {
            throw new AIProviderError(
                `Provider "${providerName}" is not supported. Available providers: ${Array.from(this.providers.keys()).join(', ')}`,
                providerName,
                400
            );
        }

        return provider;
    }

    /**
     * Check if a provider is supported
     * @param providerName - Provider name to check
     */
    static isProviderSupported(providerName: string): providerName is AIProvider {
        return this.providers.has(providerName as AIProvider);
    }

    /**
     * Get list of all supported providers
     */
    static getSupportedProviders(): AIProvider[] {
        return Array.from(this.providers.keys());
    }
}
