import { cookies, headers } from 'next/headers';
import { SessionUtils } from './auth';
import { AuthService } from './auth-service';
import { cache } from 'react';

/**
 * Request-level cached session validation
 * This ensures we only validate once per request, even if called multiple times
 */
const getCachedSessionValidation = cache(async (token: string) => {
  return await SessionUtils.validateSessionLightweight(token);
});

/**
 * Request-level cached user fetch
 * This ensures we only fetch user once per request
 */
const getCachedUser = cache(async (userId: string) => {
  return await AuthService.getUserById(userId);
});

/**
 * Get the current session from server-side cookies
 * Use this in API routes and server components
 */
export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;

  if (!token) {
    return null;
  }

  const result = await SessionUtils.validateSession(token);
  return result;
}

/**
 * Get the current user from server-side cookies (optimized with request-level caching)
 * Returns the user object if authenticated, null otherwise
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;

  if (!token) {
    return null;
  }

  // Use request-level cached validation (only validates once per request)
  const validation = await getCachedSessionValidation(token);
  
  if (!validation) {
    return null;
  }

  // Use request-level cached user fetch (only fetches once per request)
  const user = await getCachedUser(validation.userId);
  return user;
}

/**
 * Get userId from session token (fastest - lightweight validation only)
 * Returns userId if session is valid, null otherwise
 * Use this when you only need the userId and don't need role/team data
 */
export async function getUserIdFromMiddleware(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;

  if (!token) {
    return null;
  }

  // Use request-level cached validation
  const validation = await getCachedSessionValidation(token);
  return validation?.userId || null;
}

/**
 * Lightweight session check - only validates token without fetching full user data
 */
export async function validateServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;

  if (!token) {
    return null;
  }

  return await getCachedSessionValidation(token);
}
