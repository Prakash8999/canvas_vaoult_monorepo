import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../config/database';
import User from '../../../users/users.model';

export class Chat extends Model {
    public id!: number;
    public user_id!: number;
    public title!: string;
    public created_at!: Date;
    public updated_at!: Date;
    public last_message_at!: Date;
}

Chat.init(
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
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'New Chat',
        },
        last_message_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'ai_chats',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Define associations
Chat.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Chat, { foreignKey: 'user_id', as: 'chats' });

export default Chat;
