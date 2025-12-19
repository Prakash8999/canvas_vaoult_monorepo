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
var asset_controller_exports = {};
__export(asset_controller_exports, {
  deleteMultipleS3Files: () => deleteMultipleS3Files,
  dynamicUploadImages: () => dynamicUploadImages,
  handleUploadImages: () => handleUploadImages
});
module.exports = __toCommonJS(asset_controller_exports);
var import_responseHandler = require("../../common/middlewares/responseHandler");
var import_asset = require("./asset.service");
var import_multer_s3 = require("../../common/libs/multer/multer-s3");
var import_asset2 = __toESM(require("./asset.model"));
const dynamicUploadImages = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    (0, import_responseHandler.errorHandler)(res, "Unauthorized: User information is missing", {}, 401);
    return;
  }
  const fileType = req.query?.fileType;
  const upload = (0, import_multer_s3.createUploadMiddleware)(req.user.userId, fileType);
  upload(req, res, function(err) {
    console.log("error ", err);
    if (err) {
      (0, import_responseHandler.errorHandler)(res, err.message, {}, 500);
      return;
    }
    next();
    return;
  });
};
const handleUploadImages = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return (0, import_responseHandler.errorHandler)(res, "No file uploaded", {}, 400);
    }
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedMimes.includes(file.mimetype)) {
      return (0, import_responseHandler.errorHandler)(res, "Only image files are allowed", {}, 400);
    }
    let { asset_type, fileType } = req.body;
    if (!asset_type) {
      const type = req.query?.fileType || fileType;
      if (type) {
        if (type === "note" || type === "notes")
          asset_type = "Note";
        else if (type === "canvas")
          asset_type = "Canvas";
      }
    }
    const uploadedFile = import_asset.assetService.processUploadedFile(file);
    const resData = await import_asset2.default.create({
      asset_type,
      user_Id: req.user.userId,
      s3_key: uploadedFile.key,
      size_kb: Math.round(uploadedFile.size),
      file_type: file.mimetype,
      url: uploadedFile.url,
      file_name: file.originalname,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    });
    const sendData = {
      id: resData.dataValues.id,
      ...uploadedFile
    };
    return (0, import_responseHandler.successHandler)(res, "Image uploaded to S3 successfully", sendData, 200);
  } catch (error) {
    console.error("Error uploading image:", error);
    return (0, import_responseHandler.errorHandler)(res, error.message || "Image upload failed", {}, 500);
  }
};
const deleteMultipleS3Files = async (req, res) => {
  try {
    const { keys } = req.body;
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      (0, import_responseHandler.errorHandler)(res, "Keys array is required", {}, 400);
      return;
    }
    const result = await import_asset.assetService.deleteMultipleFiles(keys);
    (0, import_responseHandler.successHandler)(res, result.message, result, 200);
    return;
  } catch (error) {
    (0, import_responseHandler.errorHandler)(res, error.message || "Failed to delete files", {}, 500);
    return;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deleteMultipleS3Files,
  dynamicUploadImages,
  handleUploadImages
});
//# sourceMappingURL=asset.controller.js.map
