import { prisma } from '../db';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { EmailService } from './email-service';

const TOKEN_EXPIRATION_MINUTES = 15;

export class PasswordResetService {
  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Request password reset - sends email with reset link
   */
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      });

      // Always return success message (don't reveal if email exists)
      const successMessage = 'If an account exists with that email, you will receive a password reset link shortly.';

      if (!user) {
        // Don't reveal that user doesn't exist
        return { success: true, message: successMessage };
      }

      if (!user.isActive) {
        // Don't reveal that account is inactive
        return { success: true, message: successMessage };
      }

      // Delete any existing unused tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      });

      // Generate new token
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000);

      // Save token to database
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // Send reset email
      try {
        const emailSent = await EmailService.sendPasswordResetEmail(
          user.email,
          token,
          user.name || undefined
        );

        if (!emailSent) {
          console.error('Failed to send password reset email to:', user.email);
          // Still return success to user (don't reveal email sending issues)
        } else {
          console.log('✅ Password reset email sent to:', user.email);
        }
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Continue anyway - don't reveal email issues to user
      }

      return { success: true, message: successMessage };
    } catch (error) {
      console.error('Error in requestPasswordReset:', error);
      return {
        success: false,
        message: 'An error occurred. Please try again later.',
      };
    }
  }

  /**
   * Validate reset token
   */
  static async validateResetToken(token: string): Promise<{ valid: boolean; userId?: string; message?: string }> {
    try {
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              isActive: true,
            },
          },
        },
      });

      if (!resetToken) {
        return { valid: false, message: 'Invalid or expired reset link.' };
      }

      if (resetToken.usedAt) {
        return { valid: false, message: 'This reset link has already been used.' };
      }

      if (new Date() > resetToken.expiresAt) {
        return { valid: false, message: 'This reset link has expired. Please request a new one.' };
      }

      if (!resetToken.user.isActive) {
        return { valid: false, message: 'This account is inactive.' };
      }

      return { valid: true, userId: resetToken.userId };
    } catch (error) {
      console.error('Error in validateResetToken:', error);
      return { valid: false, message: 'An error occurred. Please try again.' };
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate token
      const validation = await this.validateResetToken(token);
      if (!validation.valid || !validation.userId) {
        return { success: false, message: validation.message || 'Invalid token.' };
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters long.' };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and mark token as used
      await prisma.$transaction([
        // Update password
        prisma.user.update({
          where: { id: validation.userId },
          data: { password: hashedPassword },
        }),
        // Mark token as used
        prisma.passwordResetToken.update({
          where: { token },
          data: { usedAt: new Date() },
        }),
        // Delete all other sessions for this user (force re-login)
        prisma.userSession.deleteMany({
          where: { userId: validation.userId },
        }),
      ]);

      // Get user details for confirmation email
      const user = await prisma.user.findUnique({
        where: { id: validation.userId },
        select: { email: true, name: true },
      });

      if (user) {
        // Send confirmation email (don't fail if email fails)
        try {
          await EmailService.sendPasswordResetConfirmation(
            user.email,
            user.name || undefined
          );
          console.log('✅ Password reset confirmation email sent to:', user.email);
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Continue anyway - password was already reset
        }
      }

      return {
        success: true,
        message: 'Password reset successful. You can now log in with your new password.',
      };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return {
        success: false,
        message: 'An error occurred while resetting your password. Please try again.',
      };
    }
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }
}
