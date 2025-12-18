import Chat from './models/chat.model';
import Message from './models/message.model';

export class ChatService {
    /**
     * Create a new chat for a user
     */
    static async createChat(userId: number, title: string = 'New Chat'): Promise<Chat> {
        return Chat.create({
            user_id: userId,
            title,
        });
    }

    /**
     * Get all chats for a user, sorted by last activity
     */
    static async getUserChats(userId: number, limit: number = 10, offset: number = 0): Promise<Chat[]> {
        return Chat.findAll({
            where: { user_id: userId },
            order: [['last_message_at', 'DESC']],
            limit,
            offset,
        });
    }

    /**
     * Get a specific chat by ID (ensuring user ownership)
     */
    static async getChatById(chatId: number, userId: number): Promise<Chat | null> {
        return Chat.findOne({
            where: { id: chatId, user_id: userId },
            include: [
                {
                    model: Message,
                    as: 'messages',
                    order: [['created_at', 'ASC']],
                },
            ],
        });
    }

    /**
     * Update chat metadata (e.g. title)
     */
    static async updateChat(chatId: number, userId: number, data: { title: string }): Promise<Chat | null> {
        const chat = await Chat.findOne({
            where: { id: chatId, user_id: userId },
        });

        if (!chat) return null;

        console.log(`[ChatService] Updating chat ${chatId} title to: ${data.title}`);
        await chat.update({ title: data.title });
        await chat.reload();

        return chat;
    }

    /**
     * Delete a chat and all its messages
     */
    static async deleteChat(chatId: number, userId: number): Promise<boolean> {
        const result = await Chat.destroy({
            where: { id: chatId, user_id: userId },
        });
        return result > 0;
    }

    /**
     * Save a message to a chat
     */
    static async saveMessage(
        chatId: number,
        role: 'user' | 'assistant',
        content: string,
        metadata?: { provider?: string; model?: string; tokensUsed?: number }
    ): Promise<Message> {
        const message = await Message.create({
            chat_id: chatId,
            role,
            content,
            provider: metadata?.provider,
            model: metadata?.model,
            tokens_used: metadata?.tokensUsed,
        });

        // Update chat's last_message_at
        await Chat.update(
            { last_message_at: new Date(), updated_at: new Date() },
            { where: { id: chatId } }
        );

        return message;
    }

    /**
     * Get messages for a specific chat
     */
    static async getMessages(chatId: number): Promise<Message[]> {
        return Message.findAll({
            where: { chat_id: chatId },
            order: [['created_at', 'ASC']],
        });
    }
}
