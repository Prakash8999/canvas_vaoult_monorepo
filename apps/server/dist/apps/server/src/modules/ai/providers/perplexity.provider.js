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
var perplexity_provider_exports = {};
__export(perplexity_provider_exports, {
  PerplexityProvider: () => PerplexityProvider
});
module.exports = __toCommonJS(perplexity_provider_exports);
var import_perplexity_ai = __toESM(require("@perplexity-ai/perplexity_ai"));
var import_ai = require("../ai.types");
class PerplexityProvider {
  name = "perplexity";
  /**
   * Generate AI response using Perplexity
   */
  async generateResponse(input, model, apiKey, options) {
    try {
      if (!this.isModelSupported(model)) {
        throw new import_ai.AIProviderError(
          `Model "${model}" is not supported by Perplexity. Supported models: ${import_ai.PROVIDER_MODELS.perplexity.join(", ")}`,
          "perplexity",
          400
        );
      }
      const client = new import_perplexity_ai.default({ apiKey });
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides concise, accurate answers."
          },
          {
            role: "user",
            content: input
          }
        ],
        temperature: options?.temperature,
        max_tokens: options?.maxTokens
      });
      const rawContent = completion.choices?.[0]?.message?.content;
      let content;
      if (typeof rawContent === "string") {
        content = rawContent;
      } else if (Array.isArray(rawContent)) {
        content = rawContent.filter((chunk) => chunk.type === "text").map((chunk) => chunk.text || "").join("");
      } else {
        content = "";
      }
      if (!content) {
        throw new import_ai.AIProviderError(
          "Perplexity returned an empty response",
          "perplexity",
          500
        );
      }
      const cleanContent = this.stripCitations(content);
      return {
        content: cleanContent,
        provider: "perplexity",
        model,
        tokensUsed: completion.usage?.total_tokens,
        metadata: {
          finishReason: completion.choices?.[0]?.finish_reason,
          citations: completion.citations
        }
      };
    } catch (error) {
      if (error instanceof import_ai.AIProviderError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new import_ai.AIProviderError(
        `Perplexity API error: ${errorMessage}`,
        "perplexity",
        500
      );
    }
  }
  /**
   * Strip citation markers from Perplexity responses
   * Removes patterns like [1], [2], [3], [1][2], etc.
   * @param text - Text with citation markers
   * @returns Clean text without citations
   */
  stripCitations(text) {
    return text.replace(/\[\d+\](\[\d+\])*/g, "").trim();
  }
  /**
   * Check if model is supported by Perplexity
   */
  isModelSupported(model) {
    return import_ai.PROVIDER_MODELS.perplexity.includes(model);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PerplexityProvider
});
//# sourceMappingURL=perplexity.provider.js.map
