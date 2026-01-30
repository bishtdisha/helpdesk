#!/usr/bin/env node

/**
 * Generate Strong Secrets for Production
 * 
 * This script generates cryptographically secure random secrets
 * for JWT and session management.
 * 
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Strong Secrets for Production\n');
console.log('=' .repeat(60));

// Generate JWT secret (64 characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 JWT_SECRET (copy to .env):');
console.log(`JWT_SECRET="${jwtSecret}"`);

// Generate session secret (64 characters)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 SESSION_SECRET (copy to .env):');
console.log(`SESSION_SECRET="${sessionSecret}"`);

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. Never commit these secrets to version control');
console.log('2. Store them securely (password manager, secrets vault)');
console.log('3. Use different secrets for each environment');
console.log('4. Rotate secrets periodically (every 90 days)');
console.log('5. If secrets are compromised, regenerate immediately\n');

console.log('✅ Copy the above values to your .env file on the production server\n');
