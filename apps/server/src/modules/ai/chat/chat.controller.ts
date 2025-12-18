import { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service';
import { AIService } from '../services/ai.service';
import { CreateChatSchema, SendMessageSchema, UpdateChatSchema } from './chat.types';

export class ChatController {
    // -----------------------------
    // Chat CRUD
    // -----------------------------

    /**
     * Create a new chat
     */
    static async createChat(req: Request, res: Response, next: NextFunction) {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.userId;
            const validated = CreateChatSchema.parse(req.body);

            const chat = await ChatService.createChat(userId, validated.title);

            res.status(201).json({
                success: true,
                data: chat,
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * Get all chats for the user
     */
    static async getChats(req: Request, res: Response, next: NextFunction) {
        try {
            // @ts-ignore
            const userId = req.user.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            const chats = await ChatService.getUserChats(userId, limit, offset);

            res.json({
                success: true,
                data: chats,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update chat metadata
     */
    static async updateChat(req: Request, res: Response, next: NextFunction) {
        try {
            // @ts-ignore
            const userId = req.user.userId;
            const chatId = parseInt(req.params.id);
            const validated = UpdateChatSchema.parse(req.body);

            const chat = await ChatService.updateChat(chatId, userId, validated);

            if (!chat) {
                res.status(404).json({ success: false, message: 'Chat not found' });
                return;
            }

            res.json({
                success: true,
                data: chat,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a chat
     */
    static async deleteChat(req: Request, res: Response, next: NextFunction) {
        try {
            // @ts-ignore
            const userId = req.user.userId;
            const chatId = parseInt(req.params.id);

            const success = await ChatService.deleteChat(chatId, userId);

            if (!success) {
                res.status(404).json({ success: false, message: 'Chat not found' });
                return;
            }

            res.json({
                success: true,
                message: 'Chat deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get messages for a specific chat
     */
    static async getMessages(req: Request, res: Response, next: NextFunction) {
        try {
            // @ts-ignore
            const userId = req.user.userId;
            const chatId = parseInt(req.params.id);

            // Verify ownership first
            const chat = await ChatService.getChatById(chatId, userId);
            if (!chat) {
                res.status(404).json({ success: false, message: 'Chat not found' });
                return;
            }

            // Messages are included in getChatById call above, but we can also fetch separately if needed.
            // For now, let's use the ones included or fetch them.
            // Since getChatById includes messages, we can just return them.
            // But if we want *only* messages, we might want a cleaner response.
            // Let's stick to returning messages from the chat object.

            res.json({
                success: true,
                data: chat.dataValues.messages || [],
            });
        } catch (error) {
            next(error);
        }
    }

    // -----------------------------
    // AI Interaction
    // -----------------------------

    /**
     * Send a message to AI and update chat history
     */
    static async sendMessage(req: Request, res: Response, next: NextFunction) {
        try {
            // @ts-ignore
            const userId = req.user.userId;

            // 1. Validate Input
            const { chatId, input, provider, model, forceSystemKey } = SendMessageSchema.parse(req.body);

            // 2. Verify Chat Ownership
            const chat = await ChatService.getChatById(chatId, userId);
            if (!chat) {
                res.status(404).json({ success: false, message: 'Chat not found' });
                return;
            }

            // 3. Store User Message
            const userMsg = await ChatService.saveMessage(chatId, 'user', input);

            // 4. Call AI Service (Phase 1 logic)
            // We need to construct an AIRequest object
            const aiRequest = {
                provider: provider as any,
                model,
                input,
            };

            // Key resolution is handled inside AIService (Phase 3 BYOK)
            const aiResponse = await AIService.executeRequest(userId, aiRequest, forceSystemKey);

            // 5. Store Assistant Response
            const assistantMsg = await ChatService.saveMessage(chatId, 'assistant', aiResponse.content, {
                provider: aiResponse.provider,
                model: aiResponse.model,
                tokensUsed: aiResponse.tokensUsed,
            });

            // 6. Return response with both new messages and credit info
            res.json({
                success: true,
                data: {
                    userMessage: userMsg,
                    assistantMessage: assistantMsg,
                    remainingCredits: aiResponse.remainingCredits,
                    creditsUsed: aiResponse.creditsUsed,
                    usingCustomKey: aiResponse.usingCustomKey,
                },
            });

        } catch (error) {
            next(error);
        }
    }
}
