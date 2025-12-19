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
var canvas_routes_exports = {};
__export(canvas_routes_exports, {
  default: () => canvas_routes_default
});
module.exports = __toCommonJS(canvas_routes_exports);
var import_express = require("express");
var canvasController = __toESM(require("./canvas.controller"));
var import_authMiddleware = require("../../common/middlewares/auth/authMiddleware");
var import_canvas = require("./canvas.model");
var import_validator = require("../../common/middlewares/validator");
const router = (0, import_express.Router)();
router.use(import_authMiddleware.authUser);
router.post("/", (0, import_validator.validateBody)(import_canvas.CreateCanvasSchema), canvasController.createCanvas);
router.get("/", (0, import_validator.validateQuery)(import_canvas.GetCanvasQuerySchema), canvasController.getAllCanvases);
router.get("/:uid", (0, import_validator.validateParams)(import_canvas.GetCanvasByUidParamsSchema), canvasController.getCanvas);
router.patch("/:id", (0, import_validator.validateParams)(import_canvas.CanvasIdParamsSchema), (0, import_validator.validateBody)(import_canvas.UpdateCanvasSchema), canvasController.updateCanvas);
router.delete("/:id", (0, import_validator.validateParams)(import_canvas.CanvasIdParamsSchema), canvasController.deleteCanvas);
var canvas_routes_default = router;
//# sourceMappingURL=canvas.routes.js.map
