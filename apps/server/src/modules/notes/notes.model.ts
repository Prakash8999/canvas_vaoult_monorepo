import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const NoteSchema = z
	.object({
		id: z.number().int().openapi({
			example: 1,
			description: 'Unique identifier for the note',
		}),

		title: z.string().min(1).openapi({
			example: 'Weekly Summary',
			description: 'Title of the note',
		}),

		content: z
			.record(z.string(), z.any())
			.openapi({
				description: 'EditorJS JSON blocks (rich text content)'
			}),

		tags: z.array(z.string()).optional().openapi({
			example: ['weekly', 'report', 'internal'],
			description: 'Optional tags for filtering and grouping notes',
		}),

		version: z.number().int().default(1).openapi({
			example: 1,
			description: 'Version number of the note',
		}),

		pinned: z.boolean().default(false).openapi({
			example: false,
			description: 'Whether the note is pinned for quick access',
		}),
		attachment_ids: z.array(z.number().int()).optional().openapi({
			example: [1, 2, 3],
			description: 'Array of attachment IDs linked to this note',
		}),
		created_at: z.date().optional().openapi({
			type: 'string',
			format: 'date-time',
			example: '2025-10-08T09:00:00Z',
			description: 'Timestamp when the note was created',
		}),

		updated_at: z.date().optional().openapi({
			type: 'string',
			format: 'date-time',
			example: '2025-10-08T09:00:00Z',
			description: 'Timestamp when the note was last updated',
		}),
	})
	.openapi({
		title: 'Note',
		description: 'Represents a note entity storing content in JSON format',
	});

// --------------------
// 🧩 Derived Schemas
// --------------------
export const CreateNoteSchema = NoteSchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
}).openapi({
	title: 'CreateNoteInput',
	description: 'Payload for creating a new note',
});

export const UpdateNoteSchema = NoteSchema.partial().omit({
	id: true,
	created_at: true,
}).openapi({
	title: 'UpdateNoteInput',
	description: 'Payload for updating an existing note',
});

// --------------------
// 🧩 Types
// --------------------
export type NoteAttributes = z.infer<typeof NoteSchema>;
export type NoteCreationAttributes = z.infer<typeof CreateNoteSchema>;
export type NoteUpdateAttributes = z.infer<typeof UpdateNoteSchema>;

// --------------------
// 🧩 Sequelize Model
// --------------------
export class Note
	extends Model<NoteAttributes, NoteCreationAttributes>
	implements NoteAttributes {
	public id!: number;
	public title!: string;
	public content!: Record<string, any>;
	public attachment_ids?: number[];
	public tags?: string[];
	public version!: number;
	public pinned!: boolean;
	public created_at!: Date;
	public updated_at!: Date;
}

Note.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		title: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		content: {
			type: DataTypes.JSON,
			allowNull: false,
			comment: 'EditorJS content blocks as JSON',
		},
		tags: {
			type: DataTypes.JSON,
			allowNull: true,
			comment: 'Array of tags (string[])'
		},
		version: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		attachment_ids: {
			type: DataTypes.JSON,
			allowNull: true,
			comment: 'Array of attachment IDs (number[])'
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
		tableName: 'notes',
	}
);

export default Note;
