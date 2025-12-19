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
var canvas_controller_exports = {};
__export(canvas_controller_exports, {
  createCanvas: () => createCanvas,
  deleteCanvas: () => deleteCanvas,
  getAllCanvases: () => getAllCanvases,
  getCanvas: () => getCanvas,
  updateCanvas: () => updateCanvas
});
module.exports = __toCommonJS(canvas_controller_exports);
var import_responseHandler = require("../../common/middlewares/responseHandler");
var import_error = require("../../common/utils/error.parser");
var canvasService = __toESM(require("./canvas.service"));
const createCanvas = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      (0, import_responseHandler.errorHandler)(res, "Unauthorized", {}, 401);
      return;
    }
    const userId = req.user.userId;
    const canvas = await canvasService.createCanvasService(req.body, userId);
    (0, import_responseHandler.successHandler)(res, "Canvas created successfully", canvas, 201);
  } catch (error) {
    console.error("Error creating canvas:", error);
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to create canvas", errorParser.message, errorParser.statusCode);
  }
};
const getAllCanvases = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      ...req.query
    };
    const result = await canvasService.getAllCanvasesService(userId, filters);
    const responseData = {
      canvases: result.data,
      pagination: {
        total: result.meta.total_count,
        page: result.meta.page,
        limit: result.meta.limit,
        totalPages: result.meta.total_pages,
        hasMore: result.meta.page < result.meta.total_pages
      }
    };
    return (0, import_responseHandler.successHandler)(res, "Canvases fetched successfully", responseData, 200);
  } catch (error) {
    console.log("Error fetching canvases:", error);
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(res, "Failed to fetch canvases", errorParser.message, errorParser.statusCode);
  }
};
const getCanvas = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { uid } = req.params;
    console.log("Fetching canvas with uid:", uid, "for userId:", userId);
    const canvas = await canvasService.getCanvasByUidService(uid, userId);
    if (!canvas) {
      return (0, import_responseHandler.errorHandler)(res, "Canvas not found", {}, 404);
    }
    return (0, import_responseHandler.successHandler)(res, "Canvas fetched successfully", {
      id: canvas.id,
      canvas_uid: canvas.canvas_uid,
      title: canvas.title,
      userId: canvas.user_id,
      note_id: canvas.note_id,
      canvas_data: canvas.canvas_data,
      document_data: canvas.document_data,
      viewport: canvas.viewport,
      pinned: canvas.pinned,
      created_at: canvas.created_at,
      updated_at: canvas.updated_at,
      note: canvas.note || null
    }, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(res, "Failed to fetch canvas", errorParser.message, errorParser.statusCode);
  }
};
const updateCanvas = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    console.log("Updating canvas body:", req.body);
    const canvas = await canvasService.updateCanvasService(Number(id), req.body, userId);
    if (!canvas) {
      return (0, import_responseHandler.errorHandler)(res, "Canvas not found", {}, 404);
    }
    return (0, import_responseHandler.successHandler)(res, "Canvas updated successfully", {
      // id: canvas.id,
      // canvas_uid: canvas.canvas_uid,
      // title: canvas.title,
      // note_id: canvas.note_id,
      // canvas_data: canvas.canvas_data,
      // document_data: canvas.document_data,
      // viewport: canvas.viewport,
      // pinned: canvas.pinned,
      // created_at: canvas.created_at,
      // updated_at: canvas.updated_at,
      // note: canvas.note || null,
    }, 200);
  } catch (error) {
    console.error("Error updating canvas:", error);
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(res, "Failed to update canvas", errorParser.message, errorParser.statusCode);
  }
};
const deleteCanvas = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const deleted = await canvasService.deleteCanvasService(Number(id), userId);
    if (!deleted) {
      return (0, import_responseHandler.errorHandler)(res, "Canvas not found", {}, 404);
    }
    return (0, import_responseHandler.successHandler)(res, "Canvas deleted successfully", { deletedId: Number(id) }, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    return (0, import_responseHandler.errorHandler)(res, "Failed to delete canvas", errorParser.message, errorParser.statusCode);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCanvas,
  deleteCanvas,
  getAllCanvases,
  getCanvas,
  updateCanvas
});
//# sourceMappingURL=canvas.controller.js.map
