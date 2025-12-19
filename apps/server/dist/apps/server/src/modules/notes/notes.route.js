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
var notes_route_exports = {};
__export(notes_route_exports, {
  default: () => notes_route_default
});
module.exports = __toCommonJS(notes_route_exports);
var import_express = require("express");
var import_notes = require("./notes.controller");
var import_validator = require("../../common/middlewares/validator");
var import_notes2 = require("./notes.model");
var import_authMiddleware = require("../../common/middlewares/auth/authMiddleware");
const router = (0, import_express.Router)();
router.use(import_authMiddleware.authUser);
router.post("/", (0, import_validator.validateBody)(import_notes2.CreateNoteSchema), import_notes.createNote);
router.get("/notes", import_notes.getAllNotes);
router.get("/tags", import_notes.getAllTags);
router.get("/:uid", import_notes.getNote);
router.patch("/:id", (0, import_validator.validateBody)(import_notes2.UpdateNoteSchema), import_notes.updateNote);
router.delete("/:id", import_notes.deleteNote);
var notes_route_default = router;
//# sourceMappingURL=notes.route.js.map
