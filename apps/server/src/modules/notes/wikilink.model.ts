import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { DataTypes, Model } from "sequelize";
import { z } from "zod";
import sequelize from '../../config/database';



extendZodWithOpenApi(z);
export const WikiLinkSchema = z
	.object({
		id: z.number().int().openapi({
			example: 1,
			description: "Unique identifier for the wiki link",
		}),
		child_note_id: z.number().int().openapi({
			example: 1,
			description: "ID of the child note associated with the wiki link",
		}),
		user_id: z.number().int().openapi({
			example: 1,
			description: "ID of the user who owns the wiki link",
		}),
		parent_note_id: z.number().int().openapi({
			example: 2,
			description: "ID of the parent note associated with the wiki link",
		}),
		created_at: z.date().openapi({
			type: "string",
			format: "date-time",
			example: "2023-10-01T12:00:00Z",
			description: "Timestamp when the wiki link was created",
		}),
		updated_at: z.date().optional().openapi({
			type: "string",
			format: "date-time",
			example: "2023-10-02T12:00:00Z",
			description: "Timestamp when the wiki link was last updated",
		}),
	}).openapi({
		title: "WikiLink",
		description: "Schema representing a wiki link between notes",
	});



export const CreateWikiLinkSchema = WikiLinkSchema.omit({
	id: true,
	user_id: true,
	created_at: true,
	updated_at: true,
});

export type WikiLinkAttributes = z.infer<typeof WikiLinkSchema>;
export type CreateWikiLinkAttributes = z.infer<typeof CreateWikiLinkSchema> & {
	user_id: number;
	created_at: Date;
	updated_at: Date;
	
};
export class WikiLink  
      extends Model <WikiLinkAttributes, CreateWikiLinkAttributes> 
	  implements WikiLinkAttributes { 
	  public id!: number;
	  public child_note_id!: number
	  public user_id!: number;
	  public parent_note_id!: number;
	  public created_at!: Date;
	  public updated_at?: Date;

	}



	WikiLink.init ({
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		child_note_id: {
			type: DataTypes.INTEGER,
			references: {
				model: "notes",
				key: "id",
			},
		},
		user_id: {
			type: DataTypes.INTEGER,
			references: {
				model: "users",
				key: "id",
			},
		},
		parent_note_id: {
			type: DataTypes.INTEGER,
			references: {
				model: "notes",
				key: "id",
			},
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: "wiki_links",
		timestamps: false,
	}
);

export default WikiLink;