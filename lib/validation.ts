// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password strength validation
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// User registration data validation
export interface RegistrationValidation {
  isValid: boolean;
  errors: {
    email?: string[];
    password?: string[];
    name?: string[];
  };
}

export function validateRegistrationData(data: {
  email: string;
  password: string;
  name?: string;
}): RegistrationValidation {
  const errors: RegistrationValidation['errors'] = {};

  // Validate email
  if (!data.email) {
    errors.email = ['Email is required'];
  } else if (!isValidEmail(data.email)) {
    errors.email = ['Please enter a valid email address'];
  }

  // Validate password
  if (!data.password) {
    errors.password = ['Password is required'];
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
    }
  }

  // Validate name (optional but if provided, should not be empty)
  if (data.name !== undefined && data.name.trim().length === 0) {
    errors.name = ['Name cannot be empty if provided'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Login data validation
export interface LoginValidation {
  isValid: boolean;
  errors: {
    email?: string[];
    password?: string[];
  };
}

export function validateLoginData(data: {
  email: string;
  password: string;
}): LoginValidation {
  const errors: LoginValidation['errors'] = {};

  // Validate email
  if (!data.email) {
    errors.email = ['Email is required'];
  } else if (!isValidEmail(data.email)) {
    errors.email = ['Please enter a valid email address'];
  }

  // Validate password
  if (!data.password) {
    errors.password = ['Password is required'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}