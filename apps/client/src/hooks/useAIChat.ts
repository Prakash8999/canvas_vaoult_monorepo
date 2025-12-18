import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getChats,
    createChat,
    updateChat,
    deleteChat,
    getMessages,
    sendMessage,
    SendMessageRequest,
    Chat,
    Message
} from '@/api/aiApi';
import { aiKeys } from './useAI';
import { toast } from 'sonner';

// -----------------------------
// 🧩 Query Keys
// -----------------------------

export const chatKeys = {
    all: ['chats'] as const,
    list: (page?: number, limit?: number) => [...chatKeys.all, 'list', { page, limit }] as const,
    latest: () => [...chatKeys.all, 'latest'] as const,
    messages: (chatId: number) => [...chatKeys.all, 'messages', chatId] as const,
};

// -----------------------------
// 🧩 Hooks
// -----------------------------

/**
 * Hook to get latest chat (optimized for initial load)
 */
export function useLatestChat() {
    return useQuery({
        queryKey: chatKeys.latest(),
        queryFn: async () => {
            const chats = await getChats(1, 1);
            return chats.length > 0 ? chats[0] : null;
        },
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get user chats with pagination
 */
export function useChats(options: { page?: number; limit?: number; enabled?: boolean } = {}) {
    const { page = 1, limit = 10, enabled = true } = options;
    return useQuery({
        queryKey: chatKeys.list(page, limit),
        queryFn: () => getChats(page, limit),
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to manage chat mutations (create, update, delete)
 */
export function useChatMutations() {
    const queryClient = useQueryClient();

    const create = useMutation({
        mutationFn: createChat,
        onSuccess: (newChat) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.list() });
            queryClient.invalidateQueries({ queryKey: chatKeys.latest() });
            toast.success('Chat created');
        },
    });

    const update = useMutation({
        mutationFn: ({ id, title }: { id: number; title: string }) => updateChat(id, title),
        onSuccess: () => {
            // Updating title affects list and likely latest if it is latest
            queryClient.invalidateQueries({ queryKey: chatKeys.list() });
            queryClient.invalidateQueries({ queryKey: chatKeys.latest() });
        },
    });

    const remove = useMutation({
        mutationFn: deleteChat,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.list() });
            queryClient.invalidateQueries({ queryKey: chatKeys.latest() });
            toast.success('Chat deleted');
        },
    });

    return { create, update, remove };
}

/**
 * Hook to fetch messages for a chat
 */
export function useChatMessages(chatId: number | null) {
    return useQuery({
        queryKey: chatKeys.messages(chatId!),
        queryFn: () => getMessages(chatId!),
        enabled: !!chatId,
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: SendMessageRequest) => sendMessage(request),
        onSuccess: (data, variables) => {
            const { userMessage, assistantMessage, remainingCredits } = data;
            const chatId = variables.chatId;

            // 1. Update Messages Cache (Append new messages)
            queryClient.setQueryData<Message[]>(chatKeys.messages(chatId), (oldMessages) => {
                if (!oldMessages) return [userMessage, assistantMessage];
                // Check if we already optimistically added (not implemented here, but good practice)
                // Since we rely on server response now, just append
                return [...oldMessages, userMessage, assistantMessage];
            });

            // 2. Update Chat List Cache (Move to top + update preview)
            // Target the default first page
            queryClient.setQueryData<Chat[]>(chatKeys.list(1, 10), (oldChats) => {
                if (!oldChats) return oldChats;

                const otherChats = oldChats.filter(c => c.id !== chatId);
                const updatedChat = oldChats.find(c => c.id === chatId);

                if (updatedChat) {
                    // Create updated chat object
                    const newChat = {
                        ...updatedChat,
                        last_message_at: new Date().toISOString(), // approximate
                        // We could also update snippet if we had it
                    };
                    return [newChat, ...otherChats];
                }
                return oldChats;
            });

            // 3. Update Credits (only if NOT using custom key)
            // When usingCustomKey is true, credits should not be updated
            if (!data.usingCustomKey) {
                queryClient.setQueryData(aiKeys.credits(), data.remainingCredits);
            }
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || 'Failed to send message';
            toast.error(errorMessage);
        }
    });
}
