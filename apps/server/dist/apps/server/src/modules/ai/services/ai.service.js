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
var ai_service_exports = {};
__export(ai_service_exports, {
  AIService: () => AIService
});
module.exports = __toCommonJS(ai_service_exports);
var import_provider = require("../providers/provider.factory");
var import_credits = require("./credits.service");
var import_validation = require("./validation.service");
var import_model_management = require("../byok/model-management.service");
var import_ai = require("../ai.types");
class AIService {
  /**
   * Execute AI request
   * @param userId - User ID making the request
   * @param request - AI request details
   * @param forceSystemKey - If true, use system key even if user has custom key
   * @returns AI response with credit information
   */
  static async executeRequest(userId, request, forceSystemKey) {
    import_validation.InputValidationService.validateRequest(request);
    const resolvedConfig = await import_model_management.ModelManagementService.resolveModelConfig(
      userId,
      request.provider,
      request.model,
      forceSystemKey
    );
    const { apiKey, isUserKey } = resolvedConfig;
    if (!isUserKey) {
      const hasCredits = await import_credits.AICreditsService.hasCredits(
        userId,
        import_ai.AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST
      );
      if (!hasCredits) {
        const available = await import_credits.AICreditsService.getUserCredits(userId);
        throw new import_ai.InsufficientCreditsError(
          import_ai.AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST,
          available
        );
      }
    }
    const provider = import_provider.AIProviderFactory.getProvider(resolvedConfig.provider);
    let aiResponse;
    try {
      aiResponse = await provider.generateResponse(
        request.input,
        request.model,
        // Use detailed model from request or resolved? Request has 'model'
        apiKey,
        request.options
      );
    } catch (error) {
      if (error instanceof import_ai.AIProviderError) {
        throw error;
      }
      throw new import_ai.AIProviderError(
        `AI request failed: ${error instanceof Error ? error.message : "Unknown error"} `,
        request.provider,
        500
      );
    }
    let remainingCredits = await import_credits.AICreditsService.getUserCredits(userId);
    let creditsUsed = 0;
    console.log(`[AI Service] isUserKey: ${isUserKey}, Current Credits: ${remainingCredits}`);
    if (!isUserKey) {
      remainingCredits = await import_credits.AICreditsService.deductCredits(
        userId,
        import_ai.AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST
      );
      creditsUsed = import_ai.AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST;
      console.log(`[AI Service] Credits deducted. New balance: ${remainingCredits}, Used: ${creditsUsed}`);
    } else {
      console.log(`[AI Service] Using custom key - NO credits deducted`);
    }
    return {
      ...aiResponse,
      remainingCredits,
      creditsUsed,
      usingCustomKey: isUserKey
      // Explicitly indicate if BYOK was used
    };
  }
  /**
   * Get user's remaining credits
   * @param userId - User ID
   * @returns Remaining credits
   */
  static async getRemainingCredits(userId) {
    return import_credits.AICreditsService.getUserCredits(userId);
  }
  /**
   * Get AI constraints and supported providers/models
   * Useful for frontend to display available options
   */
  static getConstraints() {
    return import_validation.InputValidationService.getConstraints();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AIService
});
//# sourceMappingURL=ai.service.js.map
