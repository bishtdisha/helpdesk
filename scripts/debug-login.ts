import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugLogin() {
  const testEmail = 'disha.bisht@cimconautomation.com';
  
  console.log('🔍 Debugging Login Issue...\n');
  
  try {
    // 1. Check database connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // 2. Check if user exists
    console.log('2️⃣ Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        role: true,
        team: true,
      },
    });

    if (!user) {
      console.log('❌ User not found in database');
      console.log('Available users:');
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, isActive: true },
      });
      console.table(allUsers);
      return;
    }

    console.log('✅ User found:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      role: user.role?.name,
      team: user.team?.name,
    });
    console.log('');

    // 3. Check password
    console.log('3️⃣ Checking password...');
    const testPassword = 'cimcon123'; // Replace with actual password
    
    console.log('Password hash in DB:', user.password.substring(0, 20) + '...');
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log(`Password validation: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log('');

    // 4. Check environment variables
    console.log('4️⃣ Checking environment variables...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('');

    // 5. Test password hashing
    console.log('5️⃣ Testing password hashing...');
    const newHash = await bcrypt.hash(testPassword, 10);
    const testHash = await bcrypt.compare(testPassword, newHash);
    console.log(`Bcrypt working: ${testHash ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // 6. Check sessions table
    console.log('6️⃣ Checking sessions...');
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`Active sessions for user: ${sessions.length}`);
    if (sessions.length > 0) {
      console.table(sessions.map(s => ({
        id: s.id.substring(0, 8),
        valid: s.expiresAt > new Date(),
        created: s.createdAt.toISOString(),
        expires: s.expiresAt.toISOString(),
      })));
    }
    console.log('');

    // 7. Summary
    console.log('📊 SUMMARY:');
    console.log('━'.repeat(50));
    if (!user) {
      console.log('❌ User does not exist in database');
    } else if (!user.isActive) {
      console.log('❌ User account is deactivated');
    } else if (!isValid) {
      console.log('❌ Password does not match');
      console.log('\n💡 To reset password, run:');
      console.log(`   npx tsx scripts/reset-user-password.ts ${testEmail}`);
    } else {
      console.log('✅ Everything looks good!');
      console.log('\n🔍 Check server logs for API errors:');
      console.log('   pm2 logs helpdesk');
      console.log('\n🔍 Check browser console for client errors');
      console.log('\n🔍 Verify environment variables on server:');
      console.log('   cat .env.production');
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();
