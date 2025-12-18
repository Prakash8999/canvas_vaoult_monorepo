import { z } from 'zod';

// -----------------------------
// 🧩 Database Interfaces
// -----------------------------

export interface IChat {
    id: number;
    user_id: number;
    title: string;
    created_at: Date;
    updated_at: Date;
    last_message_at: Date;
}

export interface IMessage {
    id: number;
    chat_id: number;
    role: 'user' | 'assistant';
    content: string;
    provider?: string;
    model?: string;
    tokens_used?: number;
    created_at: Date;
}

// -----------------------------
// 🧩 DTOs & Validation
// -----------------------------

export const CreateChatSchema = z.object({
    title: z.string().max(100).optional(),
});

export const UpdateChatSchema = z.object({
    title: z.string().max(100),
});

export const SendMessageSchema = z.object({
    chatId: z.number().int().positive(),
    input: z.string().min(1).max(2000), // Constraint from validation service
    provider: z.string(),
    model: z.string(),
    forceSystemKey: z.boolean().optional(),
});
