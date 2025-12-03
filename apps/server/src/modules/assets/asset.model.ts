import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ImageSchema = z
  .object({
    id: z.number().int().openapi({
      example: 1,
      description: 'Unique identifier for the image record',
    }),

    url: z.url().openapi({
      example: 'https://s3.amazonaws.com/bucket-name/images/abc123.png',
      description: 'Publicly accessible image URL on S3',
    }),
    user_Id: z.number().int().openapi({
      example: 42,
      description: 'ID of the user who uploaded the image',
    }),
    s3_key: z.string().min(1).openapi({
      example: 'images/abc123.png',
      description: 'S3 object key used to fetch or delete the file',
    }),

    file_name: z.string().min(1).openapi({
      example: 'profile_pic.png',
      description: 'Original uploaded file name',
    }),

    file_type: z.string().min(1).openapi({
      example: 'image/png',
      description: 'MIME type of the uploaded file',
    }),

    size_kb: z.number().positive().openapi({
      example: 245.7,
      description: 'File size in kilobytes',
    }),

    link_id: z.number().int().nullable().optional().openapi({
      example: 101,
      description: 'ID of the linked entity (e.g., document, post, canvas, etc.)',
    }),

    asset_type: z
      .enum(['Note', 'Post', 'Canvas', 'User', 'Other'])
      .nullable()
      .optional()
      .openapi({
        example: 'Note',
        description: 'Type of entity this image is associated with',
      }),

    metadata: z
      .record(z.string(), z.any())
      .nullable()
      .optional()
      .openapi({
        example: { width: 800, height: 600 },
        description: 'Optional metadata about the image (dimensions, EXIF, etc.)',
      }),

    created_at: z.date().optional().openapi({
      type: 'string',
      format: 'date-time',
      example: '2025-10-08T09:00:00Z',
      description: 'Timestamp when the image record was created',
    }),

    updated_at: z.date().optional().openapi({
      type: 'string',
      format: 'date-time',
      example: '2025-10-08T09:00:00Z',
      description: 'Timestamp when the image record was last updated',
    }),
  })
  .openapi({
    title: 'ImageAssets',
    description: 'Represents an image stored in S3 with metadata and linkage information',
  });


export const CreateImageSchema = ImageSchema.omit({
  id: true,
}).openapi({
  title: 'CreateImageInput',
  description: 'Payload for uploading and storing image metadata',
});

export const UpdateImageSchema = ImageSchema.partial().omit({
  id: true,
  created_at: true,
}).openapi({
  title: 'UpdateImageInput',
  description: 'Payload for updating image metadata',
});

export type ImageAttributes = z.infer<typeof ImageSchema>;
export type ImageCreationAttributes = z.infer<typeof CreateImageSchema>;
export type ImageUpdateAttributes = z.infer<typeof UpdateImageSchema>;


export class ImageAssets
  extends Model<ImageAttributes, ImageCreationAttributes>
  implements ImageAttributes {
  public id!: number;
  public url!: string;
  public user_Id!: number;
  public s3_key!: string;
  public file_name!: string;
  public file_type!: string;
  public size_kb!: number;
  public link_id?: number | null;
  public asset_type?: 'Note' | 'Post' | 'Canvas' | 'User' | 'Other' | null;
  public metadata?: Record<string, any> | null;
  public created_at!: Date;
  public updated_at!: Date;
}

ImageAssets.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    s3_key: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    user_Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size_kb: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    link_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    asset_type: {
      type: DataTypes.ENUM('Note', 'Post', 'Canvas', 'User', 'Other'),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata like dimensions, EXIF info, etc.',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,

    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'assets',
    timestamps: false
  }
);

export default ImageAssets;
