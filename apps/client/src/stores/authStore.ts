import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

interface User {
  id: number;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  clearToken: () => void;
  checkAuth: () => boolean;
  refreshToken: () => Promise<string | null>;
}

const TOKEN_KEY = 'auth_token';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isRefreshing: false,
      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      },
      setUser: (user) => {
        set({ user });
      },
      clearToken: () => {
        set({ token: null, user: null, isAuthenticated: false });
        localStorage.removeItem(TOKEN_KEY);
      },
      checkAuth: () => {
        const token = get().token;
        const isAuthenticated = !!token;
        set({ isAuthenticated });
        return isAuthenticated;
      },
      refreshToken: async () => {
        const { isRefreshing } = get();

        // console.log('🔑 refreshToken called, isRefreshing:', isRefreshing);

        // Prevent multiple simultaneous refresh requests
        if (isRefreshing) {
          // console.log('⏳ Already refreshing, returning null');
          return null;
        }

        try {
          set({ isRefreshing: true });
          // console.log('📡 Sending refresh token request to:', `${API_BASE_URL}/api/v1/user/refresh-token`);

          const response = await axios.post(
            `${API_BASE_URL}/api/v1/user/refresh-token`,
            {},
            {
              withCredentials: true, // Important: send cookies with request
            }
          );

          // console.log('✅ Refresh token response:', response.data);
          const newToken = response.data.data;

          if (newToken) {
            //  console.log('💾 Saving new token to store');
            get().setToken(newToken);
            return newToken;
          }

          console.log('⚠️ No token in response');
          return null;
        } catch (error: any) {
          console.error('❌ Token refresh failed:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          // Clear auth state on refresh failure
          get().clearToken();
          return null;
        } finally {
          set({ isRefreshing: false });
          console.log('🏁 refreshToken finished');
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.token;
        }
      },
    }
  )
);
