// Main authentication service
export { AuthService } from '../auth-service';

// Utility classes
export { PasswordUtils, SessionUtils } from '../auth';

// Validation utilities
export {
  isValidEmail,
  validatePassword,
  validateRegistrationData,
  validateLoginData,
} from '../validation';

// Types
export type {
  User,
  UserSession,
  SafeUser,
  UserRegistrationData,
  UserLoginData,
  AuthResult,
  SessionValidationResult,
  AuthenticatedRequest,
  SessionOptions,
  SessionWithUser,
} from '../types/auth';

export type {
  PasswordValidation,
  RegistrationValidation,
  LoginValidation,
} from '../validation';

// Database connection
export { prisma, connectDB, disconnectDB } from '../db';