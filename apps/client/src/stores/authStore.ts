import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  clearToken: () => void;
  checkAuth: () => boolean;
}

const TOKEN_KEY = 'auth_token';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      },
      clearToken: () => {
        set({ token: null, isAuthenticated: false });
        localStorage.removeItem(TOKEN_KEY);
      },
      checkAuth: () => {
        const token = get().token;
        const isAuthenticated = !!token;
        set({ isAuthenticated });
        return isAuthenticated;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.token;
        }
      },
    }
  )
);
