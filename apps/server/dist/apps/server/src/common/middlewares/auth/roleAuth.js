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
var roleAuth_exports = {};
__export(roleAuth_exports, {
  requireAdmin: () => requireAdmin,
  requireEmailVerified: () => requireEmailVerified,
  requireRole: () => requireRole
});
module.exports = __toCommonJS(roleAuth_exports);
var import_responseHandler = require("../responseHandler");
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      (0, import_responseHandler.errorHandler)(res, "Authentication required", {}, 401);
      return;
    }
    if (allowedRoles.length === 0) {
      next();
      return;
    }
    next();
  };
};
const requireAdmin = requireRole(["admin"]);
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    (0, import_responseHandler.errorHandler)(res, "Authentication required", {}, 401);
    return;
  }
  if (!req.user.isEmailVerified) {
    (0, import_responseHandler.errorHandler)(res, "Email verification required", {}, 403);
    return;
  }
  next();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  requireAdmin,
  requireEmailVerified,
  requireRole
});
//# sourceMappingURL=roleAuth.js.map
