
export interface AuthenticatedUser {
  userId: string;
  email: string;
  isEmailVerified: boolean;
  name?: string;
  profileUrl?: string;
  isAdmin?: boolean;
  iat?: number;                      
  exp?: number;                      
}