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
var multer_s3_exports = {};
__export(multer_s3_exports, {
  createS3Storage: () => createS3Storage,
  createUploadMiddleware: () => createUploadMiddleware,
  fileFilter: () => fileFilter
});
module.exports = __toCommonJS(multer_s3_exports);
var import_multer = __toESM(require("multer"));
var import_multer_s3 = __toESM(require("multer-s3"));
var import_s3_client = require("../s3/s3-client");
console.log("S3 envs:", {
  bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION,
  key: process.env.S3_ACCESS_KEY,
  secret: process.env.S3_SECRET_KEY ? "***" : "MISSING"
});
if (!process.env.S3_BUCKET || !process.env.S3_REGION || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || process.env.S3_BUCKET.trim() === "" || process.env.S3_REGION.trim() === "" || process.env.S3_ACCESS_KEY.trim() === "" || process.env.S3_SECRET_KEY.trim() === "") {
  throw new Error("S3 environment variables are not properly configured");
}
const createS3Storage = (userId, fileType) => {
  return (0, import_multer_s3.default)({
    s3: import_s3_client.s3Client,
    bucket: process.env.S3_BUCKET,
    // acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldname: file.fieldname });
    },
    key: (req, file, cb) => {
      console.log("fileType", req.body?.fileType, req.query?.fileType, fileType);
      const type = fileType || req.query?.fileType || req.body?.fileType;
      if (!type) {
        cb(new Error("File type is required. Must be 'note' or 'canvas'"));
        return;
      }
      if (!["note", "notes", "canvas"].includes(type)) {
        cb(new Error("Invalid file type. Must be 'note' or 'canvas'"));
        return;
      }
      const timestamp = Date.now();
      const sanitizedFileName = `${timestamp}_${file.fieldname}_${file.originalname}`;
      let folderPath = `uploads/user/${userId}/`;
      if (type === "notes" || type === "note") {
        folderPath += "notes/image/";
      } else if (type === "canvas") {
        folderPath += "canvas/image/";
      } else {
        cb(new Error("Invalid file type. Must be 'note' or 'canvas'"));
        return;
      }
      cb(null, `${folderPath}${sanitizedFileName}`);
    }
  });
};
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml"
  ];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));
  const isAllowedMimeType = allowedMimes.includes(file.mimetype);
  const isAllowedExtension = allowedExtensions.includes(fileExtension);
  if (isAllowedMimeType && isAllowedExtension) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed"));
  }
};
const createUploadMiddleware = (userId, fileType, maxFileSize = 5 * 1024 * 1024) => {
  return (0, import_multer.default)({
    storage: createS3Storage(userId, fileType),
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      // Default 5MB
      files: 1
      // Only allow single file upload
    }
  }).single("file");
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createS3Storage,
  createUploadMiddleware,
  fileFilter
});
//# sourceMappingURL=multer-s3.js.map
