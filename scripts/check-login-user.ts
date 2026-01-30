import { prisma } from '../lib/db';
import { PasswordUtils } from '../lib/auth';

async function checkUser() {
  const email = 'disha.bisht@cimconautomation.com';
  const password = 'cimcon@123';
  
  console.log('Checking user:', email);
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      roleId: true,
      teamId: true,
      password: true,
    },
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('✅ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Name:', user.name);
  console.log('  Active:', user.isActive);
  console.log('  Role ID:', user.roleId);
  console.log('  Team ID:', user.teamId);
  console.log('  Password hash:', user.password.substring(0, 20) + '...');
  
  // Test password verification
  const isValid = await PasswordUtils.verifyPassword(password, user.password);
  console.log('\nPassword verification for "' + password + '":', isValid ? '✅ VALID' : '❌ INVALID');
  
  await prisma.$disconnect();
}

checkUser().catch(console.error);
