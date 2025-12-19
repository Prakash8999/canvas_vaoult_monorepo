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
var template_exports = {};
__export(template_exports, {
  authOtpEmailTemp: () => authOtpEmailTemp,
  passwordResetLinkEmailTemp: () => passwordResetLinkEmailTemp,
  passwordResetOtpEmailTemp: () => passwordResetOtpEmailTemp
});
module.exports = __toCommonJS(template_exports);
const authOtpEmailTemp = (otp, isSignup = false) => {
  const action = isSignup ? "signing up" : "signing in";
  const body = `
	  <html>
		<body style="font-family: Arial, sans-serif; color: #333;">
		  <h2 style="color: #3b82f6;">Welcome to CanvasVault!</h2>
		  <p>Thank you for ${action}. Please use the OTP below to securely ${action} to your CloudyFiles account:</p>
		  <p style="font-size: 28px; font-weight: bold; color: #3b82f6;">${otp}</p>
		  <p>This OTP is valid for 5 minutes for your security.</p>
		  <p>If you didn\u2019t initiate this request, you can safely ignore this email.</p>
		  <p style="margin-top: 24px;">Cheers,<br/>The CanvasVault Team</p>
		</body>
	  </html>
	`;
  return body;
};
const passwordResetOtpEmailTemp = (otp) => {
  const body = `
	  <html>
		<body style="font-family: Arial, sans-serif; color: #333;">
		  <h2 style="color: #3b82f6;">Reset Your CanvasVault Password</h2>
		  <p>We received a request to reset your password. Please use the OTP below to reset your password:</p>
		  <p style="font-size: 28px; font-weight: bold; color: #3b82f6;">${otp}</p>
		  <p>This OTP is valid for 5 minutes for your security.</p>
		  <p>If you didn\u2019t request a password reset, you can safely ignore this email.</p>
		  <p style="margin-top: 24px;">Cheers,<br/>The CanvasVault Team</p>
		</body>
	  </html>
	`;
  return body;
};
const passwordResetLinkEmailTemp = (resetLink) => {
  const body = `
	  <html>
		<body style="font-family: Arial, sans-serif; color: #333;">
		  <h2 style="color: #3b82f6;">Reset Your CanvasVault Password</h2>
		  <p>We received a request to reset your password. Click the button below to reset your password:</p>
		  <div style="text-align: center; margin: 30px 0;">
			<a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
		  </div>
		  <p>This link is valid for 15 minutes for your security.</p>
		  <p>If you didn\u2019t request a password reset, you can safely ignore this email.</p>
		  <p style="margin-top: 24px;">Cheers,<br/>The CanvasVault Team</p>
		</body>
	  </html>
	`;
  return body;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authOtpEmailTemp,
  passwordResetLinkEmailTemp,
  passwordResetOtpEmailTemp
});
//# sourceMappingURL=template.js.map
