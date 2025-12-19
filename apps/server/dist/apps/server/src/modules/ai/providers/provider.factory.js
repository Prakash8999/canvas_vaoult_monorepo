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
var provider_factory_exports = {};
__export(provider_factory_exports, {
  AIProviderFactory: () => AIProviderFactory
});
module.exports = __toCommonJS(provider_factory_exports);
var import_ai = require("../ai.types");
var import_gemini = require("./gemini.provider");
var import_perplexity = require("./perplexity.provider");
class AIProviderFactory {
  static providers = /* @__PURE__ */ new Map([
    ["gemini", new import_gemini.GeminiProvider()],
    ["perplexity", new import_perplexity.PerplexityProvider()]
  ]);
  /**
   * Get provider instance by name
   * @param providerName - Name of the provider to retrieve
   * @returns Provider instance
   * @throws AIProviderError if provider is not supported
   */
  static getProvider(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new import_ai.AIProviderError(
        `Provider "${providerName}" is not supported. Available providers: ${Array.from(this.providers.keys()).join(", ")}`,
        providerName,
        400
      );
    }
    return provider;
  }
  /**
   * Check if a provider is supported
   * @param providerName - Provider name to check
   */
  static isProviderSupported(providerName) {
    return this.providers.has(providerName);
  }
  /**
   * Get list of all supported providers
   */
  static getSupportedProviders() {
    return Array.from(this.providers.keys());
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AIProviderFactory
});
//# sourceMappingURL=provider.factory.js.map
