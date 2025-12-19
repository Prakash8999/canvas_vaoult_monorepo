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
var user_service_exports = {};
__export(user_service_exports, {
  blockUserService: () => blockUserService,
  createUserService: () => createUserService,
  forgotPasswordLinkService: () => forgotPasswordLinkService,
  forgotPasswordOtpService: () => forgotPasswordOtpService,
  getUserProfileService: () => getUserProfileService,
  loginUserService: () => loginUserService,
  resetPasswordWithOtpService: () => resetPasswordWithOtpService,
  resetPasswordWithTokenService: () => resetPasswordWithTokenService,
  updateUserProfileService: () => updateUserProfileService,
  verifyOtpService: () => verifyOtpService
});
module.exports = __toCommonJS(user_service_exports);
var import_bcrypt = __toESM(require("bcrypt"));
var import_crypto = __toESM(require("crypto"));
var import_users = require("./users.model");
var import_redis = __toESM(require("../../config/redis"));
var import_producer = require("../../jobs/producer");
var import_authTokenService = require("../../common/utils/authTokenService");
var import_uuid = require("uuid");
var import_redisKey = require("../../common/utils/redisKey");
async function createUserService(body) {
  if (!import_users.User || !import_users.User.sequelize)
    throw new Error("Database not initialized");
  const existing = await import_users.User.count({ where: { email: body.email } });
  console.log("Existing user count:", existing);
  if (existing > 0) {
    const err = new Error("User already exists");
    err.statusCode = 409;
    throw err;
  }
  const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
  const user = await import_users.User.sequelize.transaction(async (t) => {
    const hashedPassword = await import_bcrypt.default.hash(body.password, 10);
    const addData = {
      ...body,
      password: hashedPassword,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date(),
      is_email_verified: false,
      block: false
    };
    try {
      const created = await import_users.User.create(addData, { transaction: t });
      await import_redis.default.set(`user:otp:${created.dataValues.id}`, otp, { EX: 300 });
      return created;
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError" || err?.errors?.[0]?.type === "unique violation") {
        const e = new Error("User already exists");
        e.statusCode = 409;
        throw e;
      }
      throw err;
    }
  });
  await import_producer.otpQueue.add(
    "send-otp",
    { email: user.email, otp }
    // {
    // Use a jobId without ':' because BullMQ disallows ':' in custom ids
    // (it uses ':' for internal namespacing). This prevents the "Custom Id cannot contain :" error.
    // jobId: `otp-${user.id}`,
    // }
  );
  return { user, otp };
}
async function verifyOtpService(email, otp, req, res) {
  const user = await import_users.User.findOne({ where: { email }, attributes: ["id", "email", "is_email_verified"] });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const storedOtp = await import_redis.default.get(`user:otp:${user.dataValues.id}`);
  console.log("Stored OTP:", storedOtp, "Provided OTP:", otp);
  console.log("User ID:", user.dataValues.id, "Email:", user.dataValues.email);
  if (!storedOtp) {
    const err = new Error("OTP expired or not found. Please request a new one.");
    const newOtp = Math.floor(1e5 + Math.random() * 9e5).toString();
    await import_redis.default.set(`user:otp:${user.dataValues.id}`, newOtp, { EX: 300 });
    await import_producer.otpQueue.add("send-otp", { email: user.dataValues.email, otp: newOtp });
    err.statusCode = 400;
    throw err;
  }
  if (storedOtp !== otp) {
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }
  await import_users.User.update({ is_email_verified: true }, { where: { email } });
  await import_redis.default.del(`user:otp:${user.dataValues.id}`);
  if (!process.env.JWT_SECRET)
    throw new Error("JWT_SECRET is not defined in environment variables");
  const deviceId = (0, import_uuid.v4)();
  const jti = (0, import_uuid.v4)();
  const accessToken = (0, import_authTokenService.generateAccessToken)({
    id: user.dataValues.id,
    email: user.dataValues.email,
    deviceId,
    jti
  });
  const refreshToken = await (0, import_authTokenService.createRefreshToken)(user.dataValues.id, req);
  (0, import_authTokenService.setRefreshTokenCookie)(res, refreshToken);
  const redisKeyGen = (0, import_redisKey.redisKey)("session", user.dataValues.id, deviceId, jti);
  await import_redis.default.set(redisKeyGen, accessToken, { EX: 60 * 60 });
  return { token: accessToken };
}
async function loginUserService(email, otpOrPassword, req, res) {
  const user = await import_users.User.findOne({ where: { email, block: false }, attributes: ["id", "email", "password", "is_email_verified"] });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  if (!user.dataValues.is_email_verified) {
    const err = new Error("Email not verified");
    err.statusCode = 403;
    throw err;
  }
  const passwordMatch = await import_bcrypt.default.compare(otpOrPassword, user.dataValues.password);
  if (!passwordMatch) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }
  if (!process.env.JWT_SECRET)
    throw new Error("JWT_SECRET is not defined in environment variables");
  const deviceId = (0, import_uuid.v4)();
  const jti = (0, import_uuid.v4)();
  const accessToken = (0, import_authTokenService.generateAccessToken)({
    id: user.dataValues.id,
    email: user.dataValues.email,
    deviceId,
    jti
  });
  const refreshToken = await (0, import_authTokenService.createRefreshToken)(user.dataValues.id, req);
  (0, import_authTokenService.setRefreshTokenCookie)(res, refreshToken);
  let redisKeyGen = (0, import_redisKey.redisKey)("session", user.dataValues.id, deviceId, jti);
  await import_redis.default.set(redisKeyGen, accessToken, { EX: 60 * 60 });
  return { token: accessToken };
}
async function getUserProfileService(userId) {
  const user = await import_users.User.findOne({
    where: { id: userId, block: false },
    attributes: ["id", "email", "name", "is_email_verified", "profile_url", "created_at", "updated_at", "bio", "location", "website", "github", "twitter"]
  });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
}
async function updateUserProfileService(userId, body) {
  const user = await import_users.User.findOne({ where: { id: userId, block: false } });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  await import_users.User.update(body, { where: { id: userId } });
  return {};
}
async function blockUserService(userId) {
  const user = await import_users.User.findOne({ where: { id: userId, block: false } });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  await import_users.User.update({ block: true, blocked_on: /* @__PURE__ */ new Date() }, { where: { id: userId } });
  return {};
}
async function forgotPasswordOtpService(email) {
  const user = await import_users.User.findOne({ where: { email, block: false } });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  if (!user.dataValues.is_email_verified) {
    const err = new Error("Email not verified");
    err.statusCode = 403;
    throw err;
  }
  const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
  await import_redis.default.set(`user:password-reset-otp:${user.dataValues.id}`, otp, { EX: 300 });
  await import_producer.otpQueue.add("send-password-reset-otp", { email: user.dataValues.email, otp: parseInt(otp) });
  return { message: "Password reset OTP sent to your email" };
}
async function forgotPasswordLinkService(email) {
  const user = await import_users.User.findOne({ where: { email, block: false } });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  if (!user.dataValues.is_email_verified) {
    const err = new Error("Email not verified");
    err.statusCode = 403;
    throw err;
  }
  const resetToken = import_crypto.default.randomBytes(32).toString("hex");
  await import_redis.default.set(`user:password-reset-token:${resetToken}`, user.dataValues.id.toString(), { EX: 900 });
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  await import_producer.otpQueue.add("send-password-reset-link", { email: user.dataValues.email, resetLink });
  return { message: "Password reset link sent to your email" };
}
async function resetPasswordWithOtpService(email, otp, newPassword) {
  const user = await import_users.User.findOne({ where: { email, block: false } });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const storedOtp = await import_redis.default.get(`user:password-reset-otp:${user.dataValues.id}`);
  if (!storedOtp) {
    const err = new Error("OTP expired or not found. Please request a new one.");
    err.statusCode = 400;
    throw err;
  }
  if (storedOtp !== otp) {
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }
  const hashedPassword = await import_bcrypt.default.hash(newPassword, 12);
  await import_users.User.update({ password: hashedPassword }, { where: { email } });
  await import_redis.default.del(`user:password-reset-otp:${user.dataValues.id}`);
  return { message: "Password reset successfully" };
}
async function resetPasswordWithTokenService(token, newPassword) {
  const userId = await import_redis.default.get(`user:password-reset-token:${token}`);
  if (!userId) {
    const err = new Error("Invalid or expired reset token");
    err.statusCode = 400;
    throw err;
  }
  const user = await import_users.User.findOne({ where: { id: parseInt(userId), block: false } });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const hashedPassword = await import_bcrypt.default.hash(newPassword, 12);
  await import_users.User.update({ password: hashedPassword }, { where: { id: parseInt(userId) } });
  await import_redis.default.del(`user:password-reset-token:${token}`);
  return { message: "Password reset successfully" };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  blockUserService,
  createUserService,
  forgotPasswordLinkService,
  forgotPasswordOtpService,
  getUserProfileService,
  loginUserService,
  resetPasswordWithOtpService,
  resetPasswordWithTokenService,
  updateUserProfileService,
  verifyOtpService
});
//# sourceMappingURL=user.service.js.map
