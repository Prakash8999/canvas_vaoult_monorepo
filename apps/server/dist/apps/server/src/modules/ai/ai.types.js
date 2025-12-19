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
var ai_types_exports = {};
__export(ai_types_exports, {
  AIProviderError: () => AIProviderError,
  AIRequestSchema: () => AIRequestSchema,
  AI_CONSTRAINTS: () => AI_CONSTRAINTS,
  InsufficientCreditsError: () => InsufficientCreditsError,
  InvalidInputError: () => InvalidInputError,
  PROVIDER_MODELS: () => PROVIDER_MODELS
});
module.exports = __toCommonJS(ai_types_exports);
var import_zod = require("zod");
const PROVIDER_MODELS = {
  gemini: ["gemini-2.0-flash-exp", "gemini-exp-1206", "gemini-3-pro-preview"],
  perplexity: ["sonar", "sonar-pro"]
};
const AI_CONSTRAINTS = {
  MAX_INPUT_LENGTH: 300,
  // Maximum characters allowed in input
  MAX_TOKEN_ESTIMATE: 200,
  // Approximate token limit
  CREDIT_COST_PER_REQUEST: 1,
  // Credits consumed per request
  DEFAULT_USER_CREDITS: 10
  // Starting credits for new users
};
const AIRequestSchema = import_zod.z.object({
  provider: import_zod.z.enum(["gemini", "perplexity"]),
  model: import_zod.z.string().min(1),
  input: import_zod.z.string().min(1, "Input cannot be empty").max(AI_CONSTRAINTS.MAX_INPUT_LENGTH, `Input must not exceed ${AI_CONSTRAINTS.MAX_INPUT_LENGTH} characters`),
  options: import_zod.z.object({
    temperature: import_zod.z.number().min(0).max(2).optional(),
    maxTokens: import_zod.z.number().int().positive().optional()
  }).optional()
});
class AIProviderError extends Error {
  constructor(message, provider, statusCode = 500) {
    super(message);
    this.provider = provider;
    this.statusCode = statusCode;
    this.name = "AIProviderError";
  }
}
class InsufficientCreditsError extends Error {
  constructor(required, available) {
    super(`Insufficient AI credits. Required: ${required}, Available: ${available}`);
    this.required = required;
    this.available = available;
    this.name = "InsufficientCreditsError";
  }
}
class InvalidInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidInputError";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AIProviderError,
  AIRequestSchema,
  AI_CONSTRAINTS,
  InsufficientCreditsError,
  InvalidInputError,
  PROVIDER_MODELS
});
//# sourceMappingURL=ai.types.js.map
