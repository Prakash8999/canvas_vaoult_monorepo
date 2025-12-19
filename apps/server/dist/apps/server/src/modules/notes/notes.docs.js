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
var notes_docs_exports = {};
__export(notes_docs_exports, {
  notesOpenApiDoc: () => notesOpenApiDoc,
  notesRegistry: () => notesRegistry
});
module.exports = __toCommonJS(notes_docs_exports);
var import_zod_to_openapi = require("@asteasolutions/zod-to-openapi");
var import_zod = require("zod");
var import_notes = require("./notes.model");
const NotesListResponseSchema = import_zod.z.object({
  notes: import_zod.z.array(import_notes.NoteSchema),
  pagination: import_zod.z.object({
    total: import_zod.z.number(),
    limit: import_zod.z.number(),
    offset: import_zod.z.number(),
    hasMore: import_zod.z.boolean()
  })
});
const SyncEventSchema = import_zod.z.object({
  id: import_zod.z.string().describe("Unique event identifier"),
  type: import_zod.z.enum(["note.create", "note.update", "note.delete"]).describe("Type of sync event"),
  resourceId: import_zod.z.string().describe("ID of the resource being synced"),
  payload: import_zod.z.record(import_zod.z.string(), import_zod.z.any()).optional().describe("Event payload data"),
  createdAt: import_zod.z.string().describe("Timestamp when event was created"),
  opSeq: import_zod.z.number().optional().describe("Operation sequence number")
});
const SyncRequestSchema = import_zod.z.object({
  clientId: import_zod.z.string().describe("Client/device identifier"),
  events: import_zod.z.array(SyncEventSchema).describe("Array of sync events")
});
const ConflictSchema = import_zod.z.object({
  resourceId: import_zod.z.string(),
  reason: import_zod.z.string(),
  clientVersion: import_zod.z.number().optional(),
  serverVersion: import_zod.z.number().optional(),
  serverState: import_zod.z.record(import_zod.z.string(), import_zod.z.any()).optional()
});
const SyncResponseSchema = import_zod.z.object({
  applied: import_zod.z.array(import_zod.z.string()).describe("IDs of successfully applied events"),
  updatedResources: import_zod.z.array(import_notes.NoteSchema).describe("Updated note resources"),
  conflicts: import_zod.z.array(ConflictSchema).describe("Any conflicts that occurred")
});
const ErrorResponseSchema = import_zod.z.object({
  success: import_zod.z.boolean(),
  message: import_zod.z.string(),
  error: import_zod.z.string().optional()
});
const notesRegistry = new import_zod_to_openapi.OpenAPIRegistry();
notesRegistry.register("Note", import_notes.NoteSchema);
notesRegistry.register("CreateNoteRequest", import_notes.CreateNoteSchema);
notesRegistry.register("UpdateNoteRequest", import_notes.UpdateNoteSchema);
notesRegistry.register("NotesListResponse", NotesListResponseSchema);
notesRegistry.register("SyncEvent", SyncEventSchema);
notesRegistry.register("SyncRequest", SyncRequestSchema);
notesRegistry.register("SyncResponse", SyncResponseSchema);
notesRegistry.register("Conflict", ConflictSchema);
notesRegistry.register("ErrorResponse", ErrorResponseSchema);
notesRegistry.registerPath({
  method: "post",
  path: "/api/v1/note/sync/events",
  tags: ["Notes"],
  summary: "Sync note events from client",
  description: "Process batched sync events from the frontend client for offline-first note synchronization. Handles create, update, and delete operations with conflict detection and version control.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: SyncRequestSchema }
      }
    }
  },
  responses: {
    200: {
      description: "Sync completed successfully",
      content: {
        "application/json": {
          schema: import_zod.z.object({
            success: import_zod.z.boolean(),
            message: import_zod.z.string(),
            data: SyncResponseSchema
          })
        }
      }
    },
    400: {
      description: "Invalid sync request format",
      content: {
        "application/json": { schema: ErrorResponseSchema }
      }
    },
    401: {
      description: "Unauthorized - Authentication required"
    },
    500: {
      description: "Internal server error"
    }
  }
});
notesRegistry.registerPath({
  method: "post",
  path: "/api/v1/note",
  tags: ["Notes"],
  summary: "Create a new note",
  description: "Create a new note with title, content, tags, and optional pinning. Content should be in EditorJS JSON format.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: import_notes.CreateNoteSchema }
      }
    }
  },
  responses: {
    201: {
      description: "Note created successfully",
      content: {
        "application/json": {
          schema: import_zod.z.object({
            success: import_zod.z.boolean(),
            message: import_zod.z.string(),
            data: import_notes.NoteSchema
          })
        }
      }
    },
    400: {
      description: "Invalid request data",
      content: {
        "application/json": { schema: ErrorResponseSchema }
      }
    },
    401: {
      description: "Unauthorized - Authentication required"
    },
    500: {
      description: "Internal server error"
    }
  }
});
notesRegistry.registerPath({
  method: "get",
  path: "/api/v1/note",
  tags: ["Notes"],
  summary: "Get all notes for the authenticated user",
  description: "Retrieve a paginated list of all notes belonging to the authenticated user. Supports pagination with limit and offset query parameters.",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "limit",
      in: "query",
      schema: { type: "integer", default: 50, minimum: 1, maximum: 100 },
      description: "Number of notes to return per page"
    },
    {
      name: "offset",
      in: "query",
      schema: { type: "integer", default: 0, minimum: 0 },
      description: "Number of notes to skip for pagination"
    }
  ],
  responses: {
    200: {
      description: "Notes retrieved successfully",
      content: {
        "application/json": {
          schema: import_zod.z.object({
            success: import_zod.z.boolean(),
            message: import_zod.z.string(),
            data: NotesListResponseSchema
          })
        }
      }
    },
    401: {
      description: "Unauthorized - Authentication required"
    },
    500: {
      description: "Internal server error"
    }
  }
});
notesRegistry.registerPath({
  method: "get",
  path: "/api/v1/notes/notes/{id}",
  tags: ["Notes"],
  summary: "Get a specific note by ID",
  description: "Retrieve a single note by its ID. Only the owner of the note can access it.",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "integer" },
      description: "Unique identifier of the note"
    }
  ],
  responses: {
    200: {
      description: "Note retrieved successfully",
      content: {
        "application/json": {
          schema: import_zod.z.object({
            success: import_zod.z.boolean(),
            message: import_zod.z.string(),
            data: import_notes.NoteSchema
          })
        }
      }
    },
    401: {
      description: "Unauthorized - Authentication required"
    },
    404: {
      description: "Note not found",
      content: {
        "application/json": { schema: ErrorResponseSchema }
      }
    },
    500: {
      description: "Internal server error"
    }
  }
});
notesRegistry.registerPath({
  method: "patch",
  path: "/api/v1/note/{id}",
  tags: ["Notes"],
  summary: "Update an existing note",
  description: "Update a note with new title, content, tags, or pinning status. Only the owner can update their notes. Supports partial updates.",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "integer" },
      description: "Unique identifier of the note to update"
    }
  ],
  request: {
    body: {
      content: {
        "application/json": { schema: import_notes.UpdateNoteSchema }
      }
    }
  },
  responses: {
    200: {
      description: "Note updated successfully",
      content: {
        "application/json": {
          schema: import_zod.z.object({
            success: import_zod.z.boolean(),
            message: import_zod.z.string(),
            data: import_notes.NoteSchema
          })
        }
      }
    },
    400: {
      description: "Invalid request data",
      content: {
        "application/json": { schema: ErrorResponseSchema }
      }
    },
    401: {
      description: "Unauthorized - Authentication required"
    },
    404: {
      description: "Note not found",
      content: {
        "application/json": { schema: ErrorResponseSchema }
      }
    },
    500: {
      description: "Internal server error"
    }
  }
});
notesRegistry.registerPath({
  method: "delete",
  path: "/api/v1/note/{id}",
  tags: ["Notes"],
  summary: "Delete a note",
  description: "Soft delete a note by its ID. Only the owner can delete their notes.",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "integer" },
      description: "Unique identifier of the note to delete"
    }
  ],
  responses: {
    200: {
      description: "Note deleted successfully",
      content: {
        "application/json": {
          schema: import_zod.z.object({
            success: import_zod.z.boolean(),
            message: import_zod.z.string(),
            data: import_zod.z.object({ deletedId: import_zod.z.number() })
          })
        }
      }
    },
    401: {
      description: "Unauthorized - Authentication required"
    },
    404: {
      description: "Note not found",
      content: {
        "application/json": { schema: ErrorResponseSchema }
      }
    },
    500: {
      description: "Internal server error"
    }
  }
});
const notesOpenApiDoc = new import_zod_to_openapi.OpenApiGeneratorV3(notesRegistry.definitions).generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Notes Service API",
    version: "1.0.0",
    description: "API for managing notes with offline-first sync capabilities"
  },
  servers: [{ url: "http://localhost:3000" }]
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  notesOpenApiDoc,
  notesRegistry
});
//# sourceMappingURL=notes.docs.js.map
