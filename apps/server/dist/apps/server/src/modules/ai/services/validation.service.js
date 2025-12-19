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
var validation_service_exports = {};
__export(validation_service_exports, {
  InputValidationService: () => InputValidationService
});
module.exports = __toCommonJS(validation_service_exports);
var import_ai = require("../ai.types");
class InputValidationService {
  /**
   * Validate AI request
   * @param request - Request object to validate
   * @throws InvalidInputError if validation fails
   */
  static validateRequest(request) {
    const result = import_ai.AIRequestSchema.safeParse(request);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(", ");
      throw new import_ai.InvalidInputError(`Validation failed: ${errors}`);
    }
    const { provider, model, input } = result.data;
    this.validateInputLength(input);
    this.validateProviderModel(provider, model);
  }
  /**
   * Validate input length
   * @param input - Input text to validate
   * @throws InvalidInputError if input exceeds limits
   */
  static validateInputLength(input) {
    if (input.length > import_ai.AI_CONSTRAINTS.MAX_INPUT_LENGTH) {
      throw new import_ai.InvalidInputError(
        `Input exceeds maximum length of ${import_ai.AI_CONSTRAINTS.MAX_INPUT_LENGTH} characters. Current length: ${input.length}`
      );
    }
    const estimatedTokens = Math.ceil(input.length / 4);
    if (estimatedTokens > import_ai.AI_CONSTRAINTS.MAX_TOKEN_ESTIMATE) {
      throw new import_ai.InvalidInputError(
        `Input exceeds estimated token limit of ${import_ai.AI_CONSTRAINTS.MAX_TOKEN_ESTIMATE} tokens. Estimated: ${estimatedTokens}`
      );
    }
  }
  /**
   * Validate provider and model combination
   * @param provider - Provider name
   * @param model - Model name
   * @throws InvalidInputError if combination is invalid
   */
  static validateProviderModel(provider, model) {
    const supportedModels = import_ai.PROVIDER_MODELS[provider];
    if (!supportedModels) {
      throw new import_ai.InvalidInputError(
        `Invalid provider: ${provider}. Supported providers: ${Object.keys(import_ai.PROVIDER_MODELS).join(", ")}`
      );
    }
    if (!supportedModels.includes(model)) {
      throw new import_ai.InvalidInputError(
        `Model "${model}" is not supported for provider "${provider}". Supported models: ${supportedModels.join(", ")}`
      );
    }
  }
  /**
   * Get validation constraints
   * Useful for frontend to display limits
   */
  static getConstraints() {
    return {
      maxInputLength: import_ai.AI_CONSTRAINTS.MAX_INPUT_LENGTH,
      maxTokenEstimate: import_ai.AI_CONSTRAINTS.MAX_TOKEN_ESTIMATE,
      creditCostPerRequest: import_ai.AI_CONSTRAINTS.CREDIT_COST_PER_REQUEST,
      supportedProviders: Object.keys(import_ai.PROVIDER_MODELS),
      supportedModels: import_ai.PROVIDER_MODELS
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InputValidationService
});
//# sourceMappingURL=validation.service.js.map
