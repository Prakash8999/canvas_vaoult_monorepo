"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var key_validation_service_exports = {};
__export(key_validation_service_exports, {
  ApiKeyValidationService: () => ApiKeyValidationService
});
module.exports = __toCommonJS(key_validation_service_exports);
var import_axios = __toESM(require("axios"));
class ApiKeyValidationService {
  /**
   * Validates an API key for a specific provider without consuming significant resources.
   */
  static async validate(provider, apiKey) {
    try {
      switch (provider) {
        case "gemini":
          return await this.validateGemini(apiKey);
        case "perplexity":
          return await this.validatePerplexity(apiKey);
        default:
          return false;
      }
    } catch (error) {
      console.warn(`[ApiKeyValidation] Validation failed for ${provider}:`, error.message);
      if (error.response) {
        console.warn(`[ApiKeyValidation] Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }
  static async validateGemini(apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?page_size=1&key=${apiKey}`;
    const response = await import_axios.default.get(url);
    return response.status === 200;
  }
  static async validatePerplexity(apiKey) {
    const response = await import_axios.default.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.status === 200;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiKeyValidationService
});
//# sourceMappingURL=key-validation.service.js.map
