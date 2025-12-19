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
var docs_exports = {};
__export(docs_exports, {
  combinedOpenApiDoc: () => combinedOpenApiDoc
});
module.exports = __toCommonJS(docs_exports);
var import_user = require("../../modules/users/user.docs");
var import_asset = require("../../modules/assets/asset.docs");
var import_notes = require("../../modules/notes/notes.docs");
const combinedPaths = {
  ...import_user.userOpenApiDoc.paths,
  ...import_asset.assetOpenApiDoc.paths,
  ...import_notes.notesOpenApiDoc.paths
};
const combinedComponents = {
  schemas: {
    ...import_user.userOpenApiDoc.components?.schemas,
    ...import_asset.assetOpenApiDoc.components?.schemas,
    ...import_notes.notesOpenApiDoc.components?.schemas
  },
  securitySchemes: {
    ...import_user.userOpenApiDoc.components?.securitySchemes,
    ...import_asset.assetOpenApiDoc.components?.securitySchemes,
    ...import_notes.notesOpenApiDoc.components?.securitySchemes
  }
};
const combinedOpenApiDoc = {
  openapi: "3.0.0",
  info: {
    title: "CanvasVault API",
    version: "1.0.0",
    description: "Combined API documentation for User, Asset, and Notes services"
  },
  servers: [{ url: "http://localhost:3000" }],
  paths: combinedPaths,
  components: combinedComponents,
  tags: [
    { name: "User", description: "User management operations" },
    { name: "Assets", description: "File upload and management operations" },
    { name: "Notes", description: "Note management and sync operations" }
  ]
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  combinedOpenApiDoc
});
//# sourceMappingURL=index.js.map
