import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAllPasswords() {
  const defaultPassword = 'cimcon123';

  try {
    console.log('🔄 Resetting all user passwords...\n');

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log(`✅ ${user.email} - Password reset`);
    }

    // Clear all sessions
    await prisma.session.deleteMany({});
    console.log('\n🗑️  All sessions cleared');

    console.log('\n📊 Summary:');
    console.log(`✅ Reset ${users.length} user passwords`);
    console.log(`🔑 Default password: ${defaultPassword}`);
    console.log('\n👥 Users:');
    console.table(users.map(u => ({ email: u.email, name: u.name })));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllPasswords();
