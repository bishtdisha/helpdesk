import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from './db';

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
   * Create a new user session
   */
  static async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    expiryHours?: number
  ) {
    const token = this.generateToken();
    const expiresAt = this.getExpiryDate(expiryHours);

    const session = await prisma.userSession.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return session;
  }

  /**
   * Validate a session token and return the associated user
   */
  static async validateSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            roleId: true,
            teamId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true,
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

    // Check if session exists and is not expired
    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session if it exists
      if (session) {
        await prisma.userSession.delete({
          where: { id: session.id },
        });
      }
      return null;
    }

    // Check if user is still active
    if (!session.user.isActive) {
      return null;
    }

    return {
      session,
      user: session.user,
    };
  }

  /**
   * Invalidate a session by token
   */
  static async invalidateSession(token: string): Promise<boolean> {
    try {
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
    const result = await prisma.userSession.deleteMany({
      where: { userId },
    });

    return result.count;
  }
}