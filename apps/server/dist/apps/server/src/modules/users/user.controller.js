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
var user_controller_exports = {};
__export(user_controller_exports, {
  addUser: () => addUser,
  blockUser: () => blockUser,
  forgotPasswordLink: () => forgotPasswordLink,
  forgotPasswordOtp: () => forgotPasswordOtp,
  getUserProfile: () => getUserProfile,
  loginUser: () => loginUser,
  logoutController: () => logoutController,
  refreshTokenController: () => refreshTokenController,
  resetPasswordWithOtp: () => resetPasswordWithOtp,
  resetPasswordWithToken: () => resetPasswordWithToken,
  updateUserProfile: () => updateUserProfile,
  verifyOtp: () => verifyOtp
});
module.exports = __toCommonJS(user_controller_exports);
var import_users = __toESM(require("./users.model"));
var import_responseHandler = require("../../common/middlewares/responseHandler");
var import_error = require("../../common/utils/error.parser");
var userService = __toESM(require("./user.service"));
var import_authTokenService = require("../../common/utils/authTokenService");
var import_redis = __toESM(require("../../config/redis"));
var import_redisKey = require("../../common/utils/redisKey");
var import_uuid = require("uuid");
const addUser = async (req, res) => {
  try {
    const body = import_users.CreateUserSchema.parse(req.body);
    const { user, otp } = await userService.createUserService(body);
    (0, import_responseHandler.successHandler)(res, "User created successfully", { id: user.dataValues.id, otp }, 201);
  } catch (error) {
    console.log(error);
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to create user", errorParser.message, errorParser.statusCode);
  }
};
const verifyOtp = async (req, res) => {
  try {
    const body = import_users.UserOtpVerifySchema.parse(req.body);
    const { token } = await userService.verifyOtpService(body.email, body.otp, req, res);
    (0, import_responseHandler.successHandler)(res, "Email verified successfully", { token }, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to verify email", errorParser.message, errorParser.statusCode);
  }
};
const loginUser = async (req, res) => {
  try {
    console.log(req.body);
    const body = import_users.UserLoginSchema.parse(req.body);
    const { token } = await userService.loginUserService(body.email, body.password, req, res);
    (0, import_responseHandler.successHandler)(res, "Login successful", { token }, 200);
  } catch (error) {
    console.log(error);
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to login", errorParser.message, errorParser.statusCode);
  }
};
const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      (0, import_responseHandler.errorHandler)(res, "Unauthorized", {}, 401);
      return;
    }
    const userId = Number(req.user.userId);
    if (Number.isNaN(userId)) {
      (0, import_responseHandler.errorHandler)(res, "Invalid user id", {}, 400);
      return;
    }
    const user = await userService.getUserProfileService(userId);
    (0, import_responseHandler.successHandler)(res, "User profile fetched successfully", user, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to fetch user profile", errorParser.message, errorParser.statusCode);
  }
};
const updateUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      (0, import_responseHandler.errorHandler)(res, "Unauthorized", {}, 401);
      return;
    }
    const userId = Number(req.user.userId);
    if (Number.isNaN(userId)) {
      (0, import_responseHandler.errorHandler)(res, "Invalid user id", {}, 400);
      return;
    }
    const body = import_users.UpdateUserSchema.parse(req.body);
    await userService.updateUserProfileService(userId, body);
    (0, import_responseHandler.successHandler)(res, "User profile updated successfully", {}, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to update user profile", errorParser.message, errorParser.statusCode);
  }
};
const blockUser = async (req, res) => {
  try {
    if (!req.user) {
      (0, import_responseHandler.errorHandler)(res, "Unauthorized", {}, 401);
      return;
    }
    const userId = Number(req.user.userId);
    if (Number.isNaN(userId)) {
      (0, import_responseHandler.errorHandler)(res, "Invalid user id", {}, 400);
      return;
    }
    await userService.blockUserService(userId);
    (0, import_responseHandler.successHandler)(res, "User blocked successfully", {}, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to block user", errorParser.message, errorParser.statusCode);
  }
};
const forgotPasswordOtp = async (req, res) => {
  try {
    const body = import_users.ForgotPasswordSchema.parse(req.body);
    const result = await userService.forgotPasswordOtpService(body.email);
    (0, import_responseHandler.successHandler)(res, result.message, {}, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to send password reset OTP", errorParser.message, errorParser.statusCode);
  }
};
const forgotPasswordLink = async (req, res) => {
  try {
    const body = import_users.ForgotPasswordSchema.parse(req.body);
    const result = await userService.forgotPasswordLinkService(body.email);
    (0, import_responseHandler.successHandler)(res, result.message, {}, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to send password reset link", errorParser.message, errorParser.statusCode);
  }
};
const resetPasswordWithOtp = async (req, res) => {
  try {
    const body = import_users.ResetPasswordWithOtpSchema.parse(req.body);
    const result = await userService.resetPasswordWithOtpService(body.email, body.otp, body.newPassword);
    (0, import_responseHandler.successHandler)(res, result.message, {}, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to reset password", errorParser.message, errorParser.statusCode);
  }
};
const resetPasswordWithToken = async (req, res) => {
  try {
    const body = import_users.ResetPasswordWithTokenSchema.parse(req.body);
    const result = await userService.resetPasswordWithTokenService(body.token, body.newPassword);
    (0, import_responseHandler.successHandler)(res, result.message, {}, 200);
  } catch (error) {
    const errorParser = (0, import_error.parseError)(error);
    (0, import_responseHandler.errorHandler)(res, "Failed to reset password", errorParser.message, errorParser.statusCode);
  }
};
const refreshTokenController = async (req, res) => {
  try {
    const rawToken = req.cookies?.refresh_token;
    if (!rawToken) {
      (0, import_responseHandler.errorHandler)(res, "Refresh token missing", {}, 401);
      return;
    }
    const session = await (0, import_authTokenService.findValidRefreshSession)(rawToken);
    if (!session) {
      (0, import_responseHandler.errorHandler)(res, "Invalid or expired refresh token", {}, 401);
      return;
    }
    console.log("session data", session.dataValues);
    const user = await import_users.default.findOne({
      where: { id: session.dataValues.user_id, block: false },
      attributes: ["id", "email"]
    });
    if (!user) {
      (0, import_responseHandler.errorHandler)(res, "User not found", {}, 401);
      return;
    }
    const newRawRefreshToken = await (0, import_authTokenService.rotateRefreshToken)(session, req);
    (0, import_authTokenService.setRefreshTokenCookie)(res, newRawRefreshToken);
    const deviceId = (0, import_uuid.v4)();
    const jti = (0, import_uuid.v4)();
    const accessToken = (0, import_authTokenService.generateAccessToken)({
      id: user.dataValues.id,
      email: user.dataValues.email,
      deviceId,
      jti
    });
    const redisKeyGen = (0, import_redisKey.redisKey)("session", user.dataValues.id, deviceId, jti);
    await import_redis.default.set(redisKeyGen, accessToken, { EX: 60 * 60 });
    (0, import_responseHandler.successHandler)(res, "Token Generated", accessToken, 200);
  } catch (err) {
    console.error("Refresh token error:", err);
    const errorParser = (0, import_error.parseError)(err);
    (0, import_responseHandler.errorHandler)(res, errorParser.message, err.message, errorParser.statusCode);
    return;
  }
};
const logoutController = async (req, res) => {
  try {
    const rawToken = req.cookies?.refresh_token;
    const userId = req.user.userId;
    console.log("raw token ", rawToken);
    if (rawToken) {
      const session = await (0, import_authTokenService.findValidRefreshSession)(rawToken, userId);
      if (session) {
        await (0, import_authTokenService.revokeRefreshSession)(session);
      }
    }
    (0, import_authTokenService.clearRefreshTokenCookie)(res);
    let redisKeyGen = (0, import_redisKey.redisKey)("session", userId, req.user.deviceId, req.user.jti);
    await import_redis.default.del(redisKeyGen);
    (0, import_responseHandler.successHandler)(res, "Logged out successfully", {}, 200);
  } catch (err) {
    console.error("Logout error:", err);
    const errorParser = (0, import_error.parseError)(err);
    (0, import_responseHandler.errorHandler)(res, errorParser.message, err.message, errorParser.statusCode);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addUser,
  blockUser,
  forgotPasswordLink,
  forgotPasswordOtp,
  getUserProfile,
  loginUser,
  logoutController,
  refreshTokenController,
  resetPasswordWithOtp,
  resetPasswordWithToken,
  updateUserProfile,
  verifyOtp
});
//# sourceMappingURL=user.controller.js.map
