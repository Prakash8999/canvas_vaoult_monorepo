import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class SupportedModel extends Model {
    public id!: number;
    public provider!: string;
    public name!: string;
    public description!: string;
    public input_cost_per_1k!: number;
    public output_cost_per_1k!: number;
    public is_enabled!: boolean;
    public created_at!: Date;
    public updated_at!: Date;
}

SupportedModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
        },
        input_cost_per_1k: {
            type: DataTypes.DECIMAL(10, 6),
            defaultValue: 0,
        },
        output_cost_per_1k: {
            type: DataTypes.DECIMAL(10, 6),
            defaultValue: 0,
        },
        is_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'ai_supported_models',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['provider', 'name'],
            },
        ],
    }
);

export default SupportedModel;
