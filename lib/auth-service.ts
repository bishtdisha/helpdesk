import { prisma } from './db';
import { PasswordUtils, SessionUtils } from './auth';
import { activityTracker } from './rbac/activity-tracker';
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

      // Create the user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
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
        // Track failed login attempt
        await activityTracker.trackLogin(
          null,
          false,
          sessionOptions?.ipAddress,
          sessionOptions?.userAgent,
          { reason: 'user_not_found', email: data.email }
        );
        
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        // Track failed login attempt for inactive account
        await activityTracker.trackLogin(
          user.id,
          false,
          sessionOptions?.ipAddress,
          sessionOptions?.userAgent,
          { reason: 'account_inactive', email: data.email }
        );
        
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
        // Track failed login attempt for invalid password
        await activityTracker.trackLogin(
          user.id,
          false,
          sessionOptions?.ipAddress,
          sessionOptions?.userAgent,
          { reason: 'invalid_password', email: data.email }
        );
        
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

      // Track successful login
      await activityTracker.trackLogin(
        user.id,
        true,
        sessionOptions?.ipAddress,
        sessionOptions?.userAgent,
        { email: data.email, sessionId: session.token }
      );

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
    // Get session info before invalidating for audit logging
    const sessionValidation = await SessionUtils.validateSession(token);
    
    const result = await SessionUtils.invalidateSession(token);
    
    // Track logout if session was valid
    if (result && sessionValidation?.user) {
      await activityTracker.trackLogout(
        sessionValidation.user.id,
        ipAddress,
        userAgent,
        { sessionId: token }
      );
    }
    
    return result;
  }

  /**
   * Validate a session token
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
        // Track failed password change attempt
        await activityTracker.trackPasswordChange(
          userId,
          false,
          ipAddress,
          userAgent,
          { reason: 'invalid_current_password' }
        );
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

      // Track successful password change
      await activityTracker.trackPasswordChange(
        userId,
        true,
        ipAddress,
        userAgent,
        { sessionsInvalidated: true }
      );

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      
      // Track failed password change attempt
      await activityTracker.trackPasswordChange(
        userId,
        false,
        ipAddress,
        userAgent,
        { reason: 'system_error', error: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      return false;
    }
  }
}