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
var user_route_exports = {};
__export(user_route_exports, {
  default: () => user_route_default
});
module.exports = __toCommonJS(user_route_exports);
var import_express = require("express");
var userController = __toESM(require("./user.controller"));
var import_authMiddleware = require("../../common/middlewares/auth/authMiddleware");
const router = (0, import_express.Router)();
router.post("/signup", userController.addUser);
router.post("/verify-otp", userController.verifyOtp);
router.post("/login", userController.loginUser);
router.post("/forgot-password-otp", userController.forgotPasswordOtp);
router.post("/forgot-password-link", userController.forgotPasswordLink);
router.post("/reset-password-otp", userController.resetPasswordWithOtp);
router.post("/reset-password-token", userController.resetPasswordWithToken);
router.get("/", import_authMiddleware.authUser, userController.getUserProfile);
router.patch("/", import_authMiddleware.authUser, userController.updateUserProfile);
router.delete("/", import_authMiddleware.authUser, userController.blockUser);
router.post("/logout", import_authMiddleware.authUser, userController.logoutController);
router.post("/refresh-token", userController.refreshTokenController);
var user_route_default = router;
//# sourceMappingURL=user.route.js.map
