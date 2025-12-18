import { SupportedModel } from './supported-model.model';
import { UserAIConfig } from './user-config.model';
import { EncryptionService } from './encryption.service';
import { ApiKeyValidationService } from './key-validation.service';
import { AIProvider } from '../ai.types';

export interface SetConfigDto {
    provider: string;
    model: string;
    apiKey?: string;
    isDefault?: boolean;
}

export interface ResolvedModelConfig {
    provider: AIProvider;
    model: string;
    apiKey: string;
    isUserKey: boolean;
}

const DEFAULT_PROVIDER = 'gemini';
const DEFAULT_MODEL = 'gemini-2.0-flash-exp';

export class ModelManagementService {

    /**
     * List all supported models
     */
    static async getSupportedModels() {
        let models = await SupportedModel.findAll({
            where: { is_enabled: true },
            attributes: ['provider', 'name', 'description']
        });

        // Simple check: if Perplexity is present but 'sonar' string is missing, OR completely empty
        const hasPerplexity = models.some(m => m.provider === 'perplexity');
        const hasSonar = models.some(m => m.name === 'sonar');

        if (models.length === 0 || (hasPerplexity && !hasSonar)) {
            await this.syncModels();
            return SupportedModel.findAll({
                where: { is_enabled: true },
                attributes: ['provider', 'name', 'description']
            });
        }

        return models;
    }

    private static async syncModels() {
        // Simple, clean logic: Enforce strict list for Perplexity.
        // User stated old models are already gone, so we just ensure specific legacy keys are wiped if they conflict? 
        // No, user said "I have already removed it". So strictly sync SupportedModel table.
        try {
            await SupportedModel.destroy({ where: { provider: 'perplexity' } });
        } catch (e) {
            console.warn('Failed to cleanup perplexity models', e);
        }

        const defaults = [
            { provider: 'gemini', name: 'gemini-1.5-flash', description: 'Fast, cost-efficient multimodal model' },
            { provider: 'gemini', name: 'gemini-1.5-pro', description: 'High intelligence for complex tasks' },
            { provider: 'gemini', name: 'gemini-2.0-flash-exp', description: 'Next generation experimental model' },
            { provider: 'perplexity', name: 'sonar', description: 'Optimized for online search and chat' },
            { provider: 'perplexity', name: 'sonar-pro', description: 'Advanced reasoning and search' },
        ];

        for (const def of defaults) {
            await SupportedModel.findOrCreate({
                where: { provider: def.provider, name: def.name },
                defaults: { ...def, is_enabled: true }
            });
        }
    }

    /**
     * Get user configurations (without decrypted keys)
     */
    static async getUserConfigs(userId: number) {
        // Explicitly select attributes to ensure encrypted_api_key is fetched for check
        const configs = await UserAIConfig.findAll({
            where: { user_id: userId },
            attributes: ['id', 'provider', 'model', 'is_default', 'created_at', 'encrypted_api_key'],
            raw: true,
            nest: true
        });

        // Map to response object with has_key
        return configs.map(c => {
            // Strict check for existence
            const hasValues = c.encrypted_api_key !== null && c.encrypted_api_key !== undefined && c.encrypted_api_key !== '';
            return {
                id: c.id,
                provider: c.provider,
                model: c.model,
                is_default: c.is_default,
                created_at: c.created_at,
                has_key: hasValues
            };
        });
    }

