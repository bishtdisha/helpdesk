#!/usr/bin/env node

/**
 * Test Login API
 * 
 * This script tests the login endpoint to verify it's working correctly
 * 
 * Usage: node scripts/test-login.js
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testLogin() {
  console.log('\n🧪 Testing Login API\n');
  console.log('=' .repeat(60));
  console.log(`Base URL: ${baseUrl}`);
  console.log('=' .repeat(60));

  const testCredentials = {
    email: 'disha.bisht@cimconautomation.com',
    password: 'cimcon@123'
  };

  console.log('\n📝 Test Credentials:');
  console.log(`Email: ${testCredentials.email}`);
  console.log(`Password: ${'*'.repeat(testCredentials.password.length)}`);

  try {
    console.log('\n🔄 Sending login request...');
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials),
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);

    // Get cookies from response
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      console.log('\n🍪 Cookies Set:');
      const cookieArray = cookies.split(',').map(c => c.trim());
      cookieArray.forEach(cookie => {
        const cookieName = cookie.split('=')[0];
        const isSecure = cookie.includes('Secure');
        const isHttpOnly = cookie.includes('HttpOnly');
        const sameSite = cookie.match(/SameSite=(\w+)/)?.[1] || 'None';
        
        console.log(`  ✓ ${cookieName}`);
        console.log(`    - Secure: ${isSecure ? '✅' : '❌'}`);
        console.log(`    - HttpOnly: ${isHttpOnly ? '✅' : '❌'}`);
        console.log(`    - SameSite: ${sameSite}`);
      });
    } else {
      console.log('\n⚠️  No cookies in response!');
    }

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Login Successful!');
      console.log('\n👤 User Data:');
      console.log(JSON.stringify(data.user, null, 2));
    } else {
      console.log('\n❌ Login Failed!');
      console.log('\n📋 Error Details:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('\n💥 Request Failed!');
    console.error('Error:', error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test completed\n');
}

// Run the test
testLogin().catch(console.error);
