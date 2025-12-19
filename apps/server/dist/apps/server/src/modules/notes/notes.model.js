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
var notes_model_exports = {};
__export(notes_model_exports, {
  CreateNoteSchema: () => CreateNoteSchema,
  GetNotesQuerySchema: () => GetNotesQuerySchema,
  Note: () => Note,
  NoteIdParamsSchema: () => NoteIdParamsSchema,
  NoteSchema: () => NoteSchema,
  UpdateNoteSchema: () => UpdateNoteSchema,
  default: () => notes_model_default
});
module.exports = __toCommonJS(notes_model_exports);
var import_sequelize = require("sequelize");
var import_database = __toESM(require("../../config/database"));
var import_zod = require("zod");
var import_zod_to_openapi = require("@asteasolutions/zod-to-openapi");
(0, import_zod_to_openapi.extendZodWithOpenApi)(import_zod.z);
const NoteSchema = import_zod.z.object({
  id: import_zod.z.number().int().openapi({
    example: 1,
    description: "Unique identifier for the note"
  }),
  note_uid: import_zod.z.string().openapi({
    example: "note-12345",
    description: "Unique UID for the note, used for client-side identification"
  }),
  user_id: import_zod.z.number().int().openapi({
    example: 1,
    description: "ID of the user who owns the note"
  }),
  is_wiki_link: import_zod.z.boolean().optional().default(false).openapi({
    example: false,
    description: "Indicates if the note is a wiki link"
  }),
  parent_note_id: import_zod.z.number().int().nullable().optional().openapi({
    example: null,
    description: "Optional parent note ID for hierarchical organization for wiki links notes"
  }),
  child_note_id: import_zod.z.number().int().nullable().optional().openapi({
    example: null,
    description: "Optional child note ID for hierarchical organization for wiki links notes"
  }),
  title: import_zod.z.string().min(1).openapi({
    example: "Weekly Summary",
    description: "Title of the note"
  }),
  content: import_zod.z.record(import_zod.z.string(), import_zod.z.any()).optional().openapi({
    description: "EditorJS JSON blocks (rich text content)"
  }),
  tags: import_zod.z.array(import_zod.z.string()).optional().openapi({
    example: ["weekly", "report", "internal"],
    description: "Optional tags for filtering and grouping notes"
  }),
  version: import_zod.z.number().int().default(1).openapi({
    example: 1,
    description: "Version number of the note"
  }),
  pinned: import_zod.z.boolean().default(false).openapi({
    example: false,
    description: "Whether the note is pinned for quick access"
  }),
  attachment_ids: import_zod.z.array(import_zod.z.number().int()).optional().openapi({
    example: [1, 2, 3],
    description: "Array of attachment IDs linked to this note"
  }),
  note_type: import_zod.z.enum(["note", "canvas", "quick_capture"]).default("note").openapi({
    example: "note",
    description: "Type of the note"
  }),
  created_at: import_zod.z.date().optional().openapi({
    type: "string",
    format: "date-time",
    example: "2025-10-08T09:00:00Z",
    description: "Timestamp when the note was created"
  }),
  updated_at: import_zod.z.date().optional().openapi({
    type: "string",
    format: "date-time",
    example: "2025-10-08T09:00:00Z",
    description: "Timestamp when the note was last updated"
  })
}).openapi({
  title: "Note",
  description: "Represents a note entity storing content in JSON format"
});
const CreateNoteSchema = NoteSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  user_id: true,
  note_uid: true,
  child_note_id: true
}).openapi({
  title: "CreateNoteInput",
  description: "Payload for creating a new note"
});
const UpdateNoteSchema = NoteSchema.partial().omit({
  id: true,
  user_id: true,
  updated_at: true,
  note_uid: true,
  created_at: true
}).openapi({
  title: "UpdateNoteInput",
  description: "Payload for updating an existing note"
});
const GetNotesQuerySchema = import_zod.z.object({
  id: import_zod.z.coerce.number().int().positive().optional().openapi({
    example: 1,
    description: "Filter by note ID"
  }),
  note_uid: import_zod.z.string().optional().openapi({
    example: "note-123",
    description: "Filter by note UID"
  }),
  title: import_zod.z.string().optional().openapi({
    example: "My Note",
    description: "Filter by title"
  }),
  pinned: import_zod.z.enum(["true", "false"]).transform((val) => val === "true").optional().openapi({
    example: "true",
    description: "Filter by pinned status"
  }),
  search: import_zod.z.string().optional().openapi({
    example: "meeting",
    description: "Search across title (partial match)"
  }),
  page: import_zod.z.coerce.number().int().positive().default(1).optional().openapi({
    example: 1,
    description: "Page number"
  }),
  limit: import_zod.z.coerce.number().int().positive().max(100).default(10).optional().openapi({
    example: 10,
    description: "Items per page"
  }),
  sort: import_zod.z.enum(["asc", "desc"]).default("desc").optional().openapi({
    example: "desc",
    description: "Sort order"
  }),
  sort_by: import_zod.z.enum(["created_at", "updated_at"]).default("updated_at").optional().openapi({
    example: "updated_at",
    description: "Field to sort by"
  }),
  created_at: import_zod.z.date().optional(),
  updated_at: import_zod.z.date().optional()
}).openapi({
  title: "GetNotesQueryParams",
  description: "Query parameters for filtering and paginating notes"
});
const NoteIdParamsSchema = import_zod.z.object({
  id: import_zod.z.string().regex(/^\d+$/, "ID must be a positive integer").openapi({
    example: "1",
    description: "Canvas ID (numeric string)"
  })
});
class Note extends import_sequelize.Model {
  id;
  note_uid;
  user_id;
  title;
  content;
  attachment_ids;
  tags;
  parent_note_id;
  is_wiki_link;
  version;
  pinned;
  note_type;
  created_at;
  updated_at;
}
Note.init(
  {
    id: {
      type: import_sequelize.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    note_type: {
      type: import_sequelize.DataTypes.ENUM("note", "canvas", "quick_capture"),
      allowNull: false,
      defaultValue: "note"
    },
    note_uid: {
      type: import_sequelize.DataTypes.STRING,
      allowNull: false
    },
    user_id: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: import_sequelize.DataTypes.TEXT,
      allowNull: false
    },
    parent_note_id: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: true,
      comment: "Optional parent note ID for hierarchical organization for wiki links notes"
    },
    is_wiki_link: {
      type: import_sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    content: {
      type: import_sequelize.DataTypes.JSON,
      allowNull: true,
      comment: "EditorJS content blocks as JSON"
    },
    tags: {
      type: import_sequelize.DataTypes.JSON,
      allowNull: true,
      comment: "Array of tags (string[])"
    },
    version: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    attachment_ids: {
      type: import_sequelize.DataTypes.JSON,
      allowNull: true,
      comment: "Array of attachment IDs (number[])"
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
    tableName: "notes",
    timestamps: false,
    indexes: [
      {
        fields: ["note_uid"],
        unique: true
      }
    ]
  }
);
var notes_model_default = Note;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreateNoteSchema,
  GetNotesQuerySchema,
  Note,
  NoteIdParamsSchema,
  NoteSchema,
  UpdateNoteSchema
});
//# sourceMappingURL=notes.model.js.map
