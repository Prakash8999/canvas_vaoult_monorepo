"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var users_model_exports = {};
__export(users_model_exports, {
  CreateUserSchema: () => CreateUserSchema,
  ForgotPasswordSchema: () => ForgotPasswordSchema,
  ResetPasswordWithOtpSchema: () => ResetPasswordWithOtpSchema,
  ResetPasswordWithTokenSchema: () => ResetPasswordWithTokenSchema,
  UpdateUserSchema: () => UpdateUserSchema,
  User: () => User,
  UserLoginSchema: () => UserLoginSchema,
  UserOtpVerifySchema: () => UserOtpVerifySchema,
  UserSchema: () => UserSchema,
  default: () => users_model_default
});
module.exports = __toCommonJS(users_model_exports);
var import_sequelize = require("sequelize");
var import_database = __toESM(require("../../config/database"));
var import_zod = require("zod");
var import_zod_to_openapi = require("@asteasolutions/zod-to-openapi");
(0, import_zod_to_openapi.extendZodWithOpenApi)(import_zod.z);
const UserSchema = import_zod.z.object({
  id: import_zod.z.number().int().openapi({
    example: 1,
    description: "Unique identifier for the record"
  }),
  created_at: import_zod.z.date().optional().openapi({
    type: "string",
    format: "date-time",
    example: "2025-10-08T09:00:00Z",
    description: "Timestamp when record was created"
  }),
  updated_at: import_zod.z.date().optional().openapi({
    type: "string",
    format: "date-time",
    example: "2025-10-08T09:00:00Z",
    description: "Timestamp when record was last updated"
  }),
  block: import_zod.z.boolean().default(false).openapi({
    example: false,
    description: "Whether the user is blocked"
  }),
  blocked_on: import_zod.z.date().nullable().optional().openapi({
    type: "string",
    format: "date-time",
    example: null,
    description: "Timestamp when the user was blocked"
  }),
  name: import_zod.z.string().min(1).max(100).openapi({
    example: "Prakash Jha",
    description: "Full name of the user"
  }),
  email: import_zod.z.email().max(100).openapi({
    example: "prakash@example.com",
    description: "Email address of the user"
  }),
  password: import_zod.z.string().min(6).max(255).openapi({
    example: "hashed_password_here",
    description: "Hashed user password"
  }),
  contact: import_zod.z.string().max(100).nullable().optional().openapi({
    example: "+91-9876543210",
    description: "Contact number of the user"
  }),
  bio: import_zod.z.string().max(255).nullable().optional().openapi({
    example: "Full-stack developer & open-source contributor",
    description: "Short biography or about info"
  }),
  website: import_zod.z.string().max(255).nullable().optional().openapi({
    example: "https://prakash.dev",
    description: "Personal or professional website URL"
  }),
  location: import_zod.z.string().max(100).nullable().optional().openapi({
    example: "Mumbai, India",
    description: "User\u2019s location or city"
  }),
  github: import_zod.z.string().max(100).nullable().optional().openapi({
    example: "prakashjha",
    description: "GitHub username"
  }),
  twitter: import_zod.z.string().max(100).nullable().optional().openapi({
    example: "prakash_codes",
    description: "Twitter handle or username"
  }),
  is_email_verified: import_zod.z.boolean().default(false).openapi({
    example: false,
    description: "Email verification status"
  }),
  profile_url: import_zod.z.string().max(255).nullable().optional().openapi({
    example: "https://cdn.example.com/avatar.jpg",
    description: "Profile picture URL of the user"
  }),
  ai_credits: import_zod.z.number().int().min(0).default(10).openapi({
    example: 10,
    description: "Number of AI credits available for the user"
  })
}).openapi({
  title: "User",
  description: "Represents a registered user in the system"
});
const CreateUserSchema = UserSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  block: true,
  blocked_on: true,
  is_email_verified: true
}).openapi({ title: "CreateUserInput" });
const UpdateUserSchema = UserSchema.partial().omit({ id: true, created_at: true, email: true, password: true, is_email_verified: true, block: true, blocked_on: true }).openapi({ title: "UpdateUserInput" });
const UserOtpVerifySchema = import_zod.z.object({ email: import_zod.z.email().max(100), otp: import_zod.z.string().length(6) }).strict();
const UserLoginSchema = import_zod.z.object({ email: import_zod.z.email().max(100), password: import_zod.z.string().max(255) }).strict();
const ForgotPasswordSchema = import_zod.z.object({ email: import_zod.z.email().max(100) }).strict();
const ResetPasswordWithOtpSchema = import_zod.z.object({
  email: import_zod.z.email().max(100),
  otp: import_zod.z.string().length(6),
  newPassword: import_zod.z.string().min(8).max(255)
}).strict();
const ResetPasswordWithTokenSchema = import_zod.z.object({
  token: import_zod.z.string().min(1),
  newPassword: import_zod.z.string().min(8).max(255)
}).strict();
class User extends import_sequelize.Model {
}
User.init(
  {
    id: {
      type: import_sequelize.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: import_sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: import_sequelize.DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: import_sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    contact: {
      type: import_sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    bio: {
      type: import_sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    website: {
      type: import_sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    location: {
      type: import_sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    github: {
      type: import_sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    twitter: {
      type: import_sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    is_email_verified: {
      type: import_sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    profile_url: {
      type: import_sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    block: {
      type: import_sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    blocked_on: {
      type: import_sequelize.DataTypes.DATE,
      allowNull: true
    },
    ai_credits: {
      type: import_sequelize.DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10
    },
    created_at: {
      type: import_sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: import_sequelize.Sequelize.literal("CURRENT_TIMESTAMP")
    },
    updated_at: {
      type: import_sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: import_sequelize.Sequelize.literal("CURRENT_TIMESTAMP")
    }
  },
  {
    sequelize: import_database.default,
    tableName: "users",
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
var users_model_default = User;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreateUserSchema,
  ForgotPasswordSchema,
  ResetPasswordWithOtpSchema,
  ResetPasswordWithTokenSchema,
  UpdateUserSchema,
  User,
  UserLoginSchema,
  UserOtpVerifySchema,
  UserSchema
});
//# sourceMappingURL=users.model.js.map
