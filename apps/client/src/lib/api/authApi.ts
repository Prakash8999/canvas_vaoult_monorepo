import apiClient from './axiosInstance';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
}

export interface SignupRequest {
    email: string;
    password: string;
    name?: string;
}

export interface SignupResponse {
    id: number;
    otp?: string;
}

export interface UserProfile {
    id: number;
    email: string;
    name?: string;
    // Add other user fields as needed
}

// Auth API functions
export const authApi = {
    // Login
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post('/user/login', credentials);
        return response.data.data;
    },

    // Signup
    signup: async (userData: SignupRequest): Promise<SignupResponse> => {
        const response = await apiClient.post('/user/signup', userData);
        return response.data.data;
    },

    // Get user profile
    getUserProfile: async (): Promise<UserProfile> => {
        const response = await apiClient.get('/user');
        return response.data.data;
    },

    // Logout
    logout: async (): Promise<void> => {
        await apiClient.post('/user/logout');
    },

    // Refresh token (usually handled automatically by interceptor)
    refreshToken: async (): Promise<string> => {
        const response = await apiClient.post('/user/refresh-token', {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
            }
        });
        return response.data.data;
    },
};

export default authApi;
