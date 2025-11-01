import { cookies } from 'next/headers';
import { AuthService } from './auth-service';
import type { SafeUser } from './types/auth';

/**
 * Get the current authenticated user from server-side cookies
 * This function can only be used in server components and API routes
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return null;
    }

    const sessionValidation = await AuthService.validateSession(sessionToken);

    if (!sessionValidation.valid || !sessionValidation.user) {
      return null;
    }

    return sessionValidation.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}