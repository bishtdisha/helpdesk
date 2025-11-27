import { prisma } from './db';
import { PasswordUtils, SessionUtils } from './auth';
import { userCache } from './cache/user-cache';
import type {
  UserRegistrationData,
  UserLoginData,
  AuthResult,
  SessionValidationResult,
  SafeUser,
  SessionOptions,
} from './types/auth';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: UserRegistrationData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Hash the password
      const hashedPassword = await PasswordUtils.hashPassword(data.password);

      // Create the user with role and optional team
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          roleId: data.roleId,
          teamId: data.teamId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          roleId: true,
          teamId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }
  }

  /**
   * Login a user and create a session
   */
  static async login(
    data: UserLoginData,
    sessionOptions?: SessionOptions
  ): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.',
        };
      }

      // Verify password
      const isValidPassword = await PasswordUtils.verifyPassword(
        data.password,
        user.password
      );

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Create session
      const session = await SessionUtils.createSession(
        user.id,
        sessionOptions?.ipAddress,
        sessionOptions?.userAgent,
        sessionOptions?.expiryHours
      );

      // Return safe user data (without password)
      const safeUser: SafeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        teamId: user.teamId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };



      return {
        success: true,
        user: safeUser,
        session,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    }
  }

  /**
   * Logout a user by invalidating their session
   */
  static async logout(token: string, ipAddress?: string, userAgent?: string): Promise<boolean> {
    const result = await SessionUtils.invalidateSession(token);
    return result;
  }

  /**
   * Validate a session token (optimized with full user data)
   */
  static async validateSession(token: string): Promise<SessionValidationResult> {
    const result = await SessionUtils.validateSession(token);

    if (!result) {
      return { valid: false };
    }

    return {
      valid: true,
      user: result.user,
      session: result.session,
    };
  }

  /**
   * Lightweight session validation - only checks if session is valid
   * Use this for simple authentication checks where you don't need full user data
   * This is ~3x faster than full validation
   */
  static async validateSessionLightweight(token: string): Promise<{ valid: boolean; userId?: string; sessionId?: string }> {
    const result = await SessionUtils.validateSessionLightweight(token);

    if (!result) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: result.userId,
      sessionId: result.sessionId,
    };
  }

  /**
   * Get user by ID (safe version without password)
   */
  static async getUserById(id: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
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
        teamLeaderships: {
          select: {
            id: true,
            teamId: true,
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

    return user;
  }

  /**
   * Update user profile
   */
  static async updateUser(
    id: string,
    data: { name?: string; email?: string }
  ): Promise<SafeUser | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          roleId: true,
          teamId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Invalidate cache when user data changes
      userCache.invalidateUser(id);

      return user;
    } catch (error) {
      console.error('Update user error:', error);
      return null;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return false;
      }

      // Verify current password
      const isValidPassword = await PasswordUtils.verifyPassword(
        currentPassword,
        user.password
      );

      if (!isValidPassword) {
        return false;
      }

      // Hash new password
      const hashedNewPassword = await PasswordUtils.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      // Invalidate all existing sessions for security
      await SessionUtils.invalidateUserSessions(userId);

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  }
}