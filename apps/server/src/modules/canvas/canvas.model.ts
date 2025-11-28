import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import Note from '../notes/notes.model';

extendZodWithOpenApi(z);

export const CanvasSchema = z
    .object({
        id: z.number().int().openapi({
            example: 1,
            description: 'Unique identifier for the canvas',
        }),
        canvas_uid: z.string().openapi({
            example: 'canvas-12345',
            description: 'Unique UID for the canvas, used for client-side identification',
        }),
        user_id: z.number().int().openapi({
            example: 1,
            description: 'ID of the user who owns the canvas',
        }),
        note_id: z.number().int().optional().nullable().openapi({
            example: 1,
            description: 'ID of the associated note (One-to-One relationship)',
        }),
        title: z.string().min(1).openapi({
            example: 'My Canvas',
            description: 'Name of the canvas',
        }),
        canvas_data: z.any().optional().openapi({
            description: 'Excalidraw canvas elements data'
        }),
        document_data: z
            .record(z.string(), z.any()).optional()
            .openapi({
                description: 'EditorJS document data associated with the canvas'
            }),
        viewport: z.object({
            scrollX: z.number().optional(),
            scrollY: z.number().optional(),
            zoom: z.number().optional(),
        }).optional().nullable().openapi({
            description: 'Viewport state (scroll, zoom)'
        }),
        pinned: z.boolean().default(false).openapi({
            example: false,
            description: 'Whether the canvas is pinned',
        }),
        created_at: z.date().optional().openapi({
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the canvas was created',
        }),
        updated_at: z.date().optional().openapi({
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the canvas was last updated',
        }),
    })
    .openapi({
        title: 'Canvas',
        description: 'Represents a canvas entity',
    });

// --------------------
// 🧩 Derived Schemas
// --------------------
export const CreateCanvasSchema = CanvasSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    user_id: true,
    canvas_uid: true,
}).openapi({
    title: 'CreateCanvasInput',
    description: 'Payload for creating a new canvas',
});

export const UpdateCanvasSchema = CanvasSchema.partial().omit({
    id: true,
    user_id: true,
    updated_at: true,
    canvas_uid: true,
    created_at: true,
}).openapi({
    title: 'UpdateCanvasInput',
    description: 'Payload for updating an existing canvas',
});

// --------------------
// 🧩 Types
// --------------------
export type CanvasAttributes = z.infer<typeof CanvasSchema>;
export type CanvasCreationAttributes = z.infer<typeof CreateCanvasSchema>;
export type CanvasUpdateAttributes = z.infer<typeof UpdateCanvasSchema>;

// --------------------
// 🧩 Sequelize Model
// --------------------
export class Canvas extends Model<CanvasAttributes, CanvasCreationAttributes> implements CanvasAttributes {
    public id!: number;
    public canvas_uid!: string;
    public user_id!: number;
    public note_id?: number | null;
    public title!: string;
    public canvas_data!: any;
    public document_data!: Record<string, any>;
    public viewport!: { scrollX?: number; scrollY?: number; zoom?: number } | null;
    public pinned!: boolean;
    public created_at!: Date;
    public updated_at!: Date;
    declare public note?: Note;
}

Canvas.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        canvas_uid: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        note_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            unique: true,
            references: {
                model: 'notes',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        canvas_data: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Excalidraw elements JSON',
        },
        document_data: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'EditorJS content JSON',
        },
        viewport: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Viewport state',
        },
        pinned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        tableName: 'canvases',
        timestamps: false,
        indexes: [
            {
                fields: ['canvas_uid'],
                unique: true,
            },
            {
                fields: ['user_id'],
            }
        ],
    }
);

export default Canvas;
