import axios from 'axios';

export class ApiKeyValidationService {
    /**
     * Validates an API key for a specific provider without consuming significant resources.
     */
    static async validate(provider: string, apiKey: string): Promise<boolean> {
        try {
            switch (provider) {
                case 'gemini':
                    return await this.validateGemini(apiKey);
                case 'perplexity':
                    return await this.validatePerplexity(apiKey);
                default:
                    // Unknown provider, fail safe
                    return false;
            }
        } catch (error: any) {
            // Log full error for debugging but return false
            console.warn(`[ApiKeyValidation] Validation failed for ${provider}:`, error.message);
            if (error.response) {
                console.warn(`[ApiKeyValidation] Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            return false;
        }
    }

    private static async validateGemini(apiKey: string): Promise<boolean> {
        // Use the 'list models' endpoint which validates the key and is lightweight
        const url = `https://generativelanguage.googleapis.com/v1beta/models?page_size=1&key=${apiKey}`;
        const response = await axios.get(url);
        return response.status === 200;
    }

    private static async validatePerplexity(apiKey: string): Promise<boolean> {
        // Perplexity doesn't expose a dedicated validation endpoint,
        // so we perform a minimal completion request with max_tokens=1
        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 1,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.status === 200;
    }
}
