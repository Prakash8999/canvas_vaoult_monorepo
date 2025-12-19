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
var modules_exports = {};
__export(modules_exports, {
  ImageAssets: () => import_asset2.default,
  Note: () => import_notes2.Note,
  User: () => import_users2.User
});
module.exports = __toCommonJS(modules_exports);
var import_notes = require("./notes/notes.model");
var import_syncEventLog = require("./notes/syncEventLog.model");
var import_users = require("./users/users.model");
var import_asset = require("./assets/asset.model");
var import_notes2 = require("./notes/notes.model");
var import_users2 = require("./users/users.model");
var import_asset2 = __toESM(require("./assets/asset.model"));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImageAssets,
  Note,
  User
});
//# sourceMappingURL=index.js.map
