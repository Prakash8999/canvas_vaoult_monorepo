import { Router } from 'express';
import { authUser } from '../../common/middlewares/auth/authMiddleware';
import * as aiController from './ai.controller';

const router = Router();

/**
 * AI Routes
 * All routes require authentication
 */

/**
 * @route   POST /api/ai/generate
 * @desc    Generate AI response
 * @access  Private
 */
router.post('/generate', authUser, aiController.generateAIResponse);

/**
 * @route   GET /api/ai/credits
 * @desc    Get user's remaining AI credits
 * @access  Private
 */
router.get('/credits', authUser, aiController.getCredits);

/**
 * @route   GET /api/ai/constraints
 * @desc    Get AI constraints and supported providers/models
 * @access  Public (useful for frontend to know limits before login)
 */
router.get('/constraints', aiController.getConstraints);

export default router;
