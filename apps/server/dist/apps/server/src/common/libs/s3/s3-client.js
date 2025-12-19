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
var s3_client_exports = {};
__export(s3_client_exports, {
  s3Client: () => s3Client
});
module.exports = __toCommonJS(s3_client_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
const s3Client = new import_client_s3.S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  region: process.env.S3_REGION
  // Default to us-east-1 if not set
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  s3Client
});
//# sourceMappingURL=s3-client.js.map
