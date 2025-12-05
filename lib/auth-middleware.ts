import { NextRequest } from 'next/server';
import { SessionUtils } from './auth';
import type { JWTPayload } from './jwt-utils';

/**
 * Fast authentication check using JWT
 * Returns user data from JWT without database query (~1ms)
 */
export async function fastAuthCheck(request: NextRequest): Promise<JWTPayload | null> {
  // Try JWT token first (fastest - no DB query)
  const jwtToken = request.cookies.get('auth-token')?.value;
  
  if (jwtToken) {
    const payload = SessionUtils.validateJWT(jwtToken);
    if (payload) {
      return payload;
    }
  }

  // Fallback to session token (slower - requires DB query)
  // This is for backward compatibility with existing sessions
  const sessionToken = request.cookies.get('session-token')?.value;
  
  if (sessionToken) {
    const result = await SessionUtils.validateSessionLightweight(sessionToken);
    if (result) {
      // Return minimal data for compatibility
      return {
        userId: result.userId,
        sessionId: result.sessionId,
        email: '', // Not available in lightweight validation
        name: null,
        roleId: null,
        roleName: null,
        teamId: null,
        teamName: null,
      };
    }
  }

  return null;
}

/**
 * Get full user data from JWT or database
 * Use this when you need complete user information
 */
export async function getAuthUser(request: NextRequest) {
  // Try JWT token first
  const jwtToken = request.cookies.get('auth-token')?.value;
  
  if (jwtToken) {
    const payload = SessionUtils.validateJWT(jwtToken);
    if (payload) {
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        roleId: payload.roleId,
        roleName: payload.roleName,
        teamId: payload.teamId,
        teamName: payload.teamName,
      };
    }
  }

  // Fallback to full session validation
  const sessionToken = request.cookies.get('session-token')?.value;
  
  if (sessionToken) {
    const result = await SessionUtils.validateSession(sessionToken);
    if (result) {
      return {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        roleId: result.user.roleId,
        roleName: result.user.role?.name || null,
        teamId: result.user.teamId,
        teamName: result.user.team?.name || null,
      };
    }
  }

  return null;
}
