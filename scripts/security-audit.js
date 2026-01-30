#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * Checks for common security issues before deployment
 * 
 * Usage: node scripts/security-audit.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Running Security Audit...\n');
console.log('='.repeat(60));

let issuesFound = 0;
let warnings = 0;

// Check 1: Verify .env is not in git
console.log('\n1. Checking if .env is tracked by git...');
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('.env') && gitignore.includes('.env.local')) {
    console.log('   ✅ .env files are in .gitignore');
  } else {
    console.log('   ⚠️  WARNING: .env files may not be properly ignored');
    warnings++;
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read .gitignore');
  issuesFound++;
}

// Check 2: Verify .env exists
console.log('\n2. Checking if .env file exists...');
if (fs.existsSync('.env')) {
  console.log('   ✅ .env file found');
  
  // Check 3: Verify secrets are strong
  console.log('\n3. Checking secret strength...');
  const envContent = fs.readFileSync('.env', 'utf8');
  
  // Check JWT_SECRET
  const jwtMatch = envContent.match(/JWT_SECRET="?([^"\n]+)"?/);
  if (jwtMatch) {
    const jwtSecret = jwtMatch[1];
    if (jwtSecret.length < 32) {
      console.log('   ❌ CRITICAL: JWT_SECRET is too short (< 32 characters)');
      issuesFound++;
    } else if (jwtSecret.includes('change-in-production') || jwtSecret.includes('your-secret')) {
      console.log('   ❌ CRITICAL: JWT_SECRET is using default/placeholder value');
      issuesFound++;
    } else if (jwtSecret.length < 64) {
      console.log('   ⚠️  WARNING: JWT_SECRET should be at least 64 characters');
      warnings++;
    } else {
      console.log('   ✅ JWT_SECRET appears strong');
    }
  } else {
    console.log('   ❌ CRITICAL: JWT_SECRET not found in .env');
    issuesFound++;
  }
  
  // Check SESSION_SECRET
  const sessionMatch = envContent.match(/SESSION_SECRET="?([^"\n]+)"?/);
  if (sessionMatch) {
    const sessionSecret = sessionMatch[1];
    if (sessionSecret.length < 32) {
      console.log('   ❌ CRITICAL: SESSION_SECRET is too short (< 32 characters)');
      issuesFound++;
    } else if (sessionSecret.includes('your-secret')) {
      console.log('   ❌ CRITICAL: SESSION_SECRET is using placeholder value');
      issuesFound++;
    } else {
      console.log('   ✅ SESSION_SECRET appears strong');
    }
  } else {
    console.log('   ⚠️  WARNING: SESSION_SECRET not found (optional)');
    warnings++;
  }
  
  // Check DATABASE_URL
  const dbMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
  if (dbMatch) {
    const dbUrl = dbMatch[1];
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      console.log('   ⚠️  WARNING: DATABASE_URL points to localhost (may be intentional for dev)');
      warnings++;
    } else {
      console.log('   ✅ DATABASE_URL configured');
    }
  } else {
    console.log('   ❌ CRITICAL: DATABASE_URL not found');
    issuesFound++;
  }
  
  // Check SMTP credentials
  const smtpUser = envContent.match(/SMTP_USER="?([^"\n]+)"?/);
  const smtpPass = envContent.match(/SMTP_PASSWORD="?([^"\n]+)"?/);
  if (smtpUser && smtpPass) {
    console.log('   ✅ SMTP credentials configured');
  } else {
    console.log('   ⚠️  WARNING: SMTP credentials not fully configured');
    warnings++;
  }
  
} else {
  console.log('   ❌ CRITICAL: .env file not found');
  issuesFound++;
}

// Check 4: Verify next.config.mjs doesn't ignore errors
console.log('\n4. Checking Next.js configuration...');
try {
  const nextConfig = fs.readFileSync('next.config.mjs', 'utf8');
  
  if (nextConfig.includes('ignoreDuringBuilds: true')) {
    console.log('   ❌ CRITICAL: ESLint errors are ignored during builds');
    issuesFound++;
  } else {
    console.log('   ✅ ESLint errors not ignored');
  }
  
  if (nextConfig.includes('ignoreBuildErrors: true')) {
    console.log('   ❌ CRITICAL: TypeScript errors are ignored during builds');
    issuesFound++;
  } else {
    console.log('   ✅ TypeScript errors not ignored');
  }
  
  if (nextConfig.includes('reactStrictMode: false')) {
    console.log('   ⚠️  WARNING: React Strict Mode is disabled');
    warnings++;
  } else {
    console.log('   ✅ React Strict Mode enabled');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read next.config.mjs');
  issuesFound++;
}

// Check 5: Verify uploads directory is protected
console.log('\n5. Checking uploads directory...');
if (fs.existsSync('uploads')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('uploads/')) {
    console.log('   ✅ Uploads directory is in .gitignore');
  } else {
    console.log('   ⚠️  WARNING: Uploads directory may be tracked by git');
    warnings++;
  }
} else {
  console.log('   ℹ️  Uploads directory does not exist yet');
}

// Check 6: Verify package.json has required scripts
console.log('\n6. Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'start', 'db:migrate:deploy'];
  
  let missingScripts = [];
  for (const script of requiredScripts) {
    if (!packageJson.scripts[script]) {
      missingScripts.push(script);
    }
  }
  
  if (missingScripts.length > 0) {
    console.log(`   ⚠️  WARNING: Missing scripts: ${missingScripts.join(', ')}`);
    warnings++;
  } else {
    console.log('   ✅ All required scripts present');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read package.json');
  issuesFound++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Security Audit Summary:');
console.log(`   Critical Issues: ${issuesFound}`);
console.log(`   Warnings: ${warnings}`);

if (issuesFound > 0) {
  console.log('\n❌ SECURITY AUDIT FAILED');
  console.log('   Fix critical issues before deploying to production!');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  SECURITY AUDIT PASSED WITH WARNINGS');
  console.log('   Review warnings before deploying to production.');
  process.exit(0);
} else {
  console.log('\n✅ SECURITY AUDIT PASSED');
  console.log('   No critical issues found.');
  process.exit(0);
}
