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
var canvas_model_exports = {};
__export(canvas_model_exports, {
  Canvas: () => Canvas,
  CanvasIdParamsSchema: () => CanvasIdParamsSchema,
  CanvasSchema: () => CanvasSchema,
  CreateCanvasSchema: () => CreateCanvasSchema,
  GetCanvasByUidParamsSchema: () => GetCanvasByUidParamsSchema,
  GetCanvasQuerySchema: () => GetCanvasQuerySchema,
  UpdateCanvasSchema: () => UpdateCanvasSchema,
  default: () => canvas_model_default
});
module.exports = __toCommonJS(canvas_model_exports);
var import_sequelize = require("sequelize");
var import_database = __toESM(require("../../config/database"));
var import_zod = require("zod");
var import_zod_to_openapi = require("@asteasolutions/zod-to-openapi");
(0, import_zod_to_openapi.extendZodWithOpenApi)(import_zod.z);
const CanvasSchema = import_zod.z.object({
  id: import_zod.z.number().int().openapi({
    example: 1,
    description: "Unique identifier for the canvas"
  }),
  canvas_uid: import_zod.z.string().openapi({
    example: "canvas-12345",
    description: "Unique UID for the canvas, used for client-side identification"
  }),
  user_id: import_zod.z.number().int().openapi({
    example: 1,
    description: "ID of the user who owns the canvas"
  }),
  note_id: import_zod.z.number().int().optional().nullable().openapi({
    example: 1,
    description: "ID of the associated note (One-to-One relationship)"
  }),
  title: import_zod.z.string().min(1).openapi({
    example: "My Canvas",
    description: "Name of the canvas"
  }),
  canvas_data: import_zod.z.any().optional().openapi({
    description: "Excalidraw canvas elements data"
  }),
  document_data: import_zod.z.record(import_zod.z.string(), import_zod.z.any()).optional().openapi({
    description: "EditorJS document data associated with the canvas"
  }),
  viewport: import_zod.z.object({
    scrollX: import_zod.z.number().optional(),
    scrollY: import_zod.z.number().optional(),
    zoom: import_zod.z.number().optional()
  }).optional().nullable().openapi({
    description: "Viewport state (scroll, zoom)"
  }),
  pinned: import_zod.z.boolean().default(false).openapi({
    example: false,
    description: "Whether the canvas is pinned"
  }),
  created_at: import_zod.z.date().optional().openapi({
    type: "string",
    format: "date-time",
    description: "Timestamp when the canvas was created"
  }),
  updated_at: import_zod.z.date().optional().openapi({
    type: "string",
    format: "date-time",
    description: "Timestamp when the canvas was last updated"
  })
}).openapi({
  title: "Canvas",
  description: "Represents a canvas entity"
});
const CreateCanvasSchema = CanvasSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  user_id: true,
  canvas_uid: true
}).openapi({
  title: "CreateCanvasInput",
  description: "Payload for creating a new canvas"
});
const UpdateCanvasSchema = CanvasSchema.partial().omit({
  id: true,
  user_id: true,
  updated_at: true,
  canvas_uid: true,
  created_at: true
}).openapi({
  title: "UpdateCanvasInput",
  description: "Payload for updating an existing canvas"
});
const GetCanvasQuerySchema = import_zod.z.object({
  // Reuse fields from CanvasSchema with query-specific transformations
  id: CanvasSchema.shape.id.optional(),
  canvas_uid: CanvasSchema.shape.canvas_uid.optional(),
  note_id: import_zod.z.coerce.number().int().positive().optional().openapi({
    example: 1,
    description: "Filter by associated note ID"
  }),
  title: CanvasSchema.shape.title.optional(),
  pinned: import_zod.z.enum(["true", "false"]).transform((val) => val === "true").optional().openapi({
    example: "true",
    description: "Filter by pinned status (true/false)"
  }),
  search: import_zod.z.string().optional().openapi({
    example: "canvas",
    description: "Search across canvas titles (partial match)"
  }),
  page: import_zod.z.coerce.number().int().positive().default(1).optional().openapi({
    example: 1,
    description: "Page number for pagination"
  }),
  limit: import_zod.z.coerce.number().int().positive().max(100).default(10).optional().openapi({
    example: 10,
    description: "Number of items per page (max 100)"
  }),
  sort: import_zod.z.enum(["asc", "desc"]).optional().openapi({
    example: "asc",
    description: "Sort order (asc/desc)"
  }),
  sort_by: import_zod.z.enum(["created_at", "updated_at"]).optional().openapi({
    example: "created_at",
    description: "Sort by (created_at/updated_at)"
  }),
  created_at: import_zod.z.date().optional().openapi({
    example: "2022-01-01T00:00:00.000Z",
    description: "Filter by created_at date"
  }),
  updated_at: import_zod.z.date().optional().openapi({
    example: "2022-01-01T00:00:00.000Z",
    description: "Filter by updated_at date"
  })
}).openapi({
  title: "GetCanvasQueryParams",
  description: "Query parameters for filtering and paginating canvases"
});
const GetCanvasByUidParamsSchema = import_zod.z.object({
  uid: CanvasSchema.shape.canvas_uid
}).openapi({
  title: "GetCanvasByUidParams",
  description: "URL params for getting a canvas by UID"
});
const CanvasIdParamsSchema = import_zod.z.object({
  id: import_zod.z.string().regex(/^\d+$/, "ID must be a positive integer").openapi({
    example: "1",
    description: "Canvas ID (numeric string)"
  })
}).openapi({
  title: "CanvasIdParams",
  description: "URL params for canvas ID-based operations"
});
class Canvas extends import_sequelize.Model {
  id;
  canvas_uid;
  user_id;
  note_id;
  title;
  canvas_data;
  document_data;
  viewport;
  pinned;
  created_at;
  updated_at;
}
Canvas.init(
  {
    id: {
      type: import_sequelize.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    canvas_uid: {
      type: import_sequelize.DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    user_id: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    note_id: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      references: {
        model: "notes",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    title: {
      type: import_sequelize.DataTypes.TEXT,
      allowNull: false
    },
    canvas_data: {
      type: import_sequelize.DataTypes.JSON,
      allowNull: true,
      comment: "Excalidraw elements JSON"
    },
    document_data: {
      type: import_sequelize.DataTypes.JSON,
      allowNull: true,
      comment: "EditorJS content JSON"
    },
    viewport: {
      type: import_sequelize.DataTypes.JSON,
      allowNull: true,
      comment: "Viewport state"
    },
    pinned: {
      type: import_sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: "canvases",
    timestamps: false,
    indexes: [
      {
        fields: ["canvas_uid"],
        unique: true
      },
      {
        fields: ["user_id"]
      }
    ]
  }
);
var canvas_model_default = Canvas;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Canvas,
  CanvasIdParamsSchema,
  CanvasSchema,
  CreateCanvasSchema,
  GetCanvasByUidParamsSchema,
  GetCanvasQuerySchema,
  UpdateCanvasSchema
});
//# sourceMappingURL=canvas.model.js.map
