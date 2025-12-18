import { Request, Response } from 'express';
import { ModelManagementService } from './model-management.service';
import { z } from 'zod';
import { errorHandler, successHandler } from '../../../common/middlewares/responseHandler';
import { parseError } from '../../../common/utils/error.parser';

const SetConfigSchema = z.object({
    provider: z.string(),
    model: z.string(),
    apiKey: z.string().optional(),
    isDefault: z.boolean().optional(),
});

export class BYOKController {

    /**
     * Get all supported models
     */
    static async getSupportedModels(req: Request, res: Response) {
        try {
            const models = await ModelManagementService.getSupportedModels();
            return successHandler(res, 'Supported models fetched successfully', models, 200);
        } catch (error) {
            console.error('Error fetching supported models:', error);
            const errorParser = parseError(error);
            return errorHandler(res, 'Failed to fetch supported models', errorParser.message, errorParser.statusCode);
        }
    }

    /**
     * Get user's model configurations
     */
    static async getUserConfigs(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.userId;
            const configs = await ModelManagementService.getUserConfigs(userId);
            return successHandler(res, 'User configurations fetched successfully', configs, 200);
        } catch (error) {
            console.error('Error fetching user configs:', error);
            const errorParser = parseError(error);
            return errorHandler(res, 'Failed to fetch user configurations', errorParser.message, errorParser.statusCode);
        }
    }

    /**
     * Set or update a user model configuration
     */
    static async setUserConfig(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.userId;
            const validated = SetConfigSchema.parse(req.body);

            const config = await ModelManagementService.setUserConfig(userId, validated);

            return successHandler(res, 'Configuration saved successfully', config, 200);
        } catch (error) {
            console.error('Error setting user config:', error);
            const errorParser = parseError(error);
            return errorHandler(res, 'Failed to save configuration', errorParser.message, errorParser.statusCode);
        }
    }

    /**
     * Delete a user model configuration
     */
    static async deleteUserConfig(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.userId;
            const { provider, model } = req.body;

            if (!provider || !model) {
                return errorHandler(res, 'Provider and model are required', {}, 400);
            }

            await ModelManagementService.deleteUserConfig(userId, provider, model);

            return successHandler(res, 'Configuration deleted successfully', { provider, model }, 200);
        } catch (error) {
            console.error('Error deleting user config:', error);
            const errorParser = parseError(error);
            return errorHandler(res, 'Failed to delete configuration', errorParser.message, errorParser.statusCode);
        }
    }
}
