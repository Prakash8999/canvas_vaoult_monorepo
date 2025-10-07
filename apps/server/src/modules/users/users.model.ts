
import { DataTypes, Model, Optional } from 'sequelize';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import sequelize from '../../config/database';
extendZodWithOpenApi(z);



// 2. Zod Schema for User
export const UserZodSchema = z.object({
	id: z.number().int(),
	name: z.string().max(100),
	email: z.email().max(100),
	password: z.string().max(255),
	contact: z.string().max(100).nullable().optional(),
	bio: z.string().max(255).nullable().optional(),
	website: z.string().max(255).nullable().optional(),
	location: z.string().max(100).nullable().optional(),
	github: z.string().max(100).nullable().optional(),
	twitter: z.string().max(100).nullable().optional(),
	is_email_verified: z.boolean().default(false),
	profile_url: z.string().max(100).optional(),
	block: z.boolean().default(false),
	blocked_at: z.date().nullable().optional(),
	created_at: z.date(),
	updated_at: z.date(),
}).strict();

// 1. Sequelize User Model
export type UserAttributes = z.infer<typeof UserZodSchema>;
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'contact' | 'created_at' | 'updated_at'> { }

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
	// Use `declare` so TypeScript knows the properties exist without emitting
	// runtime class fields that shadow Sequelize getters/setters.
	declare id: number;
	declare name: string;
	declare email: string;
	declare password: string;
	declare contact?: string | null;
	declare is_email_verified: boolean;
	declare profile_url: string;
	declare block: boolean;
	declare blocked_at?: Date | null;
	declare created_at: Date;
	declare updated_at: Date;
}

// static initialize(sequelize: Sequelize) {
User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true,
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
			defaultValue: null,
		},
		website: {
			type: DataTypes.STRING(255),
			allowNull: true,
			defaultValue: null,
		},
		location: {
			type: DataTypes.STRING(100),
			allowNull: true,
			defaultValue: null,
		},
		github: {
			type: DataTypes.STRING(100),
			allowNull: true,
			defaultValue: null,
		},
		twitter: {
			type: DataTypes.STRING(100),
			allowNull: true,
			defaultValue: null,
		},
		is_email_verified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		profile_url: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		block: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		blocked_at: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: 'users',
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);
// }



// 3. Zod Schema for User Creation (no id, created_at, updated_at)
export const UserCreateZodSchema = UserZodSchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
	is_email_verified: true,
	block: true,
	blocked_at: true,
});

export const UserOtpVerifySchema = z.object({
	email: z.email().max(100),
	otp: z.string().length(6),
}).strict();
export const UserLoginSchema = z.object({
	email: z.email().max(100),
	password: z.string().max(255),
}).strict();

// Only allow updating a subset of fields. Use `pick` to avoid attempting to omit
// properties that were already removed earlier (which throws in Zod).
export const UserProfileUpdateSchema = UserZodSchema
	.pick({
		name: true, contact: true, profile_url: true, password: true, bio: true,
		website: true,
		location: true,
		github: true,
		twitter: true,
	})
	.partial();
