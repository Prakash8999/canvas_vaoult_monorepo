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
var responseStructure_exports = {};
__export(responseStructure_exports, {
  error: () => error,
  success: () => success,
  validation: () => validation
});
module.exports = __toCommonJS(responseStructure_exports);
const success = (message, results, statusCode, meta) => {
  return {
    status: "success",
    code: statusCode,
    error: false,
    meta,
    data: results || [],
    message,
    assetsBaseUrl: process.env.r2_base_url
  };
};
const error = (message, statusCode, err) => {
  const codes = [200, 201, 400, 401, 404, 403, 409, 422, 500];
  const findCode = codes.includes(statusCode) ? statusCode : 500;
  return {
    status: "failed",
    code: findCode,
    error: true,
    data: err || [],
    message
  };
};
const validation = (errors) => {
  return {
    code: 422,
    error: true,
    data: errors || [],
    message: "Validation errors"
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  error,
  success,
  validation
});
//# sourceMappingURL=responseStructure.js.map
