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
var qc_routes_exports = {};
__export(qc_routes_exports, {
  default: () => qc_routes_default
});
module.exports = __toCommonJS(qc_routes_exports);
var import_express = require("express");
var qcController = __toESM(require("./qc.controller"));
var import_authMiddleware = require("../../common/middlewares/auth/authMiddleware");
var import_notes = require("../notes/notes.model");
var import_validator = require("../../common/middlewares/validator");
const router = (0, import_express.Router)();
router.use(import_authMiddleware.authUser);
router.post("/", (0, import_validator.validateBody)(import_notes.CreateNoteSchema), qcController.createQuickCapture);
router.get("/", (0, import_validator.validateQuery)(import_notes.GetNotesQuerySchema), qcController.getAllQuickCaptures);
router.get("/:id", (0, import_validator.validateParams)(import_notes.NoteIdParamsSchema), qcController.getQuickCapture);
router.patch("/:id", (0, import_validator.validateParams)(import_notes.NoteIdParamsSchema), (0, import_validator.validateBody)(import_notes.UpdateNoteSchema), qcController.updateQuickCapture);
router.delete("/:id", (0, import_validator.validateParams)(import_notes.NoteIdParamsSchema), qcController.deleteQuickCapture);
var qc_routes_default = router;
//# sourceMappingURL=qc.routes.js.map
