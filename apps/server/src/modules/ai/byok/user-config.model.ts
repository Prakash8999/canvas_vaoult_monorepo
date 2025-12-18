import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import User from '../../users/users.model';

export class UserAIConfig extends Model {
    public id!: number;
    public user_id!: number;
    public provider!: string;
    public model!: string;
    public encrypted_api_key!: string | null;
    public is_default!: boolean;
    public created_at!: Date;
    public updated_at!: Date;
}

UserAIConfig.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        model: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        encrypted_api_key: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'ai_user_configs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Define associations
UserAIConfig.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserAIConfig, { foreignKey: 'user_id', as: 'aiConfigs' });

export default UserAIConfig;
