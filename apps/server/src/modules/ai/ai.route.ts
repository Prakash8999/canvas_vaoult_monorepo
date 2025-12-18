import { Router } from 'express';
import { authUser } from '../../common/middlewares/auth/authMiddleware';
import * as AIController from './ai.controller';
import chatRoutes from './chat/chat.routes';

const router = Router();

// Chat Routes - Mount under /chats
// e.g. /api/v1/ai/chats
router.use('/chats', chatRoutes);

/**
 * AI Routes
 */

/**
 * @route   POST /api/ai/generate
 * @desc    Generate AI response
 * @access  Private
 */
router.post('/generate', authUser, AIController.generateAIResponse);

/**
 * @route   GET /api/ai/credits
 * @desc    Get user's remaining AI credits
 * @access  Private
 */
router.get('/credits', authUser, AIController.getCredits);

/**
 * @route   GET /api/ai/constraints
 * @desc    Get AI constraints and supported providers/models
 * @access  Public (useful for frontend to know limits before login)
 */
router.get('/constraints', AIController.getConstraints);

/**
 * Model Management Routes (Phase 3)
 */
import { BYOKController } from './byok/byok.controller';

// Public: List supported models (System defined)
router.get('/models', BYOKController.getSupportedModels);

// Private: Manage User Configs (BYOK)
router.get('/config', authUser, BYOKController.getUserConfigs);
router.post('/config', authUser, BYOKController.setUserConfig);
router.delete('/config', authUser, BYOKController.deleteUserConfig);

export default router;
