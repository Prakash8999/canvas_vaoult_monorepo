import { AIProviderFactory } from '../providers/provider.factory';
import { AICreditsService } from './credits.service';
import { InputValidationService } from './validation.service';
import { ModelManagementService } from '../byok/model-management.service';
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
     * @param forceSystemKey - If true, use system key even if user has custom key
     * @returns AI response with credit information
     */
    static async executeRequest(
        userId: number,
        request: AIRequest,
        forceSystemKey?: boolean
    ): Promise<AIServiceResponse> {
        // STEP 1: Validate input
        InputValidationService.validateRequest(request);

        // STEP 2: Resolve Model & Key (Phase 3 BYOK)
        // This determines which key to use and whether to deduct credits
        const resolvedConfig = await ModelManagementService.resolveModelConfig(
            userId,
            request.provider,
            request.model,
            forceSystemKey
        );
        const { apiKey, isUserKey } = resolvedConfig;

        // STEP 3: Check credits (Only if using System Key)
        if (!isUserKey) {
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
        }

        // STEP 4: Resolve provider
        const provider = AIProviderFactory.getProvider(resolvedConfig.provider);

        // STEP 5: Execute AI request
        let aiResponse;
        try {
            aiResponse = await provider.generateResponse(
                request.input,
                request.model, // Use detailed model from request or resolved? Request has 'model'
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

        // STEP 6: Deduct credits (only on successful response AND if using System Key)
        let remainingCredits = await AICreditsService.getUserCredits(userId);
        let creditsUsed = 0;

        console.log(`[AI Service] isUserKey: ${isUserKey}, Current Credits: ${remainingCredits}`);

        if (!isUserKey) {
            remainingCredits = await AICreditsService.deductCredits(
                userId,
                AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST
            );
            creditsUsed = AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST;
            console.log(`[AI Service] Credits deducted. New balance: ${remainingCredits}, Used: ${creditsUsed}`);
        } else {
            console.log(`[AI Service] Using custom key - NO credits deducted`);
        }

        // STEP 7: Return response with credit info
        return {
            ...aiResponse,
            remainingCredits,
            creditsUsed,
            usingCustomKey: isUserKey, // Explicitly indicate if BYOK was used
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
