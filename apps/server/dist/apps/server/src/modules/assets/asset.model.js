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
var asset_model_exports = {};
__export(asset_model_exports, {
  CreateImageSchema: () => CreateImageSchema,
  ImageAssets: () => ImageAssets,
  ImageSchema: () => ImageSchema,
  UpdateImageSchema: () => UpdateImageSchema,
  default: () => asset_model_default
});
module.exports = __toCommonJS(asset_model_exports);
var import_sequelize = require("sequelize");
var import_database = __toESM(require("../../config/database"));
var import_zod = require("zod");
var import_zod_to_openapi = require("@asteasolutions/zod-to-openapi");
(0, import_zod_to_openapi.extendZodWithOpenApi)(import_zod.z);
const ImageSchema = import_zod.z.object({
  id: import_zod.z.number().int().openapi({
    example: 1,
    description: "Unique identifier for the image record"
  }),
  url: import_zod.z.url().openapi({
    example: "https://s3.amazonaws.com/bucket-name/images/abc123.png",
    description: "Publicly accessible image URL on S3"
  }),
  user_Id: import_zod.z.number().int().openapi({
    example: 42,
    description: "ID of the user who uploaded the image"
  }),
  s3_key: import_zod.z.string().min(1).openapi({
    example: "images/abc123.png",
    description: "S3 object key used to fetch or delete the file"
  }),
  file_name: import_zod.z.string().min(1).openapi({
    example: "profile_pic.png",
    description: "Original uploaded file name"
  }),
  file_type: import_zod.z.string().min(1).openapi({
    example: "image/png",
    description: "MIME type of the uploaded file"
  }),
  size_kb: import_zod.z.number().positive().openapi({
    example: 245.7,
    description: "File size in kilobytes"
  }),
  link_id: import_zod.z.number().int().nullable().optional().openapi({
    example: 101,
    description: "ID of the linked entity (e.g., document, post, canvas, etc.)"
  }),
  asset_type: import_zod.z.enum(["Note", "Post", "Canvas", "User", "Other"]).nullable().optional().openapi({
    example: "Note",
    description: "Type of entity this image is associated with"
  }),
  metadata: import_zod.z.record(import_zod.z.string(), import_zod.z.any()).nullable().optional().openapi({
    example: { width: 800, height: 600 },
    description: "Optional metadata about the image (dimensions, EXIF, etc.)"
  }),
  created_at: import_zod.z.date().optional().openapi({
    type: "string",
    format: "date-time",
    example: "2025-10-08T09:00:00Z",
    description: "Timestamp when the image record was created"
  }),
  updated_at: import_zod.z.date().optional().openapi({
    type: "string",
    format: "date-time",
    example: "2025-10-08T09:00:00Z",
    description: "Timestamp when the image record was last updated"
  })
}).openapi({
  title: "ImageAssets",
  description: "Represents an image stored in S3 with metadata and linkage information"
});
const CreateImageSchema = ImageSchema.omit({
  id: true
}).openapi({
  title: "CreateImageInput",
  description: "Payload for uploading and storing image metadata"
});
const UpdateImageSchema = ImageSchema.partial().omit({
  id: true,
  created_at: true
}).openapi({
  title: "UpdateImageInput",
  description: "Payload for updating image metadata"
});
class ImageAssets extends import_sequelize.Model {
  id;
  url;
  user_Id;
  s3_key;
  file_name;
  file_type;
  size_kb;
  link_id;
  asset_type;
  metadata;
  created_at;
  updated_at;
}
ImageAssets.init(
  {
    id: {
      type: import_sequelize.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    url: {
      type: import_sequelize.DataTypes.STRING(500),
      allowNull: false
    },
    s3_key: {
      type: import_sequelize.DataTypes.STRING(500),
      allowNull: false
    },
    file_name: {
      type: import_sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    user_Id: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    file_type: {
      type: import_sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    size_kb: {
      type: import_sequelize.DataTypes.FLOAT,
      allowNull: false
    },
    link_id: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    asset_type: {
      type: import_sequelize.DataTypes.ENUM("Note", "Post", "Canvas", "User", "Other"),
      allowNull: true
    },
    metadata: {
      type: import_sequelize.DataTypes.JSON,
      allowNull: true,
      comment: "Additional metadata like dimensions, EXIF info, etc."
    },
    created_at: {
      type: import_sequelize.DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: import_sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize: import_database.default,
    tableName: "assets",
    timestamps: false
  }
);
var asset_model_default = ImageAssets;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreateImageSchema,
  ImageAssets,
  ImageSchema,
  UpdateImageSchema
});
//# sourceMappingURL=asset.model.js.map
