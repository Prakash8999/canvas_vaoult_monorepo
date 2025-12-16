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
// 🧩 API Functions
// -----------------------------

/**
 * Generate AI response
 */
export const generateAIResponse = async (
    request: AIGenerateRequest
): Promise<AIGenerateResponse> => {
    const response = await axios.post(`${API_BASE_URL}/ai/generate`, request, {
        withCredentials: true,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        }
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
