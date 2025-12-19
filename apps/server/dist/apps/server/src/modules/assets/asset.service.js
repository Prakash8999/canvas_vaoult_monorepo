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
var asset_service_exports = {};
__export(asset_service_exports, {
  AssetService: () => AssetService,
  assetService: () => assetService
});
module.exports = __toCommonJS(asset_service_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_client = require("../../common/libs/s3/s3-client");
class AssetService {
  s3Client;
  constructor() {
    this.s3Client = import_s3_client.s3Client;
  }
  /**
   * Delete multiple files from S3
   */
  async deleteMultipleFiles(keys) {
    try {
      const deletePromises = keys.map(async (key) => {
        const command = new import_client_s3.DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key
        });
        const response = await this.s3Client.send(command);
        if (response.$metadata.httpStatusCode !== 204) {
          throw new Error(`Failed to delete file: ${key}`);
        }
      });
      await Promise.all(deletePromises);
      return { success: true, message: "All files deleted successfully" };
    } catch (error) {
      console.error("Error deleting multiple files:", error);
      throw new Error("Failed to delete one or more files from S3");
    }
  }
  /**
   * Process uploaded files and return formatted response
   */
  processUploadedFiles(files) {
    if (!files || files.length === 0) {
      throw new Error("No files uploaded");
    }
    return files.map((file) => ({
      size: +(file.size / 1024).toFixed(2),
      // Size in KB
      url: file.location,
      key: file.key
    }));
  }
  /**
   * Process single uploaded file and return formatted response
   */
  processUploadedFile(file) {
    if (!file) {
      throw new Error("No file uploaded");
    }
    return {
      size: +(file.size / 1024).toFixed(2),
      // Size in KB
      url: file.location,
      key: file.key
    };
  }
}
const assetService = new AssetService();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AssetService,
  assetService
});
//# sourceMappingURL=asset.service.js.map
