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
var validator_exports = {};
__export(validator_exports, {
  validateBody: () => validateBody,
  validateParams: () => validateParams,
  validateQuery: () => validateQuery
});
module.exports = __toCommonJS(validator_exports);
var import_responseHandler = require("./responseHandler");
function validateRequestPart(schema, part) {
  return (req, res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      (0, import_responseHandler.errorHandler)(res, "Validation failed", formattedErrors, 400);
      return;
    }
    req[part] = result.data;
    next();
  };
}
function formatZodErrors(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message
  }));
}
function validateBody(schema) {
  return validateRequestPart(schema, "body");
}
function validateParams(schema) {
  return validateRequestPart(schema, "params");
}
function validateQuery(schema) {
  return validateRequestPart(schema, "query");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validateBody,
  validateParams,
  validateQuery
});
//# sourceMappingURL=validator.js.map