    /**
     * Set or Update User Configuration
     */
    static async setUserConfig(userId: number, dto: SetConfigDto) {
        const { provider, model, apiKey, isDefault } = dto;
        console.log(provider, model, apiKey, isDefault);
        // 1. Validate Provider/Model is supported
        const supported = await SupportedModel.findOne({ where: { provider, name: model, is_enabled: true } });
        if (!supported) {
            throw new Error(`Model ${provider}/${model} is not supported`);
        }

        let encryptedKey: string | null = null;
        if (apiKey) {
            // 2. Validate Key
            const isValid = await ApiKeyValidationService.validate(provider, apiKey);
            if (!isValid) {
                // If validation failed, do NOT save
                throw new Error('Invalid API Key');
            }
            // 3. Encrypt Key
            encryptedKey = EncryptionService.encrypt(apiKey);
        }

        // 4. Handle Defaults (One per user)
        if (isDefault) {
            await UserAIConfig.update({ is_default: false }, { where: { user_id: userId } });
        }

        // 5. Upsert Config
        const existing = await UserAIConfig.findOne({ where: { user_id: userId, provider, model } });

        let result: UserAIConfig;

        if (existing) {
            await existing.update({
                encrypted_api_key: encryptedKey ?? existing.encrypted_api_key,
                is_default: isDefault ?? existing.is_default
            });
            await existing.reload();
            result = existing;
        } else {
            result = await UserAIConfig.create({
                user_id: userId,
                provider,
                model,
                encrypted_api_key: encryptedKey,
                is_default: isDefault || false
            });
        }

        // Return sanitized result with has_key
        // Access dataValues since result is a Sequelize instance
        const encryptedApiKey = result.dataValues?.encrypted_api_key || result.encrypted_api_key;
        const hasValues = encryptedApiKey !== null && encryptedApiKey !== undefined && encryptedApiKey !== '';

        console.log('[ModelManagement] Returning config with has_key:', hasValues, 'encrypted_api_key length:', encryptedApiKey?.length);

        return {
            id: result.dataValues.id,
            provider: result.dataValues.provider,
            model: result.dataValues.model,
            is_default: result.dataValues.is_default,
            created_at: result.dataValues.created_at,
            has_key: hasValues
        };
    }

    /**
     * Delete User Configuration (API Key)
     */
    static async deleteUserConfig(userId: number, provider: string, model: string) {
        const config = await UserAIConfig.findOne({ where: { user_id: userId, provider, model } });
        if (!config) throw new Error('Configuration not found');

        // Allow deleting default if they really want to? 
        // User asked for "edit option". 
        // If they delete, default is lost.

        await config.destroy();
    }

    /**
     * Resolve Provider, Model, and API Key for execution
     */
    static async resolveModelConfig(userId: number, requestedProvider?: string, requestedModel?: string, forceSystemKey?: boolean): Promise<ResolvedModelConfig> {
        console.log(`[ModelManagement] Resolving config for userId: ${userId}, provider: ${requestedProvider}, model: ${requestedModel}, forceSystemKey: ${forceSystemKey}`);

        let provider: string = requestedProvider || '';
        let model: string = requestedModel || '';
        let config: UserAIConfig | null = null;

        // 1. Need Default Resolution?
        if (!provider || !model) {
            console.log('[ModelManagement] No provider/model specified, looking for user default...');
            // Find User Default
            const userDefault = await UserAIConfig.findOne({ where: { user_id: userId, is_default: true }, raw: true, nest: true });
            if (userDefault) {
                provider = userDefault.provider;
                model = userDefault.model;
                config = userDefault;
                console.log(`[ModelManagement] Found user default: ${provider}/${model}, has_key: ${!!userDefault.encrypted_api_key}`);
            } else {
                // Fallback to System Default
                provider = DEFAULT_PROVIDER;
                model = DEFAULT_MODEL;
                console.log(`[ModelManagement] No user default found, using system default: ${provider}/${model}`);
            }
        } else {
            // 2. Find specific config for requested params
            console.log(`[ModelManagement] Looking for specific config: ${provider}/${model}`);
            config = await UserAIConfig.findOne({ where: { user_id: userId, provider, model }, raw: true, nest: true });
            if (config) {
                console.log(`[ModelManagement] Found config for ${provider}/${model}, has_key: ${!!config.encrypted_api_key}`);
            } else {
                console.log(`[ModelManagement] No config found for ${provider}/${model}`);
            }
        }

        // 3. Resolve API Key
        let apiKey = '';
        let isUserKey = false;

        // Only use custom key if NOT forcing system key
        if (config && config.encrypted_api_key && !forceSystemKey) {
            apiKey = EncryptionService.decrypt(config.encrypted_api_key);
            isUserKey = true;
            console.log(`[ModelManagement] Using USER key for ${provider}/${model}`);
        } else {
            // Use System Key
            apiKey = this.getSystemKey(provider);
            isUserKey = false;
            console.log(`[ModelManagement] Using SYSTEM key for ${provider}/${model}`);
        }

        if (!apiKey) {
            throw new Error(`No API key available for ${provider}`);
        }

        return {
            provider: provider as AIProvider,
            model,
            apiKey,
            isUserKey
        };
    }

    private static getSystemKey(provider: string): string {
        switch (provider) {
            case 'gemini': return process.env.GEMINI_API_KEY || '';
            case 'perplexity': return process.env.PERPLEXITY_API_KEY || '';
            default: return '';
        }
    }
}
