import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../../config/database';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);



// -----------------------------
// 🧩 Zod Schema for User
// -----------------------------
export const UserSchema = z.object({
	id: z.number().int().optional().openapi({
		example: 1,
		description: 'Unique identifier for the record',
	}),

	created_at: z.date().optional().openapi({
		type: 'string',
		format: 'date-time',
		example: '2025-10-08T09:00:00Z',
		description: 'Timestamp when record was created',
	}),

	updated_at: z.date().optional().openapi({
		type: 'string',
		format: 'date-time',
		example: '2025-10-08T09:00:00Z',
		description: 'Timestamp when record was last updated',
	}),

	block: z.boolean().default(false).openapi({
		example: false,
		description: 'Whether the user is blocked',
	}),

	blocked_on: z.date().nullable().optional().openapi({
		type: 'string',
		format: 'date-time',
		example: null,
		description: 'Timestamp when the user was blocked',
	}),
	name: z.string().min(1).max(100).openapi({
		example: 'Prakash Jha',
		description: 'Full name of the user',
	}),

	email: z.email().max(100).openapi({
		example: 'prakash@example.com',
		description: 'Email address of the user',
	}),

	password: z.string().min(6).max(255).openapi({
		example: 'hashed_password_here',
		description: 'Hashed user password',
	}),

	contact: z.string().max(100).nullable().optional().openapi({
		example: '+91-9876543210',
		description: 'Contact number of the user',
	}),

	bio: z.string().max(255).nullable().optional().openapi({
		example: 'Full-stack developer & open-source contributor',
		description: 'Short biography or about info',
	}),

	website: z.string().max(255).nullable().optional().openapi({
		example: 'https://prakash.dev',
		description: 'Personal or professional website URL',
	}),

	location: z.string().max(100).nullable().optional().openapi({
		example: 'Mumbai, India',
		description: 'User’s location or city',
	}),

	github: z.string().max(100).nullable().optional().openapi({
		example: 'prakashjha',
		description: 'GitHub username',
	}),

	twitter: z.string().max(100).nullable().optional().openapi({
		example: 'prakash_codes',
		description: 'Twitter handle or username',
	}),

	is_email_verified: z.boolean().default(false).openapi({
		example: false,
		description: 'Email verification status',
	}),

	profile_url: z.string().max(255).nullable().optional().openapi({
		example: 'https://cdn.example.com/avatar.jpg',
		description: 'Profile picture URL of the user',
	}),
}).openapi({
	title: 'User',
	description: 'Represents a registered user in the system',
});

// -----------------------------
// 🧩 Derived Zod Schemas
// -----------------------------
export const CreateUserSchema = UserSchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
	block: true,
	blocked_on: true,
	is_email_verified: true,
}).openapi({ title: 'CreateUserInput' });

export const UpdateUserSchema = UserSchema.partial()
	.omit({ id: true, created_at: true, email: true, password: true, is_email_verified: true, block: true, blocked_on: true })
	.openapi({ title: 'UpdateUserInput' });

export const UserOtpVerifySchema = z.object({ email: z.email().max(100), otp: z.string().length(6), }).strict();
export const UserLoginSchema = z.object({ email: z.email().max(100), password: z.string().max(255), }).strict();

// -----------------------------
// 🧩 Types
// -----------------------------
export type UserAttributes = z.infer<typeof UserSchema>;
export type UserCreationAttributes = z.infer<typeof CreateUserSchema>;
export type UserUpdateAttributes = z.infer<typeof UpdateUserSchema>;

// -----------------------------
// 🧩 Sequelize Model
// -----------------------------
export class User
	extends Model<UserAttributes, UserCreationAttributes>
	implements UserAttributes {
	declare id: number;
	declare name: string;
	declare email: string;
	declare password: string;
	declare contact?: string | null;
	declare bio?: string | null;
	declare website?: string | null;
	declare location?: string | null;
	declare github?: string | null;
	declare twitter?: string | null;
	declare is_email_verified: boolean;
	declare profile_url?: string | null;
	declare block: boolean;
	declare blocked_on?: Date | null;
	declare created_at: Date;
	declare updated_at: Date;
}

User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true,
			validate: { isEmail: true },
		},
		password: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		contact: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		bio: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		website: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		location: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		github: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		twitter: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		is_email_verified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		profile_url: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		block: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		blocked_on: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
		},
	},
	{
		sequelize,
		tableName: 'users',
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	
	}
);

export default User;
