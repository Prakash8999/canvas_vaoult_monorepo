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
var responseHandler_exports = {};
__export(responseHandler_exports, {
  errorHandler: () => errorHandler,
  successHandler: () => successHandler
});
module.exports = __toCommonJS(responseHandler_exports);
var import_responseStructure = require("../utils/responseStructure");
const successHandler = (res, message, results, statusCode, meta) => {
  return res.status(statusCode).json((0, import_responseStructure.success)(message, results, statusCode, meta));
};
const errorHandler = (res, message, err, statusCode) => {
  return res.status(statusCode).json((0, import_responseStructure.error)(message, statusCode, err));
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  errorHandler,
  successHandler
});
//# sourceMappingURL=responseHandler.js.map
