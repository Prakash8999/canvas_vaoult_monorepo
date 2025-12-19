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
var ai_controller_exports = {};
__export(ai_controller_exports, {
  generateAIResponse: () => generateAIResponse,
  getConstraints: () => getConstraints,
  getCredits: () => getCredits
});
module.exports = __toCommonJS(ai_controller_exports);
var import_ai = require("./services/ai.service");
var import_responseHandler = require("../../common/middlewares/responseHandler");
var import_error = require("../../common/utils/error.parser");
var import_ai2 = require("./ai.types");
const generateAIResponse = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return (0, import_responseHandler.errorHandler)(res, "Unauthorized", {}, 401);
    }
    const userId = req.user.userId;
    const response = await import_ai.AIService.executeRequest(userId, req.body);
    return (0, import_responseHandler.successHandler)(
      res,
      "AI response generated successfully",
      response,
      200
    );
  } catch (error) {
    console.error("Error generating AI response:", error);
    if (error instanceof import_ai2.InsufficientCreditsError) {
      return (0, import_responseHandler.errorHandler)(
        res,
        "Insufficient AI credits",
        {
          required: error.required,
          available: error.available
        },
        402
        // Payment Required
      );
    }
    if (error instanceof import_ai2.InvalidInputError) {
      return (0, import_responseHandler.errorHandler)(res, error.message, {}, 400);
    }
    if (error instanceof import_ai2.AIProviderError) {
      return (0, import_responseHandler.errorHandler)(
        res,
        error.message,
        { provider: error.provider },
        error.statusCode
      );
    }
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(
      res,
      "Failed to generate AI response",
      errorParser.message,
      errorParser.statusCode
    );
  }
};
const getCredits = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return (0, import_responseHandler.errorHandler)(res, "Unauthorized", {}, 401);
    }
    const userId = req.user.userId;
    const credits = await import_ai.AIService.getRemainingCredits(userId);
    return (0, import_responseHandler.successHandler)(
      res,
      "Credits fetched successfully",
      { credits },
      200
    );
  } catch (error) {
    console.error("Error fetching credits:", error);
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(
      res,
      "Failed to fetch credits",
      errorParser.message,
      errorParser.statusCode
    );
  }
};
const getConstraints = async (req, res) => {
  try {
    const constraints = import_ai.AIService.getConstraints();
    return (0, import_responseHandler.successHandler)(
      res,
      "Constraints fetched successfully",
      constraints,
      200
    );
  } catch (error) {
    console.error("Error fetching constraints:", error);
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(
      res,
      "Failed to fetch constraints",
      errorParser.message,
      errorParser.statusCode
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateAIResponse,
  getConstraints,
  getCredits
});
//# sourceMappingURL=ai.controller.js.map
