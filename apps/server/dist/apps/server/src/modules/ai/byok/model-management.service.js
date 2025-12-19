"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var model_management_service_exports = {};
__export(model_management_service_exports, {
  ModelManagementService: () => ModelManagementService
});
module.exports = __toCommonJS(model_management_service_exports);
var import_supported_model = require("./supported-model.model");
var import_user_config = require("./user-config.model");
var import_encryption = require("./encryption.service");
var import_key_validation = require("./key-validation.service");
const DEFAULT_PROVIDER = "gemini";
const DEFAULT_MODEL = "gemini-2.0-flash-exp";
class ModelManagementService {
  /**
   * List all supported models
   */
  static async getSupportedModels() {
    let models = await import_supported_model.SupportedModel.findAll({
      where: { is_enabled: true },
      attributes: ["provider", "name", "description"]
    });
    const hasPerplexity = models.some((m) => m.provider === "perplexity");
    const hasSonar = models.some((m) => m.name === "sonar");
    if (models.length === 0 || hasPerplexity && !hasSonar) {
      await this.syncModels();
      return import_supported_model.SupportedModel.findAll({
        where: { is_enabled: true },
        attributes: ["provider", "name", "description"]
      });
    }
    return models;
  }
  static async syncModels() {
    try {
      await import_supported_model.SupportedModel.destroy({ where: { provider: "perplexity" } });
    } catch (e) {
      console.warn("Failed to cleanup perplexity models", e);
    }
    const defaults = [
      { provider: "gemini", name: "gemini-1.5-flash", description: "Fast, cost-efficient multimodal model" },
      { provider: "gemini", name: "gemini-1.5-pro", description: "High intelligence for complex tasks" },
      { provider: "gemini", name: "gemini-2.0-flash-exp", description: "Next generation experimental model" },
      { provider: "perplexity", name: "sonar", description: "Optimized for online search and chat" },
      { provider: "perplexity", name: "sonar-pro", description: "Advanced reasoning and search" }
    ];
    for (const def of defaults) {
      await import_supported_model.SupportedModel.findOrCreate({
        where: { provider: def.provider, name: def.name },
        defaults: { ...def, is_enabled: true }
      });
    }
  }
  /**
   * Get user configurations (without decrypted keys)
   */
  static async getUserConfigs(userId) {
    const configs = await import_user_config.UserAIConfig.findAll({
      where: { user_id: userId },
      attributes: ["id", "provider", "model", "is_default", "created_at", "encrypted_api_key"],
      raw: true,
      nest: true
    });
    return configs.map((c) => {
      const hasValues = c.encrypted_api_key !== null && c.encrypted_api_key !== void 0 && c.encrypted_api_key !== "";
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
  static async setUserConfig(userId, dto) {
    const { provider, model, apiKey, isDefault } = dto;
    console.log(provider, model, apiKey, isDefault);
    const supported = await import_supported_model.SupportedModel.findOne({ where: { provider, name: model, is_enabled: true } });
    if (!supported) {
      throw new Error(`Model ${provider}/${model} is not supported`);
    }
    let encryptedKey = null;
    if (apiKey) {
      const isValid = await import_key_validation.ApiKeyValidationService.validate(provider, apiKey);
      if (!isValid) {
        throw new Error("Invalid API Key");
      }
      encryptedKey = import_encryption.EncryptionService.encrypt(apiKey);
    }
    if (isDefault) {
      await import_user_config.UserAIConfig.update({ is_default: false }, { where: { user_id: userId } });
    }
    const existing = await import_user_config.UserAIConfig.findOne({ where: { user_id: userId, provider, model } });
    let result;
    if (existing) {
      await existing.update({
        encrypted_api_key: encryptedKey ?? existing.encrypted_api_key,
        is_default: isDefault ?? existing.is_default
      });
      await existing.reload();
      result = existing;
    } else {
      result = await import_user_config.UserAIConfig.create({
        user_id: userId,
        provider,
        model,
        encrypted_api_key: encryptedKey,
        is_default: isDefault || false
      });
    }
    const encryptedApiKey = result.dataValues?.encrypted_api_key || result.encrypted_api_key;
    const hasValues = encryptedApiKey !== null && encryptedApiKey !== void 0 && encryptedApiKey !== "";
    console.log("[ModelManagement] Returning config with has_key:", hasValues, "encrypted_api_key length:", encryptedApiKey?.length);
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
  static async deleteUserConfig(userId, provider, model) {
    const config = await import_user_config.UserAIConfig.findOne({ where: { user_id: userId, provider, model } });
    if (!config)
      throw new Error("Configuration not found");
    await config.destroy();
  }
  /**
   * Resolve Provider, Model, and API Key for execution
   */
  static async resolveModelConfig(userId, requestedProvider, requestedModel, forceSystemKey) {
    console.log(`[ModelManagement] Resolving config for userId: ${userId}, provider: ${requestedProvider}, model: ${requestedModel}, forceSystemKey: ${forceSystemKey}`);
    let provider = requestedProvider || "";
    let model = requestedModel || "";
    let config = null;
    if (!provider || !model) {
      console.log("[ModelManagement] No provider/model specified, looking for user default...");
      const userDefault = await import_user_config.UserAIConfig.findOne({ where: { user_id: userId, is_default: true }, raw: true, nest: true });
      if (userDefault) {
        provider = userDefault.provider;
        model = userDefault.model;
        config = userDefault;
        console.log(`[ModelManagement] Found user default: ${provider}/${model}, has_key: ${!!userDefault.encrypted_api_key}`);
      } else {
        provider = DEFAULT_PROVIDER;
        model = DEFAULT_MODEL;
        console.log(`[ModelManagement] No user default found, using system default: ${provider}/${model}`);
      }
    } else {
      console.log(`[ModelManagement] Looking for specific config: ${provider}/${model}`);
      config = await import_user_config.UserAIConfig.findOne({ where: { user_id: userId, provider, model }, raw: true, nest: true });
      if (config) {
        console.log(`[ModelManagement] Found config for ${provider}/${model}, has_key: ${!!config.encrypted_api_key}`);
      } else {
        console.log(`[ModelManagement] No config found for ${provider}/${model}`);
      }
    }
    let apiKey = "";
    let isUserKey = false;
    if (config && config.encrypted_api_key && !forceSystemKey) {
      apiKey = import_encryption.EncryptionService.decrypt(config.encrypted_api_key);
      isUserKey = true;
      console.log(`[ModelManagement] Using USER key for ${provider}/${model}`);
    } else {
      apiKey = this.getSystemKey(provider);
      isUserKey = false;
      console.log(`[ModelManagement] Using SYSTEM key for ${provider}/${model}`);
    }
    if (!apiKey) {
      throw new Error(`No API key available for ${provider}`);
    }
    return {
      provider,
      model,
      apiKey,
      isUserKey
    };
  }
  static getSystemKey(provider) {
    switch (provider) {
      case "gemini":
        return process.env.GEMINI_API_KEY || "";
      case "perplexity":
        return process.env.PERPLEXITY_API_KEY || "";
      default:
        return "";
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ModelManagementService
});
//# sourceMappingURL=model-management.service.js.map
