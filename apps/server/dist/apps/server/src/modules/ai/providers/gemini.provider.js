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
var gemini_provider_exports = {};
__export(gemini_provider_exports, {
  GeminiProvider: () => GeminiProvider
});
module.exports = __toCommonJS(gemini_provider_exports);
var import_genai = require("@google/genai");
var import_ai = require("../ai.types");
class GeminiProvider {
  name = "gemini";
  /**
   * Generate AI response using Gemini
   */
  async generateResponse(input, model, apiKey, options) {
    try {
      if (!this.isModelSupported(model)) {
        throw new import_ai.AIProviderError(
          `Model "${model}" is not supported by Gemini. Supported models: ${import_ai.PROVIDER_MODELS.gemini.join(", ")}`,
          "gemini",
          400
        );
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: input }]
          }
        ],
        config: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens
        }
      });
      const content = response.text || "";
      if (!content) {
        throw new import_ai.AIProviderError(
          "Gemini returned an empty response",
          "gemini",
          500
        );
      }
      return {
        content,
        provider: "gemini",
        model,
        tokensUsed: response.usageMetadata?.totalTokenCount,
        metadata: {
          candidateCount: response.candidates?.length,
          finishReason: response.candidates?.[0]?.finishReason
        }
      };
    } catch (error) {
      if (error instanceof import_ai.AIProviderError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new import_ai.AIProviderError(
        `Gemini API error: ${errorMessage}`,
        "gemini",
        500
      );
    }
  }
  /**
   * Check if model is supported by Gemini
   */
  isModelSupported(model) {
    return import_ai.PROVIDER_MODELS.gemini.includes(model);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GeminiProvider
});
//# sourceMappingURL=gemini.provider.js.map
