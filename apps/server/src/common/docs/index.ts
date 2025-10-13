import { userOpenApiDoc } from "../../modules/users/user.docs";
import { assetOpenApiDoc } from "../../modules/assets/asset.docs";
import { notesOpenApiDoc } from "../../modules/notes/notes.docs";

// Merge paths from all docs
const combinedPaths = {
  ...userOpenApiDoc.paths,
  ...assetOpenApiDoc.paths,
  ...notesOpenApiDoc.paths,
};

// Merge components from all docs
const combinedComponents = {
  schemas: {
    ...userOpenApiDoc.components?.schemas,
    ...assetOpenApiDoc.components?.schemas,
    ...notesOpenApiDoc.components?.schemas,
  },
  securitySchemes: {
    ...userOpenApiDoc.components?.securitySchemes,
    ...assetOpenApiDoc.components?.securitySchemes,
    ...notesOpenApiDoc.components?.securitySchemes,
  },
};

// Create combined OpenAPI document
export const combinedOpenApiDoc = {
  openapi: '3.0.0',
  info: {
    title: 'CanvasVault API',
    version: '1.0.0',
    description: 'Combined API documentation for User, Asset, and Notes services',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: combinedPaths,
  components: combinedComponents,
  tags: [
    { name: 'User', description: 'User management operations' },
    { name: 'Assets', description: 'File upload and management operations' },
    { name: 'Notes', description: 'Note management and sync operations' },
  ],
};