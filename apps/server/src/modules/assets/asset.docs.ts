import { OpenApiGeneratorV3, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from 'zod';

// Asset response schemas
const UploadedFileSchema = z.object({
  size: z.number().describe('File size in KB'),
  url: z.string().url().describe('Public URL of the uploaded file'),
  key: z.string().describe('S3 key of the uploaded file'),
});
const UploadResponseSchema = z.object({
  message: z.string(),
  data: UploadedFileSchema,
});

const DeleteFilesRequestSchema = z.object({
  keys: z.array(z.string()).min(1).describe('Array of S3 keys to delete'),
});

const DeleteFilesResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
});

export const assetRegistry = new OpenAPIRegistry();

// Register schemas
assetRegistry.register('UploadedFile', UploadedFileSchema);
assetRegistry.register('UploadResponse', UploadResponseSchema);
assetRegistry.register('DeleteFilesRequest', DeleteFilesRequestSchema);
assetRegistry.register('DeleteFilesResponse', DeleteFilesResponseSchema);

// Upload single image
assetRegistry.registerPath({
  method: 'post',
  path: '/api/v1/assets/upload',
  tags: ['Assets'],
  summary: 'Upload a single image file',
  description: 'Upload a single image file (JPEG, PNG, GIF, WebP, SVG) to S3. Specify fileType as "note" for note attachments or "canvas" for canvas images. Only authenticated users can upload files.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'fileType',
      in: 'query',
      required: true,
      schema: {
        type: 'string',
        enum: ['note', 'canvas'],
        default: 'canvas'
      },
      description: 'Type of file being uploaded'
    }
  ],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            image: z.any().openapi({
              type: 'string',
              format: 'binary',
              description: 'Image file to upload (JPEG, PNG, GIF, WebP, SVG only)'
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Image uploaded successfully',
      content: {
        'application/json': { schema: UploadResponseSchema },
      },
    },
    400: {
      description: 'Bad request - No file uploaded or invalid file type',
    },
    401: {
      description: 'Unauthorized - Authentication required',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

// Delete multiple files
assetRegistry.registerPath({
  method: 'delete',
  path: '/api/v1/assets/delete',
  tags: ['Assets'],
  summary: 'Delete multiple files from S3',
  description: 'Delete multiple files from S3 storage using their keys. Only authenticated users can delete files.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: DeleteFilesRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Files deleted successfully',
      content: {
        'application/json': { schema: DeleteFilesResponseSchema },
      },
    },
    400: {
      description: 'Bad request - Invalid keys array',
    },
    401: {
      description: 'Unauthorized - Authentication required',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

export const assetOpenApiDoc = new OpenApiGeneratorV3(assetRegistry.definitions).generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Asset Service API',
    version: '1.0.0',
    description: 'API for managing file uploads and deletions',
  },
  servers: [{ url: 'http://localhost:3000' }],
});