import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app startup
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}