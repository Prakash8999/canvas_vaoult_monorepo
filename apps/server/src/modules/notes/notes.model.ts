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

		child_note_id: z.number().int().nullable().optional().openapi({
			example: null,
			description: 'Optional child note ID for hierarchical organization for wiki links notes',
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
		note_type: z.enum(['note', 'canvas', 'quick_capture']).default('note').openapi({
			example: 'note',
			description: 'Type of the note',
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
	child_note_id: true,
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
export interface TagNoteRef {
	note_name: string;
	created_at: Date;
	updated_at: Date;
	note_uid: string;
	note_id: number;
}

export interface AllTagEntry {
	tag: string;
	notes: TagNoteRef[];
}

export interface ExtractedNote {
	id: number;
	title: string;
	created_at: Date;
	updated_at: Date;
	note_uid: string;
	tags: string[];
}

// --------------------
// 🧩 Types
// --------------------
export type NoteAttributes = z.infer<typeof NoteSchema>;
export type NoteCreationAttributes = z.infer<typeof CreateNoteSchema>;
export type NoteUpdateAttributes = z.infer<typeof UpdateNoteSchema>;

export const GetNotesQuerySchema = z.object({
	id: z.coerce.number().int().positive().optional().openapi({
		example: 1,
		description: 'Filter by note ID',
	}),
	note_uid: z.string().optional().openapi({
		example: 'note-123',
		description: 'Filter by note UID',
	}),
	title: z.string().optional().openapi({
		example: 'My Note',
		description: 'Filter by title',
	}),
	pinned: z.enum(['true', 'false']).transform(val => val === 'true').optional().openapi({
		example: 'true',
		description: 'Filter by pinned status',
	}),
	search: z.string().optional().openapi({
		example: 'meeting',
		description: 'Search across title (partial match)',
	}),
	page: z.coerce.number().int().positive().default(1).optional().openapi({
		example: 1,
		description: 'Page number',
	}),
	limit: z.coerce.number().int().positive().max(100).default(10).optional().openapi({
		example: 10,
		description: 'Items per page',
	}),
	sort: z.enum(['asc', 'desc']).default('desc').optional().openapi({
		example: 'desc',
		description: 'Sort order',
	}),
	sort_by: z.enum(['created_at', 'updated_at']).default('updated_at').optional().openapi({
		example: 'updated_at',
		description: 'Field to sort by',
	}),
	created_at: z.date().optional(),
	updated_at: z.date().optional(),
}).openapi({
	title: 'GetNotesQueryParams',
	description: 'Query parameters for filtering and paginating notes',
});

export const NoteIdParamsSchema = z.object({
	id: z.string().regex(/^\d+$/, 'ID must be a positive integer').openapi({
		example: '1',
		description: 'Canvas ID (numeric string)',
	}),
});

export type NoteQueryAttributes = z.infer<typeof GetNotesQuerySchema>;

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
	public note_type!: 'note' | 'canvas' | 'quick_capture';
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
		note_type: {
			type: DataTypes.ENUM('note', 'canvas', 'quick_capture'),
			allowNull: false,
			defaultValue: 'note',
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
