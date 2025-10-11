
export interface AuthenticatedUser {
  userId: number;
  email: string;
  isEmailVerified: boolean;
  name?: string;
  profileUrl?: string;
  isAdmin?: boolean;
  iat?: number;                      
  exp?: number;                      
}