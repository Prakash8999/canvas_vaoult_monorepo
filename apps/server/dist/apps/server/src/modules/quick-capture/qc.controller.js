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
var qc_controller_exports = {};
__export(qc_controller_exports, {
  createQuickCapture: () => createQuickCapture,
  deleteQuickCapture: () => deleteQuickCapture,
  getAllQuickCaptures: () => getAllQuickCaptures,
  getQuickCapture: () => getQuickCapture,
  updateQuickCapture: () => updateQuickCapture
});
module.exports = __toCommonJS(qc_controller_exports);
var import_responseHandler = require("../../common/middlewares/responseHandler");
var import_error = require("../../common/utils/error.parser");
var qcService = __toESM(require("./qc.service"));
const createQuickCapture = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      (0, import_responseHandler.errorHandler)(res, "Unauthorized", {}, 401);
      return;
    }
    const userId = req.user.userId;
    const note = await qcService.createQuickCaptureService(req.body, userId);
    (0, import_responseHandler.successHandler)(res, "Quick capture created successfully", note, 201);
  } catch (error) {
    console.error("Error creating quick capture:", error);
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to create quick capture", errorParser.message, errorParser.statusCode);
  }
};
const getAllQuickCaptures = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      ...req.query
    };
    const result = await qcService.getAllQuickCapturesService(userId, filters);
    const responseData = {
      quickCaptures: result.data,
      pagination: {
        total: result.meta.total_count,
        page: result.meta.page,
        limit: result.meta.limit,
        totalPages: result.meta.total_pages,
        hasMore: result.meta.page < result.meta.total_pages
      }
    };
    (0, import_responseHandler.successHandler)(res, "Quick captures fetched successfully", responseData, 200);
    return;
  } catch (error) {
    console.log("Error fetching quick captures:", error);
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to fetch quick captures", errorParser.message, errorParser.statusCode);
    return;
  }
};
const getQuickCapture = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const note = await qcService.getQuickCaptureByIdService(Number(id), userId);
    if (!note) {
      (0, import_responseHandler.errorHandler)(res, "Quick capture not found", {}, 404);
      return;
    }
    (0, import_responseHandler.successHandler)(res, "Quick capture fetched successfully", note, 200);
    return;
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to fetch quick capture", errorParser.message, errorParser.statusCode);
    return;
  }
};
const updateQuickCapture = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    console.log("Updating quick capture body:", req.body);
    const note = await qcService.updateQuickCaptureService(Number(id), req.body, userId);
    if (!note) {
      (0, import_responseHandler.errorHandler)(res, "Quick capture not found", {}, 404);
      return;
    }
    (0, import_responseHandler.successHandler)(res, "Quick capture updated successfully", note, 200);
    return;
  } catch (error) {
    console.error("Error updating quick capture:", error);
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to update quick capture", errorParser.message, errorParser.statusCode);
    return;
  }
};
const deleteQuickCapture = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const deleted = await qcService.deleteQuickCaptureService(Number(id), userId);
    if (!deleted) {
      (0, import_responseHandler.errorHandler)(res, "Quick capture not found", {}, 404);
      return;
    }
    (0, import_responseHandler.successHandler)(res, "Quick capture deleted successfully", { deletedId: Number(id) }, 200);
    return;
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to delete quick capture", errorParser.message, errorParser.statusCode);
    return;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createQuickCapture,
  deleteQuickCapture,
  getAllQuickCaptures,
  getQuickCapture,
  updateQuickCapture
});
//# sourceMappingURL=qc.controller.js.map
