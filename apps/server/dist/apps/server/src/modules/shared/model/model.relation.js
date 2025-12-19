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
var model_relation_exports = {};
__export(model_relation_exports, {
  Canvas: () => import_canvas.default,
  Note: () => import_notes.default,
  User: () => import_users.default,
  WikiLink: () => import_wikilink.default
});
module.exports = __toCommonJS(model_relation_exports);
var import_notes = __toESM(require("../../notes/notes.model"));
var import_wikilink = __toESM(require("../../notes/wikilink.model"));
var import_users = __toESM(require("../../users/users.model"));
var import_canvas = __toESM(require("../../canvas/canvas.model"));
import_users.default.hasMany(import_notes.default, { foreignKey: "user_id", as: "notes", constraints: true, onDelete: "CASCADE" });
import_notes.default.belongsTo(import_users.default, { foreignKey: "user_id", as: "owner", constraints: true, onDelete: "CASCADE" });
import_users.default.hasMany(import_wikilink.default, { foreignKey: "user_id", as: "wikilinks", constraints: true, onDelete: "CASCADE" });
import_wikilink.default.belongsTo(import_users.default, { foreignKey: "user_id", as: "owner", constraints: true, onDelete: "CASCADE" });
import_notes.default.hasMany(import_wikilink.default, { foreignKey: "parent_note_id", as: "child_wikilinks", constraints: true, onDelete: "CASCADE" });
import_notes.default.hasMany(import_wikilink.default, { foreignKey: "child_note_id", as: "parent_wikilinks", constraints: true, onDelete: "CASCADE" });
import_wikilink.default.belongsTo(import_notes.default, { foreignKey: "parent_note_id", as: "parent_note", constraints: true, onDelete: "CASCADE" });
import_wikilink.default.belongsTo(import_notes.default, { foreignKey: "child_note_id", as: "child_note", constraints: true, onDelete: "CASCADE" });
import_users.default.hasMany(import_canvas.default, { foreignKey: "user_id", as: "canvases", constraints: true, onDelete: "CASCADE" });
import_canvas.default.belongsTo(import_users.default, { foreignKey: "user_id", as: "owner", constraints: true, onDelete: "CASCADE" });
import_canvas.default.belongsTo(import_notes.default, { foreignKey: "note_id", as: "note", constraints: false, onDelete: "SET NULL" });
import_notes.default.hasOne(import_canvas.default, { foreignKey: "note_id", as: "canvas", constraints: false, onDelete: "SET NULL" });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Canvas,
  Note,
  User,
  WikiLink
});
//# sourceMappingURL=model.relation.js.map
