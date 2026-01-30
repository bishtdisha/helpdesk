import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3] || 'cimcon123';

  if (!email) {
    console.log('Usage: npx tsx scripts/reset-user-password.ts <email> [password]');
    console.log('Example: npx tsx scripts/reset-user-password.ts user@example.com newpass123');
    process.exit(1);
  }

  try {
    console.log(`🔄 Resetting password for: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Clear all sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    console.log('✅ Password reset successfully');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log('🗑️  All sessions cleared');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
