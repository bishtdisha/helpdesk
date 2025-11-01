import { PasswordUtils, SessionUtils } from '../auth';
import { validatePassword, validateRegistrationData, validateLoginData } from '../validation';

// Test password hashing
async function testPasswordHashing() {
  console.log('Testing password hashing...');
  
  const password = 'TestPassword123!';
  const hash = await PasswordUtils.hashPassword(password);
  
  console.log('Original password:', password);
  console.log('Hashed password:', hash);
  
  const isValid = await PasswordUtils.verifyPassword(password, hash);
  console.log('Password verification:', isValid ? 'PASS' : 'FAIL');
  
  const isInvalid = await PasswordUtils.verifyPassword('wrongpassword', hash);
  console.log('Wrong password verification:', !isInvalid ? 'PASS' : 'FAIL');
}

// Test session token generation
function testSessionTokens() {
  console.log('\nTesting session tokens...');
  
  const token1 = SessionUtils.generateToken();
  const token2 = SessionUtils.generateToken();
  
  console.log('Token 1:', token1);
  console.log('Token 2:', token2);
  console.log('Tokens are different:', token1 !== token2 ? 'PASS' : 'FAIL');
  console.log('Token length:', token1.length, '(should be 64 chars)');
  
  const expiry = SessionUtils.getExpiryDate(24);
  console.log('Expiry date (24h from now):', expiry);
}

// Test validation functions
function testValidation() {
  console.log('\nTesting validation functions...');
  
  // Test password validation
  const strongPassword = validatePassword('StrongPass123!');
  console.log('Strong password validation:', strongPassword.isValid ? 'PASS' : 'FAIL');
  
  const weakPassword = validatePassword('weak');
  console.log('Weak password validation:', !weakPassword.isValid ? 'PASS' : 'FAIL');
  console.log('Weak password errors:', weakPassword.errors);
  
  // Test registration validation
  const validRegistration = validateRegistrationData({
    email: 'test@example.com',
    password: 'StrongPass123!',
    name: 'Test User'
  });
  console.log('Valid registration:', validRegistration.isValid ? 'PASS' : 'FAIL');
  
  const invalidRegistration = validateRegistrationData({
    email: 'invalid-email',
    password: 'weak',
    name: ''
  });
  console.log('Invalid registration:', !invalidRegistration.isValid ? 'PASS' : 'FAIL');
  console.log('Registration errors:', invalidRegistration.errors);
}

// Run all tests
async function runTests() {
  console.log('=== Authentication Utilities Test ===\n');
  
  await testPasswordHashing();
  testSessionTokens();
  testValidation();
  
  console.log('\n=== Tests Complete ===');
}

describe('Authentication Utilities', () => {
  test('should have password hashing utilities', () => {
    expect(typeof PasswordUtils.hashPassword).toBe('function');
    expect(typeof PasswordUtils.verifyPassword).toBe('function');
  });

  test('should have session utilities', () => {
    expect(typeof SessionUtils.generateToken).toBe('function');
    expect(typeof SessionUtils.getExpiryDate).toBe('function');
  });

  test('should have validation functions', () => {
    expect(typeof validatePassword).toBe('function');
    expect(typeof validateRegistrationData).toBe('function');
    expect(typeof validateLoginData).toBe('function');
  });
});

// Export for potential use
export { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}