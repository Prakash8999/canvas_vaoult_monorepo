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
var credits_service_exports = {};
__export(credits_service_exports, {
  AICreditsService: () => AICreditsService
});
module.exports = __toCommonJS(credits_service_exports);
var import_users = __toESM(require("../../users/users.model"));
var import_ai = require("../ai.types");
class AICreditsService {
  /**
   * Get user's current AI credits
   * @param userId - User ID
   * @returns Current credit balance
   */
  static async getUserCredits(userId) {
    const user = await import_users.default.findByPk(userId, {
      attributes: ["ai_credits"]
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user.ai_credits;
  }
  /**
   * Check if user has sufficient credits
   * @param userId - User ID
   * @param required - Required credits
   * @returns True if user has enough credits
   */
  static async hasCredits(userId, required = 1) {
    const available = await this.getUserCredits(userId);
    return available >= required;
  }
  /**
   * Deduct credits from user account
   * Only deducts if user has sufficient credits
   * @param userId - User ID
   * @param amount - Amount to deduct
   * @returns New credit balance
   * @throws InsufficientCreditsError if user doesn't have enough credits
   */
  static async deductCredits(userId, amount = 1) {
    const user = await import_users.default.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.ai_credits < amount) {
      throw new import_ai.InsufficientCreditsError(amount, user.ai_credits);
    }
    user.ai_credits -= amount;
    await user.save();
    return user.ai_credits;
  }
  /**
   * Add credits to user account
   * @param userId - User ID
   * @param amount - Amount to add
   * @returns New credit balance
   */
  static async addCredits(userId, amount) {
    const user = await import_users.default.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.ai_credits += amount;
    await user.save();
    return user.ai_credits;
  }
  /**
   * Reset user credits to default value
   * @param userId - User ID
   * @param defaultAmount - Default credit amount
   * @returns New credit balance
   */
  static async resetCredits(userId, defaultAmount = 10) {
    const user = await import_users.default.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.ai_credits = defaultAmount;
    await user.save();
    return user.ai_credits;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AICreditsService
});
//# sourceMappingURL=credits.service.js.map
