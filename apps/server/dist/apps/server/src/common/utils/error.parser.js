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
var error_parser_exports = {};
__export(error_parser_exports, {
  parseError: () => parseError
});
module.exports = __toCommonJS(error_parser_exports);
var import_zod = require("zod");
var import_sequelize = require("sequelize");
function parseError(err) {
  if (err instanceof import_zod.ZodError) {
    const message = err.issues?.[0]?.message || "Invalid input data";
    return { message, statusCode: 400 };
  }
  if (err instanceof import_sequelize.ValidationError) {
    const message = err.errors?.[0]?.message || "Database validation failed";
    return { message, statusCode: 400 };
  }
  if (err.statusCode && err.message) {
    return { message: err.message, statusCode: err.statusCode };
  }
  return { message: err.message || "Internal Server Error", statusCode: 500 };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseError
});
//# sourceMappingURL=error.parser.js.map
