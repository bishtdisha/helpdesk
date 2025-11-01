# Authentication Utilities

This module provides comprehensive authentication utilities for the application, including password hashing, session management, and user authentication.

## Features

- **Password Security**: bcrypt-based password hashing with configurable salt rounds
- **Session Management**: Secure token-based sessions with automatic expiry
- **User Authentication**: Complete registration, login, and logout functionality
- **Input Validation**: Email and password strength validation
- **TypeScript Support**: Full type definitions for all authentication data

## Quick Start

```typescript
import { AuthService, validateRegistrationData } from '@/lib/auth';

// Register a new user
const registrationData = {
  email: 'user@example.com',
  password: 'SecurePass123!',
  name: 'John Doe'
};

// Validate input first
const validation = validateRegistrationData(registrationData);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
  return;
}

// Register the user
const result = await AuthService.register(registrationData);
if (result.success) {
  console.log('User registered:', result.user);
} else {
  console.log('Registration failed:', result.error);
}
```

## API Reference

### AuthService

#### `register(data: UserRegistrationData): Promise<AuthResult>`
Register a new user with email and password.

#### `login(data: UserLoginData, sessionOptions?: SessionOptions): Promise<AuthResult>`
Authenticate a user and create a session.

#### `logout(token: string): Promise<boolean>`
Invalidate a user session.

#### `validateSession(token: string): Promise<SessionValidationResult>`
Validate a session token and return user data.

### PasswordUtils

#### `hashPassword(password: string): Promise<string>`
Hash a password using bcrypt.

#### `verifyPassword(password: string, hash: string): Promise<boolean>`
Verify a password against its hash.

### SessionUtils

#### `generateToken(): string`
Generate a secure random session token.

#### `createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<UserSession>`
Create a new user session.

#### `validateSession(token: string): Promise<SessionWithUser | null>`
Validate a session and return user data.

#### `invalidateSession(token: string): Promise<boolean>`
Invalidate a specific session.

### Validation Functions

#### `validatePassword(password: string): PasswordValidation`
Validate password strength requirements.

#### `validateRegistrationData(data): RegistrationValidation`
Validate user registration input.

#### `validateLoginData(data): LoginValidation`
Validate user login input.

## Environment Variables

Make sure to set these environment variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database"
SESSION_EXPIRY_HOURS=24
```

## Security Features

- **Password Hashing**: Uses bcrypt with 12 salt rounds
- **Session Security**: Cryptographically secure random tokens
- **Automatic Cleanup**: Expired sessions are automatically removed
- **Input Validation**: Comprehensive validation for all user inputs
- **SQL Injection Protection**: Uses Prisma ORM with parameterized queries