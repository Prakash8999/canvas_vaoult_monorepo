import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  // If no token, redirect to landing page
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If token exists, allow access to protected route
  return <>{children}</>;
}

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const token = useAuthStore((state) => state.token);

  // If token exists, redirect to dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  // If no token, allow access to public route
  return <>{children}</>;
}