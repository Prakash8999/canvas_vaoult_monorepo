
export interface AuthenticatedUser {
  userId: number;
  email: string;
  deviceId: string;
  jti: string;
  isEmailVerified: boolean;
  name?: string;
  profileUrl?: string;
  isAdmin?: boolean;
  iat?: number;                      
  exp?: number;                      
}