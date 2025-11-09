import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import WikiLink from './wikilink.model';

extendZodWithOpenApi(z);

export const NoteSchema = z
	.object({
		id: z.number().int().openapi({
			example: 1,
			description: 'Unique identifier for the note',
		}),

		note_uid: z.string().openapi({
			example: 'note-12345',
			description: 'Unique UID for the note, used for client-side identification',
		}),
		user_id: z.number().int().openapi({
			example: 1,
			description: 'ID of the user who owns the note',
		}),
		is_wiki_link: z.boolean().optional().default(false).openapi({
			example: false,
			description: 'Indicates if the note is a wiki link',
		}),
		parent_note_id: z.number().int().nullable().optional().openapi({
			example: null,
			description: 'Optional parent note ID for hierarchical organization for wiki links notes',
		}),

		title: z.string().min(1).openapi({
			example: 'Weekly Summary',
			description: 'Title of the note',
		}),

		content: z
			.record(z.string(), z.any()).optional()
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
	user_id: true,
	note_uid: true,
}).openapi({
	title: 'CreateNoteInput',
	description: 'Payload for creating a new note',
});

export const UpdateNoteSchema = NoteSchema.partial().omit({
	id: true,
	user_id: true,
	updated_at: true,
	note_uid: true,
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
	public note_uid!: string;
	public user_id!: number;
	public title!: string;
	public content!: Record<string, any>;
	public attachment_ids?: number[];
	public tags?: string[];
	public parent_note_id?: number | null;
	public is_wiki_link!: boolean;
	public version!: number;
	public pinned!: boolean;
	public created_at!: Date;
	public updated_at!: Date;
	declare public child_wikilinks?: WikiLink[];
	declare public parent_wikilinks?: WikiLink[];
}

Note.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		note_uid: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		title: {
			type: DataTypes.TEXT,
			allowNull: false,
		},

		parent_note_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
			comment: 'Optional parent note ID for hierarchical organization for wiki links notes',
		},
		is_wiki_link: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		content: {
			type: DataTypes.JSON,
			allowNull: true,
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
		timestamps: false,
		indexes: [
			{
				fields: ['note_uid'],
				unique: true,
			}
		],
	}
);

export default Note;
