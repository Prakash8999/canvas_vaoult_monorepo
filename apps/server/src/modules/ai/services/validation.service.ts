import { AIRequestSchema, AI_CONSTRAINTS, InvalidInputError, PROVIDER_MODELS } from '../ai.types';

/**
 * Input Validation Service
 * Validates AI requests before processing
 * Enforces input length limits and validates provider/model combinations
 */
export class InputValidationService {
    /**
     * Validate AI request
     * @param request - Request object to validate
     * @throws InvalidInputError if validation fails
     */
    static validateRequest(request: unknown): void {
        // Validate against schema
        const result = AIRequestSchema.safeParse(request);

        if (!result.success) {
            const errors = result.error.issues.map((e: any) => e.message).join(', ');
            throw new InvalidInputError(`Validation failed: ${errors}`);
        }

        const { provider, model, input } = result.data;

        // Validate input length
        this.validateInputLength(input);

        // Validate provider and model combination
        this.validateProviderModel(provider, model);
    }

    /**
     * Validate input length
     * @param input - Input text to validate
     * @throws InvalidInputError if input exceeds limits
     */
    static validateInputLength(input: string): void {
        if (input.length > AI_CONSTRAINTS.MAX_INPUT_LENGTH) {
            throw new InvalidInputError(
                `Input exceeds maximum length of ${AI_CONSTRAINTS.MAX_INPUT_LENGTH} characters. Current length: ${input.length}`
            );
        }

        // Estimate token count (rough approximation: 1 token ≈ 4 characters)
        const estimatedTokens = Math.ceil(input.length / 4);
        if (estimatedTokens > AI_CONSTRAINTS.MAX_TOKEN_ESTIMATE) {
            throw new InvalidInputError(
                `Input exceeds estimated token limit of ${AI_CONSTRAINTS.MAX_TOKEN_ESTIMATE} tokens. Estimated: ${estimatedTokens}`
            );
        }
    }

    /**
     * Validate provider and model combination
     * @param provider - Provider name
     * @param model - Model name
     * @throws InvalidInputError if combination is invalid
     */
    static validateProviderModel(provider: string, model: string): void {
        const supportedModels = PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS] as readonly string[] | undefined;

        if (!supportedModels) {
            throw new InvalidInputError(
                `Invalid provider: ${provider}. Supported providers: ${Object.keys(PROVIDER_MODELS).join(', ')}`
            );
        }

        if (!supportedModels.includes(model)) {
            throw new InvalidInputError(
                `Model "${model}" is not supported for provider "${provider}". Supported models: ${supportedModels.join(', ')}`
            );
        }
    }

    /**
     * Get validation constraints
     * Useful for frontend to display limits
     */
    static getConstraints() {
        return {
            maxInputLength: AI_CONSTRAINTS.MAX_INPUT_LENGTH,
            maxTokenEstimate: AI_CONSTRAINTS.MAX_TOKEN_ESTIMATE,
            creditCostPerRequest: AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST,
            supportedProviders: Object.keys(PROVIDER_MODELS),
            supportedModels: PROVIDER_MODELS,
        };
    }
}
