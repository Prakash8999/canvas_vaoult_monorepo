import { Request, Response } from 'express';
import { AIService } from './services/ai.service';
import { successHandler, errorHandler } from '../../common/middlewares/responseHandler';
import { parseError } from '../../common/utils/error.parser';
import {
    AIProviderError,
    InsufficientCreditsError,
    InvalidInputError,
} from './ai.types';

/**
 * AI Controller
 * Handles HTTP requests for AI operations
 * Controllers should be thin - business logic lives in services
 */

/**
 * Execute AI request
 * POST /api/ai/generate
 */
export const generateAIResponse = async (req: Request, res: Response) => {
    try {
        // Authenticate user
        if (!req.user || !req.user.userId) {
            return errorHandler(res, 'Unauthorized', {}, 401);
        }

        const userId = req.user.userId;

        // Execute AI request (key resolution handles internally)
        const response = await AIService.executeRequest(userId, req.body);

        return successHandler(
            res,
            'AI response generated successfully',
            response,
            200
        );
    } catch (error) {
        console.error('Error generating AI response:', error);

        // Handle specific error types
        if (error instanceof InsufficientCreditsError) {
            return errorHandler(
                res,
                'Insufficient AI credits',
                {
                    required: error.required,
                    available: error.available,
                },
                402 // Payment Required
            );
        }

        if (error instanceof InvalidInputError) {
            return errorHandler(res, error.message, {}, 400);
        }

        if (error instanceof AIProviderError) {
            return errorHandler(
                res,
                error.message,
                { provider: error.provider },
                error.statusCode
            );
        }

        // Generic error handling
        const errorParser = parseError(error);
        return errorHandler(
            res,
            'Failed to generate AI response',
            errorParser.message,
            errorParser.statusCode
        );
    }
};

/**
 * Get user's remaining AI credits
 * GET /api/ai/credits
 */
export const getCredits = async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.userId) {
            return errorHandler(res, 'Unauthorized', {}, 401);
        }

        const userId = req.user.userId;
        const credits = await AIService.getRemainingCredits(userId);

        return successHandler(
            res,
            'Credits fetched successfully',
            { credits },
            200
        );
    } catch (error) {
        console.error('Error fetching credits:', error);
        const errorParser = parseError(error);
        return errorHandler(
            res,
            'Failed to fetch credits',
            errorParser.message,
            errorParser.statusCode
        );
    }
};

/**
 * Get AI constraints and supported providers
 * GET /api/ai/constraints
 */
export const getConstraints = async (req: Request, res: Response) => {
    try {
        const constraints = AIService.getConstraints();

        return successHandler(
            res,
            'Constraints fetched successfully',
            constraints,
            200
        );
    } catch (error) {
        console.error('Error fetching constraints:', error);
        const errorParser = parseError(error);
        return errorHandler(
            res,
            'Failed to fetch constraints',
            errorParser.message,
            errorParser.statusCode
        );
    }
};


