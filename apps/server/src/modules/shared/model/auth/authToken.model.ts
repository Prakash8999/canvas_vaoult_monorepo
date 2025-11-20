// models/authToken.model.ts

import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../../../config/database";

// ======================
// TYPES
// ======================

export interface AuthTokenAttributes {
    id: number;
    user_id: number;
    token_hash: string;
    ip_address: string | null;
    user_agent: string | null;
    revoked: boolean;
    replaced_by_token_id: number | null;
    expires_at: Date;
    created_at: Date;
    updated_at: Date;
}

export interface AuthTokenCreationAttributes
    extends Optional<
        AuthTokenAttributes,
        | "id"
        | "token_hash"
        | "ip_address"
        | "user_agent"
        | "revoked"
        | "replaced_by_token_id"
        | "created_at"
        | "updated_at"
    > { }

// ======================
// MODEL
// ======================

export class AuthToken
    extends Model<AuthTokenAttributes, AuthTokenCreationAttributes>
    implements AuthTokenAttributes {
    public id!: number;
    public user_id!: number;
    public token_hash!: string;
    public ip_address!: string | null;
    public user_agent!: string | null;
    public revoked!: boolean;
    public replaced_by_token_id!: number | null;
    public expires_at!: Date;
    public created_at!: Date;
    public updated_at!: Date;
}

// ======================
// INIT (best practice)
// ======================

AuthToken.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        token_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        ip_address: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.STRING(512),
            allowNull: true,
        },
        revoked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        replaced_by_token_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
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
        tableName: "auth_tokens",
        timestamps: false,
        underscored: true,
    }
);

export default AuthToken;
