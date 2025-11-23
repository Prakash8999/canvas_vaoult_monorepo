import { ReactNode, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, refreshToken, isAuthenticated, clearToken } = useAuthStore();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    console.log('🚀 AuthProvider mounted, isAuthenticated:', isAuthenticated);

    // Check authentication status on app startup
    checkAuth();

    // Always attempt to refresh token on app startup
    // This handles the case where:
    // 1. User has a refresh token cookie but access token expired
    // 2. User reopens the app after closing it
    // 3. Access token in localStorage is stale
    const initializeAuth = async () => {
      if (hasInitialized.current) {
        console.log('⏭️ Already initialized, skipping');
        return;
      }

      hasInitialized.current = true;
      console.log('🔄 Initializing auth - attempting token refresh...');

      try {
        // Always try to refresh, even if we have a token
        // The backend will validate the refresh token cookie
        const newToken = await refreshToken();

        if (newToken) {
          // console.log('✅ Auth initialized successfully with refreshed token');
        } else {
          // console.log('⚠️ No refresh token available, user needs to login');
          // Clear any stale tokens
          clearToken();
        }
      } catch (error) {
        // console.error('❌ Failed to initialize auth:', error);
        // Clear auth state on initialization failure
        clearToken();
      }
    };

    initializeAuth();

    // Set up periodic token refresh
    // For testing: 15 seconds (token expires in 20 seconds)
    // For production: 50 minutes (token expires in 60 minutes)
    // const REFRESH_INTERVAL = 15 * 1000; // 15 seconds for testing
    const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes for production

    if (isAuthenticated) {
      refreshIntervalRef.current = setInterval(
        async () => {
          try {
            const newToken = await refreshToken();
            if (!newToken) {
              clearToken();
              if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
              }
            }
          } catch (error) {
            clearToken();
            if (refreshIntervalRef.current) {
              clearInterval(refreshIntervalRef.current);
            }
          }
        },
        REFRESH_INTERVAL
      );
    }

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [checkAuth, refreshToken, isAuthenticated, clearToken]);

  return <>{children}</>;
}