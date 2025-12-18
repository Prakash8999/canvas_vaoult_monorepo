import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../config/database';
import Chat from './chat.model';

export class Message extends Model {
    public id!: number;
    public chat_id!: number;
    public role!: 'user' | 'assistant';
    public content!: string;
    public provider?: string;
    public model?: string;
    public tokens_used?: number;
    public created_at!: Date;
}

Message.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        chat_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Chat,
                key: 'id',
            },
        },
        role: {
            type: DataTypes.ENUM('user', 'assistant'),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        model: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tokens_used: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'ai_messages',
        timestamps: true,
        updatedAt: false, // Messages are immutable
        createdAt: 'created_at',
    }
);

// Define associations
Message.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });
Chat.hasMany(Message, { foreignKey: 'chat_id', as: 'messages', onDelete: 'CASCADE' });

export default Message;
