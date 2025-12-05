import jwt from 'jsonwebtoken';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  name: string | null;
  roleId: string | null;
  roleName: string | null;
  teamId: string | null;
  teamName: string | null;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export class JWTUtils {
  private static readonly SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static readonly EXPIRY = '24h'; // 24 hours

  /**
   * Generate a JWT token with user data
   */
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.SECRET, {
      expiresIn: this.EXPIRY,
    });
  }

  /**
   * Verify and decode a JWT token
   * Returns null if token is invalid or expired
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      // Token is invalid or expired
      return null;
    }
  }

  /**
   * Decode a JWT token without verification (for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}
