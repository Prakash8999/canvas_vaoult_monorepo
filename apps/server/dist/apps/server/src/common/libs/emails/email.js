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
var email_exports = {};
__export(email_exports, {
  sendMail: () => sendMail
});
module.exports = __toCommonJS(email_exports);
var import_nodemailer = __toESM(require("nodemailer"));
if (!process.env.NODEMAILER_EMAIL_FROM || !process.env.NODEMAILER_EMAIL_PASSWORD) {
  throw new Error("Nodemailer email configuration is not set");
}
const transporter = import_nodemailer.default.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL_FROM,
    pass: process.env.NODEMAILER_EMAIL_PASSWORD
  }
});
const sendMail = async (email, subject, html) => {
  const mailOptions = {
    from: "CanvasVault<" + process.env.NODEMAILER_EMAIL_FROM + ">",
    to: email,
    subject,
    html
  };
  try {
    await transporter.sendMail(mailOptions);
    return {
      error: false,
      message: "Mail sent successfully",
      statusCode: 200
    };
  } catch (error) {
    return {
      error: true,
      message: error.message,
      statusCode: 500
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sendMail
});
//# sourceMappingURL=email.js.map
