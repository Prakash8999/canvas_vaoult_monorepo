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
var byok_controller_exports = {};
__export(byok_controller_exports, {
  BYOKController: () => BYOKController
});
module.exports = __toCommonJS(byok_controller_exports);
var import_model_management = require("./model-management.service");
var import_zod = require("zod");
var import_responseHandler = require("../../../common/middlewares/responseHandler");
var import_error = require("../../../common/utils/error.parser");
const SetConfigSchema = import_zod.z.object({
  provider: import_zod.z.string(),
  model: import_zod.z.string(),
  apiKey: import_zod.z.string().optional(),
  isDefault: import_zod.z.boolean().optional()
});
class BYOKController {
  /**
   * Get all supported models
   */
  static async getSupportedModels(req, res) {
    try {
      const models = await import_model_management.ModelManagementService.getSupportedModels();
      return (0, import_responseHandler.successHandler)(res, "Supported models fetched successfully", models, 200);
    } catch (error) {
      console.error("Error fetching supported models:", error);
      const errorParser = (0, import_error.parseError)(error);
      return (0, import_responseHandler.errorHandler)(res, "Failed to fetch supported models", errorParser.message, errorParser.statusCode);
    }
  }
  /**
   * Get user's model configurations
   */
  static async getUserConfigs(req, res) {
    try {
      const userId = req.user.userId;
      const configs = await import_model_management.ModelManagementService.getUserConfigs(userId);
      return (0, import_responseHandler.successHandler)(res, "User configurations fetched successfully", configs, 200);
    } catch (error) {
      console.error("Error fetching user configs:", error);
      const errorParser = (0, import_error.parseError)(error);
      return (0, import_responseHandler.errorHandler)(res, "Failed to fetch user configurations", errorParser.message, errorParser.statusCode);
    }
  }
  /**
   * Set or update a user model configuration
   */
  static async setUserConfig(req, res) {
    try {
      const userId = req.user.userId;
      const validated = SetConfigSchema.parse(req.body);
      const config = await import_model_management.ModelManagementService.setUserConfig(userId, validated);
      return (0, import_responseHandler.successHandler)(res, "Configuration saved successfully", config, 200);
    } catch (error) {
      console.error("Error setting user config:", error);
      const errorParser = (0, import_error.parseError)(error);
      return (0, import_responseHandler.errorHandler)(res, "Failed to save configuration", errorParser.message, errorParser.statusCode);
    }
  }
  /**
   * Delete a user model configuration
   */
  static async deleteUserConfig(req, res) {
    try {
      const userId = req.user.userId;
      const { provider, model } = req.body;
      if (!provider || !model) {
        return (0, import_responseHandler.errorHandler)(res, "Provider and model are required", {}, 400);
      }
      await import_model_management.ModelManagementService.deleteUserConfig(userId, provider, model);
      return (0, import_responseHandler.successHandler)(res, "Configuration deleted successfully", { provider, model }, 200);
    } catch (error) {
      console.error("Error deleting user config:", error);
      const errorParser = (0, import_error.parseError)(error);
      return (0, import_responseHandler.errorHandler)(res, "Failed to delete configuration", errorParser.message, errorParser.statusCode);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BYOKController
});
//# sourceMappingURL=byok.controller.js.map
