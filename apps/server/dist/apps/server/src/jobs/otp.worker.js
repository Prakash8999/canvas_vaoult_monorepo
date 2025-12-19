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
var otp_worker_exports = {};
__export(otp_worker_exports, {
  otpWorker: () => otpWorker,
  passwordResetLinkWorker: () => passwordResetLinkWorker,
  passwordResetOtpWorker: () => passwordResetOtpWorker
});
module.exports = __toCommonJS(otp_worker_exports);
var import_bullmq = require("bullmq");
var import_email = require("../common/libs/emails/email");
var import_template = require("../common/libs/emails/template");
const otpWorker = new import_bullmq.Worker("send-otp", async (job) => {
  const { email, otp } = job.data;
  try {
    console.log(`Sending OTP ${otp} to email ${email}`);
    const result = await (0, import_email.sendMail)(email, `Your CanvasVault OTP`, (0, import_template.authOtpEmailTemp)(otp, true));
    console.log(result);
    return true;
  } catch (err) {
    throw err;
  }
}, {
  // Use `url` when REDIS_HOST is a full redis URL (e.g. redis://localhost:6379).
  // Passing the full URL into `host` causes DNS lookups for the literal string.
  connection: { url: process.env.REDIS_HOST }
});
const passwordResetOtpWorker = new import_bullmq.Worker("send-password-reset-otp", async (job) => {
  const { email, otp } = job.data;
  try {
    console.log(`Sending password reset OTP ${otp} to email ${email}`);
    const result = await (0, import_email.sendMail)(email, `Reset Your CanvasVault Password`, (0, import_template.passwordResetOtpEmailTemp)(otp));
    console.log(result);
    return true;
  } catch (err) {
    throw err;
  }
}, {
  connection: { url: process.env.REDIS_HOST }
});
const passwordResetLinkWorker = new import_bullmq.Worker("send-password-reset-link", async (job) => {
  const { email, resetLink } = job.data;
  try {
    console.log(`Sending password reset link to email ${email}`);
    const result = await (0, import_email.sendMail)(email, `Reset Your CanvasVault Password`, (0, import_template.passwordResetLinkEmailTemp)(resetLink));
    console.log(result);
    return true;
  } catch (err) {
    throw err;
  }
}, {
  connection: { url: process.env.REDIS_HOST }
});
otpWorker.on("failed", (job, err) => {
});
passwordResetOtpWorker.on("failed", (job, err) => {
});
passwordResetLinkWorker.on("failed", (job, err) => {
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  otpWorker,
  passwordResetLinkWorker,
  passwordResetOtpWorker
});
//# sourceMappingURL=otp.worker.js.map
