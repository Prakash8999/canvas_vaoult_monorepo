import { AIProviderFactory } from '../providers/provider.factory';
import { AICreditsService } from './credits.service';
import { InputValidationService } from './validation.service';
import {
    AIRequest,
    AIServiceResponse,
    AI_CONSTRAINTS,
    AIProviderError,
    InsufficientCreditsError,
} from '../ai.types';

/**
 * Main AI Service
 * Orchestrates the entire AI request flow:
 * 1. Validate input
 * 2. Check credits
 * 3. Execute AI request
 * 4. Deduct credits on success
 * 5. Return response with remaining credits
 */
export class AIService {
    /**
     * Execute AI request
     * @param userId - User ID making the request
     * @param request - AI request details
     * @param apiKey - API key for the provider (passed dynamically)
     * @returns AI response with credit information
     */
    static async executeRequest(
        userId: number,
        request: AIRequest,
        apiKey: string
    ): Promise<AIServiceResponse> {
        // STEP 1: Validate input
        InputValidationService.validateRequest(request);

        // STEP 2: Check credits
        const hasCredits = await AICreditsService.hasCredits(
            userId,
            AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST
        );

        if (!hasCredits) {
            const available = await AICreditsService.getUserCredits(userId);
            throw new InsufficientCreditsError(
                AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST,
                available
            );
        }

        // STEP 3: Resolve provider
        const provider = AIProviderFactory.getProvider(request.provider);

        // STEP 4: Execute AI request
        let aiResponse;
        try {
            aiResponse = await provider.generateResponse(
                request.input,
                request.model,
                apiKey,
                request.options
            );
        } catch (error) {
            // If AI call fails, do NOT deduct credits
            if (error instanceof AIProviderError) {
                throw error;
            }
            throw new AIProviderError(
                `AI request failed: ${error instanceof Error ? error.message : 'Unknown error'} `,
                request.provider,
                500
            );
        }

        // STEP 5: Deduct credits (only on successful response)
        const remainingCredits = await AICreditsService.deductCredits(
            userId,
            AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST
        );

        // STEP 6: Return response with credit info
        return {
            ...aiResponse,
            remainingCredits,
            creditsUsed: AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST,
        };
    }

    /**
     * Get user's remaining credits
     * @param userId - User ID
     * @returns Remaining credits
     */
    static async getRemainingCredits(userId: number): Promise<number> {
        return AICreditsService.getUserCredits(userId);
    }

    /**
     * Get AI constraints and supported providers/models
     * Useful for frontend to display available options
     */
    static getConstraints() {
        return InputValidationService.getConstraints();
    }
}
