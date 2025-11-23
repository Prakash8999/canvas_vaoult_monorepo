import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

// Create axios instance
export const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    withCredentials: true, // Important: send cookies with requests
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        console.log('🔴 API Error:', {
            status: error.response?.status,
            url: originalRequest.url,
            hasRetried: originalRequest._retry
        });

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('🔄 401 Error detected, attempting token refresh...');

            // Skip refresh for the refresh-token endpoint itself
            if (originalRequest.url?.includes('/refresh-token')) {
                console.log('❌ Refresh token endpoint failed, clearing auth');
                useAuthStore.getState().clearToken();
                if (typeof window !== 'undefined') {
                    window.location.href = '/';
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                console.log('⏳ Already refreshing, queuing request...');
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        console.log('✅ Queued request resolved with new token');
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        console.log('❌ Queued request failed:', err);
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('🔑 Calling refreshToken...');
                // Attempt to refresh the token
                const newToken = await useAuthStore.getState().refreshToken();

                if (newToken) {
                    console.log('✅ Token refreshed successfully');
                    // Update the failed queue with the new token
                    processQueue(null, newToken);

                    // Retry the original request with new token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    }
                    console.log('🔄 Retrying original request with new token...');
                    return apiClient(originalRequest);
                } else {
                    console.log('❌ Token refresh returned null');
                    // Refresh failed, clear auth and reject
                    processQueue(new Error('Token refresh failed'), null);
                    useAuthStore.getState().clearToken();

                    // Optionally redirect to login
                    if (typeof window !== 'undefined') {
                        window.location.href = '/';
                    }

                    return Promise.reject(error);
                }
            } catch (refreshError) {
                console.error('❌ Token refresh error:', refreshError);
                processQueue(refreshError as Error, null);
                useAuthStore.getState().clearToken();

                // Optionally redirect to login
                if (typeof window !== 'undefined') {
                    window.location.href = '/';
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
