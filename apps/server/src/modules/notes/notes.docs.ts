import { OpenApiGeneratorV3, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from 'zod';
import { NoteSchema, CreateNoteSchema, UpdateNoteSchema } from './notes.model';

const NotesListResponseSchema = z.object({
  notes: z.array(NoteSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
  
});

const SyncEventSchema = z.object({
  id: z.string().describe('Unique event identifier'),
  type: z.enum(['note.create', 'note.update', 'note.delete']).describe('Type of sync event'),
  resourceId: z.string().describe('ID of the resource being synced'),
  payload: z.record(z.string(), z.any()).optional().describe('Event payload data'),
  createdAt: z.string().describe('Timestamp when event was created'),
  opSeq: z.number().optional().describe('Operation sequence number'),
});

const SyncRequestSchema = z.object({
  clientId: z.string().describe('Client/device identifier'),
  events: z.array(SyncEventSchema).describe('Array of sync events'),
});

const ConflictSchema = z.object({
  resourceId: z.string(),
  reason: z.string(),
  clientVersion: z.number().optional(),
  serverVersion: z.number().optional(),
  serverState: z.record(z.string(), z.any()).optional(),
});

const SyncResponseSchema = z.object({
  applied: z.array(z.string()).describe('IDs of successfully applied events'),
  updatedResources: z.array(NoteSchema).describe('Updated note resources'),
  conflicts: z.array(ConflictSchema).describe('Any conflicts that occurred'),
});

const ErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
});

export const notesRegistry = new OpenAPIRegistry();

// Register schemas
notesRegistry.register('Note', NoteSchema);
notesRegistry.register('CreateNoteRequest', CreateNoteSchema);
notesRegistry.register('UpdateNoteRequest', UpdateNoteSchema);
notesRegistry.register('NotesListResponse', NotesListResponseSchema);
notesRegistry.register('SyncEvent', SyncEventSchema);
notesRegistry.register('SyncRequest', SyncRequestSchema);
notesRegistry.register('SyncResponse', SyncResponseSchema);
notesRegistry.register('Conflict', ConflictSchema);
notesRegistry.register('ErrorResponse', ErrorResponseSchema);

// Sync Events endpoint
notesRegistry.registerPath({
  method: 'post',
  path: '/api/v1/note/sync/events',
  tags: ['Notes'],
  summary: 'Sync note events from client',
  description: 'Process batched sync events from the frontend client for offline-first note synchronization. Handles create, update, and delete operations with conflict detection and version control.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: SyncRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Sync completed successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: SyncResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid sync request format',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

// Create Note
notesRegistry.registerPath({
  method: 'post',
  path: '/api/v1/note',
  tags: ['Notes'],
  summary: 'Create a new note',
  description: 'Create a new note with title, content, tags, and optional pinning. Content should be in EditorJS JSON format.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateNoteSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Note created successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: NoteSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid request data',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

// Get All Notes
notesRegistry.registerPath({
  method: 'get',
  path: '/api/v1/note',
  tags: ['Notes'],
  summary: 'Get all notes for the authenticated user',
  description: 'Retrieve a paginated list of all notes belonging to the authenticated user. Supports pagination with limit and offset query parameters.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'limit',
      in: 'query',
      schema: { type: 'integer', default: 50, minimum: 1, maximum: 100 },
      description: 'Number of notes to return per page'
    },
    {
      name: 'offset',
      in: 'query',
      schema: { type: 'integer', default: 0, minimum: 0 },
      description: 'Number of notes to skip for pagination'
    }
  ],
  responses: {
    200: {
      description: 'Notes retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: NotesListResponseSchema,
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

// Get Single Note
notesRegistry.registerPath({
  method: 'get',
  path: '/api/v1/notes/notes/{id}',
  tags: ['Notes'],
  summary: 'Get a specific note by ID',
  description: 'Retrieve a single note by its ID. Only the owner of the note can access it.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'integer' },
      description: 'Unique identifier of the note'
    }
  ],
  responses: {
    200: {
      description: 'Note retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: NoteSchema,
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
    },
    404: {
      description: 'Note not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    500: {
      description: 'Internal server error',
    },
  },
});

// Update Note
notesRegistry.registerPath({
  method: 'patch',
  path: '/api/v1/note/{id}',
  tags: ['Notes'],
  summary: 'Update an existing note',
  description: 'Update a note with new title, content, tags, or pinning status. Only the owner can update their notes. Supports partial updates.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'integer' },
      description: 'Unique identifier of the note to update'
    }
  ],
  request: {
    body: {
      content: {
        'application/json': { schema: UpdateNoteSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Note updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: NoteSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid request data',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
    },
    404: {
      description: 'Note not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    500: {
      description: 'Internal server error',
    },
  },
});

// Delete Note
notesRegistry.registerPath({
  method: 'delete',
  path: '/api/v1/note/{id}',
  tags: ['Notes'],
  summary: 'Delete a note',
  description: 'Soft delete a note by its ID. Only the owner can delete their notes.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'integer' },
      description: 'Unique identifier of the note to delete'
    }
  ],
  responses: {
    200: {
      description: 'Note deleted successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({ deletedId: z.number() }),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
    },
    404: {
      description: 'Note not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    500: {
      description: 'Internal server error',
    },
  },
});


export const notesOpenApiDoc = new OpenApiGeneratorV3(notesRegistry.definitions).generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Notes Service API',
    version: '1.0.0',
    description: 'API for managing notes with offline-first sync capabilities',
  },
  servers: [{ url: 'http://localhost:3000' }],
});
