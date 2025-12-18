import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// -----------------------------
// 🧩 Types
// -----------------------------

export interface AIGenerateRequest {
    provider: 'gemini' | 'perplexity';
    model: string;
    input: string;
    options?: {
        temperature?: number;
        maxTokens?: number;
    };
}

export interface AIGenerateResponse {
    content: string;
    provider: string;
    model: string;
    tokensUsed?: number;
    metadata?: Record<string, unknown>;
    remainingCredits: number;
    creditsUsed: number;
    usingCustomKey: boolean;
}

export interface AICreditsResponse {
    credits: number;
}

export interface AIConstraintsResponse {
    maxInputLength: number;
    maxTokenEstimate: number;
    creditCostPerRequest: number;
    supportedProviders: string[];
    supportedModels: {
        gemini: readonly string[];
        perplexity: readonly string[];
    };
}

// -----------------------------
// 🧩 Chat Types
// -----------------------------

export interface Chat {
    id: number;
    user_id: number;
    title: string;
    created_at: string;
    updated_at: string;
    last_message_at: string;
}

export interface Message {
    id: number;
    chat_id: number;
    role: 'user' | 'assistant';
    content: string;
    provider?: string;
    model?: string;
    created_at: string;
}

export interface SendMessageRequest {
    chatId: number;
    input: string;
    provider: string;
    model: string;
    forceSystemKey?: boolean;
}

export interface SendMessageResponse {
    userMessage: Message;
    assistantMessage: Message;
    remainingCredits: number;
    creditsUsed: number;
    usingCustomKey: boolean;
}

// -----------------------------
// 🧩 API Functions
// -----------------------------

/**
 * Generate AI response (Legacy Phase 1 - Single shot)
 */
export const generateAIResponse = async (
    request: AIGenerateRequest
): Promise<AIGenerateResponse> => {
    const response = await axios.post(`${API_BASE_URL}/ai/generate`, request, {
        withCredentials: true,
    });
    return response.data.data;
};

/**
 * Get user's remaining AI credits
 */
export const getAICredits = async (): Promise<number> => {
    const response = await axios.get(`${API_BASE_URL}/ai/credits`, {
        withCredentials: true,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        }
    });
    return response.data.data.credits;
};

/**
 * Get AI constraints and supported providers/models
 */
export const getAIConstraints = async (): Promise<AIConstraintsResponse> => {
    const response = await axios.get(`${API_BASE_URL}/ai/constraints`, {
        withCredentials: true,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        }
    });
    return response.data.data;
};

// -----------------------------
// 🧩 Chat API Functions
// -----------------------------

export const getChats = async (page = 1, limit = 10): Promise<Chat[]> => {
    const response = await axios.get(`${API_BASE_URL}/ai/chats`, {
        params: { page, limit },
        withCredentials: true,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        }
    });
    return response.data.data;
};

export const createChat = async (title?: string): Promise<Chat> => {
    const response = await axios.post(
        `${API_BASE_URL}/ai/chats`,
        { title },
        {
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            }
        }
    );
    return response.data.data;
};

export const updateChat = async (id: number, title: string): Promise<Chat> => {
    const response = await axios.patch(
        `${API_BASE_URL}/ai/chats/${id}`,
        { title },
        {
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            }
        }
    );
    return response.data.data;
};

export const deleteChat = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/ai/chats/${id}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        withCredentials: true,
    });
};

export const getMessages = async (chatId: number): Promise<Message[]> => {
    const response = await axios.get(`${API_BASE_URL}/ai/chats/${chatId}/messages`, {
        withCredentials: true,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        }
    });
    return response.data.data;
};

export const sendMessage = async (
    request: SendMessageRequest
): Promise<SendMessageResponse> => {
    const response = await axios.post(
        `${API_BASE_URL}/ai/chats/message`,
        request,
        {
            withCredentials: true,

            headers: {
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            }
        }
    );
    return response.data.data;
};

// -----------------------------
// 🧩 BYOK Types & API
// -----------------------------

export interface SupportedModel {
    provider: string;
    name: string;
    description: string;
}

export interface UserAIConfig {
    id: number;
    provider: string;
    model: string;
    is_default: boolean;
    has_key: boolean;
}

export const getSupportedModels = async (): Promise<SupportedModel[]> => {
    const response = await axios.get(`${API_BASE_URL}/ai/models`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    return response.data.data;
};

export const getUserConfigs = async (): Promise<UserAIConfig[]> => {
    const response = await axios.get(`${API_BASE_URL}/ai/config`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    return response.data.data;
};

export const setUserConfig = async (
    provider: string,
    model: string,
    apiKey?: string,
    isDefault?: boolean
): Promise<UserAIConfig> => {
    const response = await axios.post(`${API_BASE_URL}/ai/config`,
        { provider, model, apiKey, isDefault },
        {
            withCredentials: true,
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        }
    );
    return response.data.data;
};

export const deleteUserConfig = async (provider: string, model: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/ai/config`, {
        data: { provider, model },
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
};
