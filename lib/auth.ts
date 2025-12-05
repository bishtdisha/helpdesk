import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from './db';
import { performanceMonitor } from './performance-monitor';
import { userCache } from './cache/user-cache';
import { JWTUtils } from './jwt-utils';

// Password hashing utilities
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// Session token utilities
export class SessionUtils {
  private static readonly TOKEN_LENGTH = 32; // 32 bytes = 256 bits
  private static readonly DEFAULT_EXPIRY_HOURS = 24;

  /**
   * Generate a secure random session token
   */
  static generateToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Calculate session expiry date
   */
  static getExpiryDate(hours?: number): Date {
    const expiryHours = hours || this.DEFAULT_EXPIRY_HOURS;
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);
    return expiry;
  }

  /**
   * Create a new user session with JWT token
   */
  static async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    expiryHours?: number
  ) {
    const token = this.generateToken();
    const expiresAt = this.getExpiryDate(expiryHours);

    // Create session in database
    const session = await prisma.userSession.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            roleId: true,
            teamId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Generate JWT token with user data for fast validation
    const jwtToken = JWTUtils.generateToken({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      roleId: session.user.roleId,
      roleName: session.user.role?.name || null,
      teamId: session.user.teamId,
      teamName: session.user.team?.name || null,
      sessionId: session.id,
    });

    return {
      ...session,
      jwtToken, // Return JWT token for cookie
    };
  }

  /**
   * Validate a session token and return the associated user (optimized with caching)
   */
  static async validateSession(token: string) {
    const endTimer = performanceMonitor.startTimer('session_validation_full');
    
    // Try cache first
    const cachedResult = userCache.getSessionValidation(token);
    if (cachedResult) {
      endTimer({ source: 'cache', hasRole: !!cachedResult.user.role, hasTeam: !!cachedResult.user.team });
      return cachedResult;
    }

    // Cache miss - query database with optimized single query
    const result = await prisma.$queryRaw<Array<{
      session_id: string;
      session_token: string;
      session_expires_at: Date;
      session_ip_address: string | null;
      session_user_agent: string | null;
      session_created_at: Date;
      session_updated_at: Date;
      user_id: string;
      user_email: string;
      user_name: string | null;
      user_role_id: string | null;
      user_team_id: string | null;
      user_is_active: boolean;
      user_created_at: Date;
      user_updated_at: Date;
      role_id: string | null;
      role_name: string | null;
      role_description: string | null;
      team_id: string | null;
      team_name: string | null;
    }>>`
      SELECT 
        us.id as session_id,
        us.token as session_token,
        us."expiresAt" as session_expires_at,
        us."ipAddress" as session_ip_address,
        us."userAgent" as session_user_agent,
        us."createdAt" as session_created_at,
        us."updatedAt" as session_updated_at,
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        u."roleId" as user_role_id,
        u."teamId" as user_team_id,
        u."isActive" as user_is_active,
        u."createdAt" as user_created_at,
        u."updatedAt" as user_updated_at,
        r.id as role_id,
        r.name as role_name,
        r.description as role_description,
        t.id as team_id,
        t.name as team_name
      FROM user_sessions us
      INNER JOIN users u ON us."userId" = u.id
      LEFT JOIN roles r ON u."roleId" = r.id
      LEFT JOIN teams t ON u."teamId" = t.id
      WHERE us.token = ${token}
        AND us."expiresAt" > NOW()
        AND u."isActive" = true
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      // Clean up expired sessions in background (non-blocking)
      prisma.userSession.deleteMany({
        where: {
          token,
          expiresAt: { lt: new Date() }
        }
      }).catch(() => {}); // Silent cleanup
      
      endTimer({ source: 'database', found: false });
      return null;
    }

    const row = result[0];

    // Construct the response object
    const session = {
      id: row.session_id,
      token: row.session_token,
      expiresAt: row.session_expires_at,
      ipAddress: row.session_ip_address,
      userAgent: row.session_user_agent,
      createdAt: row.session_created_at,
      updatedAt: row.session_updated_at,
      userId: row.user_id,
    };

    const user = {
      id: row.user_id,
      email: row.user_email,
      name: row.user_name,
      roleId: row.user_role_id,
      teamId: row.user_team_id,
      isActive: row.user_is_active,
      createdAt: row.user_created_at,
      updatedAt: row.user_updated_at,
      role: row.role_id ? {
        id: row.role_id,
        name: row.role_name!,
        description: row.role_description,
      } : null,
      team: row.team_id ? {
        id: row.team_id,
        name: row.team_name!,
      } : null,
    };

    // Cache the result for future requests
    userCache.setSessionValidation(token, session, user);

    const finalResult = {
      session,
      user,
    };

    endTimer({ source: 'database', hasRole: !!user.role, hasTeam: !!user.team });
    return finalResult;
  }

  /**
   * Fast JWT validation - validates token without database query
   * Returns user data from JWT payload (0.5-2ms vs 100-200ms for DB query)
   */
  static validateJWT(token: string) {
    const endTimer = performanceMonitor.startTimer('jwt_validation');
    const payload = JWTUtils.verifyToken(token);
    endTimer({ found: !!payload });
    return payload;
  }

  /**
   * Lightweight session validation - only checks if session is valid (no user data)
   * Use this for simple authentication checks where you don't need full user data
   */
  static async validateSessionLightweight(token: string): Promise<{ userId: string; sessionId: string } | null> {
    const endTimer = performanceMonitor.startTimer('session_validation_lightweight');
    const result = await prisma.userSession.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
        user: { isActive: true }
      },
      select: {
        id: true,
        userId: true,
      }
    });

    const finalResult = result ? { userId: result.userId, sessionId: result.id } : null;
    endTimer({ found: !!finalResult });
    return finalResult;
  }

  /**
   * Invalidate a session by token
   */
  static async invalidateSession(token: string): Promise<boolean> {
    try {
      // Invalidate cache first
      userCache.invalidateSession(token);
      
      await prisma.userSession.delete({
        where: { token },
      });
      return true;
    } catch (error) {
      // Session might not exist, which is fine
      return false;
    }
  }

  /**
   * Clean up expired sessions for all users
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Invalidate all sessions for a specific user
   */
  static async invalidateUserSessions(userId: string): Promise<number> {
    // Invalidate cache first
    userCache.invalidateUserSessions(userId);
    
    const result = await prisma.userSession.deleteMany({
      where: { userId },
    });

    return result.count;
  }
}