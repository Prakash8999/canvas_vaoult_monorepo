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
var authMiddleware_exports = {};
__export(authMiddleware_exports, {
  authUser: () => authUser
});
module.exports = __toCommonJS(authMiddleware_exports);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_users = require("../../../modules/users/users.model");
var import_authLogger = require("../../utils/authLogger");
var import_responseHandler = require("../responseHandler");
var import_redis = __toESM(require("../../../config/redis"));
var import_redisKey = require("../../utils/redisKey");
const validateJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  if (secret.length < 32) {
    console.warn("JWT_SECRET should be at least 32 characters long for security");
  }
  return secret;
};
const extractToken = (req) => {
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const customHeader = req.header("x-auth-token");
  if (customHeader) {
    return customHeader.startsWith("Bearer ") ? customHeader.slice(7) : customHeader;
  }
  return null;
};
const getUserById = async (userId) => {
  try {
    const user = await import_users.User.findOne({
      where: {
        id: userId,
        block: false
      },
      attributes: ["id", "email", "name", "is_email_verified", "profile_url", "created_at"]
    });
    return user?.dataValues || null;
  } catch (error) {
    console.error("Database error in getUserById:", error);
    return null;
  }
};
const authUser = async (req, res, next) => {
  const rawToken = req.cookies?.refresh_token;
  if (!rawToken) {
    (0, import_responseHandler.errorHandler)(res, "Authentication token not found", {}, 401);
    return;
  }
  const xForwardedFor = req.headers["x-forwarded-for"];
  const clientIP = req.ip || (typeof xForwardedFor === "string" ? xForwardedFor.split(",")[0].trim() : void 0) || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";
  try {
    const token = extractToken(req);
    if (!token) {
      import_authLogger.authLogger.log({
        action: "LOGIN_FAILED",
        ip: clientIP,
        userAgent,
        url: req.url,
        method: req.method,
        error: "No token provided"
      });
      (0, import_responseHandler.errorHandler)(res, "Authentication token not found", {}, 401);
      return;
    }
    console.log("Extracted Token:", token);
    if (token.length < 10) {
      import_authLogger.authLogger.log({
        action: "TOKEN_INVALID",
        ip: clientIP,
        userAgent,
        url: req.url,
        method: req.method,
        error: "Invalid token format"
      });
      (0, import_responseHandler.errorHandler)(res, "Invalid token format", {}, 401);
      return;
    }
    let decoded;
    try {
      const jwtSecret = validateJwtSecret();
      console.log("Validating token...", jwtSecret);
      decoded = import_jsonwebtoken.default.verify(token, jwtSecret, {
        issuer: "canvas-backend",
        audience: "canvas-users",
        // Add clock tolerance for minor time differences
        clockTolerance: 30
        // 30 seconds
      });
    } catch (error) {
      console.error("JWT verification error:", error);
      const action = error.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
      import_authLogger.authLogger.log({
        action,
        ip: clientIP,
        userAgent,
        url: req.url,
        method: req.method,
        error: error.message
      });
      switch (error.name) {
        case "TokenExpiredError":
          (0, import_responseHandler.errorHandler)(res, "Token has expired. Please login again", {}, 401);
          break;
        case "JsonWebTokenError":
          (0, import_responseHandler.errorHandler)(res, "Invalid token signature", {}, 401);
          break;
        case "NotBeforeError":
          (0, import_responseHandler.errorHandler)(res, "Token not active yet", {}, 401);
          break;
        default:
          console.error("JWT verification error:", error);
          (0, import_responseHandler.errorHandler)(res, "Token verification failed", {}, 401);
      }
      return;
    }
    if (!decoded.userId || !decoded.email) {
      import_authLogger.authLogger.log({
        action: "TOKEN_INVALID",
        ip: clientIP,
        userAgent,
        url: req.url,
        method: req.method,
        error: "Invalid token payload"
      });
      (0, import_responseHandler.errorHandler)(res, "Invalid token payload", {}, 401);
      return;
    }
    const key = (0, import_redisKey.redisKey)("session", decoded.userId, decoded.deviceId, decoded.jti);
    const tokenExists = await import_redis.default.get(key);
    if (!tokenExists) {
      (0, import_responseHandler.errorHandler)(res, "Access token invalid or revoked", {}, 401);
      return;
    }
    const userData = await getUserById(decoded.userId);
    if (!userData) {
      import_authLogger.authLogger.log({
        action: "USER_NOT_FOUND",
        userId: decoded.userId.toString(),
        email: decoded.email,
        ip: clientIP,
        userAgent,
        url: req.url,
        method: req.method,
        error: "User not found or disabled"
      });
      (0, import_responseHandler.errorHandler)(res, "User not found or has been disabled", {}, 401);
      return;
    }
    if (userData.email !== decoded.email) {
      import_authLogger.authLogger.log({
        action: "TOKEN_INVALID",
        userId: decoded.userId.toString(),
        email: decoded.email,
        ip: clientIP,
        userAgent,
        url: req.url,
        method: req.method,
        error: `Email mismatch: token=${decoded.email}, db=${userData.email}`
      });
      (0, import_responseHandler.errorHandler)(res, "Token validation failed", {}, 401);
      return;
    }
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      isEmailVerified: userData.is_email_verified,
      name: userData.name,
      deviceId: decoded.deviceId,
      jti: decoded.jti,
      profileUrl: userData.profile_url,
      iat: decoded.iat,
      exp: decoded.exp
    };
    import_authLogger.authLogger.log({
      action: "LOGIN_SUCCESS",
      userId: decoded.userId.toString(),
      email: decoded.email,
      ip: clientIP,
      userAgent,
      url: req.url,
      method: req.method
    });
    next();
  } catch (error) {
    import_authLogger.authLogger.log({
      action: "AUTH_ERROR",
      userId: req.user?.userId.toString(),
      ip: clientIP,
      userAgent,
      url: req.url,
      method: req.method,
      error: error.message
    });
    console.error("Auth middleware error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      url: req.url,
      method: req.method
    });
    (0, import_responseHandler.errorHandler)(res, "Authentication failed", {}, 500);
    return;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authUser
});
//# sourceMappingURL=authMiddleware.js.map
