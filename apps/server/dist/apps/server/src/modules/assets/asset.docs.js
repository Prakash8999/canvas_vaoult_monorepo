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
var asset_docs_exports = {};
__export(asset_docs_exports, {
  assetOpenApiDoc: () => assetOpenApiDoc,
  assetRegistry: () => assetRegistry
});
module.exports = __toCommonJS(asset_docs_exports);
var import_zod_to_openapi = require("@asteasolutions/zod-to-openapi");
var import_zod = require("zod");
const UploadedFileSchema = import_zod.z.object({
  size: import_zod.z.number().describe("File size in KB"),
  url: import_zod.z.string().url().describe("Public URL of the uploaded file"),
  key: import_zod.z.string().describe("S3 key of the uploaded file")
});
const UploadResponseSchema = import_zod.z.object({
  message: import_zod.z.string(),
  data: UploadedFileSchema
});
const DeleteFilesRequestSchema = import_zod.z.object({
  keys: import_zod.z.array(import_zod.z.string()).min(1).describe("Array of S3 keys to delete")
});
const DeleteFilesResponseSchema = import_zod.z.object({
  message: import_zod.z.string(),
  data: import_zod.z.object({
    success: import_zod.z.boolean(),
    message: import_zod.z.string()
  })
});
const assetRegistry = new import_zod_to_openapi.OpenAPIRegistry();
assetRegistry.register("UploadedFile", UploadedFileSchema);
assetRegistry.register("UploadResponse", UploadResponseSchema);
assetRegistry.register("DeleteFilesRequest", DeleteFilesRequestSchema);
assetRegistry.register("DeleteFilesResponse", DeleteFilesResponseSchema);
assetRegistry.registerPath({
  method: "post",
  path: "/api/v1/assets/upload",
  tags: ["Assets"],
  summary: "Upload a single image file",
  description: 'Upload a single image file (JPEG, PNG, GIF, WebP, SVG) to S3. Specify fileType as "note" for note attachments or "canvas" for canvas images. Only authenticated users can upload files.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "fileType",
      in: "query",
      required: true,
      schema: {
        type: "string",
        enum: ["note", "canvas"],
        default: "canvas"
      },
      description: "Type of file being uploaded"
    }
  ],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: import_zod.z.object({
            image: import_zod.z.any().openapi({
              type: "string",
              format: "binary",
              description: "Image file to upload (JPEG, PNG, GIF, WebP, SVG only)"
            })
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: "Image uploaded successfully",
      content: {
        "application/json": { schema: UploadResponseSchema }
      }
    },
    400: {
      description: "Bad request - No file uploaded or invalid file type"
    },
    401: {
      description: "Unauthorized - Authentication required"
    },
    500: {
      description: "Internal server error"
    }
  }
});
assetRegistry.registerPath({
  method: "delete",
  path: "/api/v1/assets/delete",
  tags: ["Assets"],
  summary: "Delete multiple files from S3",
  description: "Delete multiple files from S3 storage using their keys. Only authenticated users can delete files.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: DeleteFilesRequestSchema }
      }
    }
  },
  responses: {
    200: {
      description: "Files deleted successfully",
      content: {
        "application/json": { schema: DeleteFilesResponseSchema }
      }
    },
    400: {
      description: "Bad request - Invalid keys array"
    },
    401: {
      description: "Unauthorized - Authentication required"
    },
    500: {
      description: "Internal server error"
    }
  }
});
const assetOpenApiDoc = new import_zod_to_openapi.OpenApiGeneratorV3(assetRegistry.definitions).generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Asset Service API",
    version: "1.0.0",
    description: "API for managing file uploads and deletions"
  },
  servers: [{ url: "http://localhost:3000" }]
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assetOpenApiDoc,
  assetRegistry
});
//# sourceMappingURL=asset.docs.js.map
