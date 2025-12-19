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
var authTokenService_exports = {};
__export(authTokenService_exports, {
  clearRefreshTokenCookie: () => clearRefreshTokenCookie,
  createRefreshToken: () => createRefreshToken,
  findValidRefreshSession: () => findValidRefreshSession,
  generateAccessToken: () => generateAccessToken,
  hashToken: () => hashToken,
  revokeRefreshSession: () => revokeRefreshSession,
  rotateRefreshToken: () => rotateRefreshToken,
  setRefreshTokenCookie: () => setRefreshTokenCookie
});
module.exports = __toCommonJS(authTokenService_exports);
var import_crypto = __toESM(require("crypto"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_authToken = __toESM(require("../../modules/shared/model/auth/authToken.model"));
var import_sequelize = require("sequelize");
const ACCESS_TOKEN_TTL = "1d";
const REFRESH_TOKEN_DAYS = 30;
const validateJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not set");
  }
  return secret;
};
const generateAccessToken = (user) => {
  const secret = validateJwtSecret();
  return import_jsonwebtoken.default.sign(
    { userId: user.id, email: user.email, deviceId: user.deviceId, jti: user.jti },
    secret,
    {
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: "canvas-backend",
      audience: "canvas-users"
    }
  );
};
const hashToken = (token) => import_crypto.default.createHash("sha256").update(token).digest("hex");
const createRefreshToken = async (userId, req) => {
  const rawToken = import_crypto.default.randomBytes(64).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expires = /* @__PURE__ */ new Date();
  expires.setDate(expires.getDate() + REFRESH_TOKEN_DAYS);
  const xForwardedFor = req.headers["x-forwarded-for"];
  const ip = req.ip || (typeof xForwardedFor === "string" ? xForwardedFor.split(",")[0].trim() : void 0) || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";
  console.log("user agent =>", userId);
  await import_authToken.default.create({
    user_id: userId,
    token_hash: tokenHash,
    ip_address: ip,
    user_agent: userAgent,
    revoked: false,
    replaced_by_token_id: null,
    expires_at: expires
  });
  return rawToken;
};
const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction ? true : false,
    // Required for sameSite: 'none', also works in dev with https or localhost
    sameSite: isProduction ? "strict" : "lax",
    // 'none' allows cross-origin in dev
    path: "/",
    maxAge: 1e3 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS
  };
  res.cookie("refresh_token", token, cookieOptions);
  console.log("\u{1F36A} Cookie set with options:", cookieOptions);
  console.log("\u{1F36A} Response headers after cookie set:", res.getHeaders());
};
const clearRefreshTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: isProduction ? "strict" : "none",
    path: "/"
  });
};
const findValidRefreshSession = async (rawToken, userId) => {
  const tokenHash = hashToken(rawToken);
  const now = /* @__PURE__ */ new Date();
  const whereOptions = {
    token_hash: tokenHash,
    revoked: false,
    expires_at: { [import_sequelize.Op.gt]: now }
  };
  if (userId)
    whereOptions.user_id = userId;
  const session = await import_authToken.default.findOne({ where: whereOptions });
  console.log("session =>", session);
  return session;
};
const revokeRefreshSession = async (session) => {
  await session.update({ revoked: true });
};
const rotateRefreshToken = async (session, req) => {
  session.revoked = true;
  const rawToken = await createRefreshToken(session.dataValues.user_id, req);
  const tokenHash = hashToken(rawToken);
  const newSession = await import_authToken.default.findOne({
    where: { token_hash: tokenHash, user_id: session.dataValues.user_id }
  });
  if (newSession) {
    session.replaced_by_token_id = newSession.id;
  }
  await session.save();
  return rawToken;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearRefreshTokenCookie,
  createRefreshToken,
  findValidRefreshSession,
  generateAccessToken,
  hashToken,
  revokeRefreshSession,
  rotateRefreshToken,
  setRefreshTokenCookie
});
//# sourceMappingURL=authTokenService.js.map
