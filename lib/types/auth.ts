import { User, UserSession } from '@prisma/client';

// Core User type (from Prisma)
export type { User, UserSession } from '@prisma/client';

// Safe User type (without password) for client-side use
export type SafeUser = Omit<User, 'password'> & {
  role?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
};

// User registration data
export interface UserRegistrationData {
  email: string;
  password: string;
  name?: string;
}

// User login data
export interface UserLoginData {
  email: string;
  password: string;
}

// Session with user data
export interface SessionWithUser {
  session: UserSession;
  user: SafeUser;
}

// Authentication result
export interface AuthResult {
  success: boolean;
  user?: SafeUser;
  session?: UserSession;
  error?: string;
}

// Session validation result
export interface SessionValidationResult {
  valid: boolean;
  user?: SafeUser;
  session?: UserSession;
}

// Request context with user info
export interface AuthenticatedRequest {
  user: SafeUser;
  session: UserSession;
}

// Session creation options
export interface SessionOptions {
  expiryHours?: number;
  ipAddress?: string;
  userAgent?: string;
}