import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExistingUsers() {
  try {
    console.log('🔄 Updating existing users with default soft delete values...\n');

    // Update all users to ensure isDeleted is set to false
    const result = await prisma.user.updateMany({
      data: {
        isDeleted: false
      }
    });

    console.log(`✅ Updated ${result.count} users`);

    // Verify all users now have isDeleted set
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isDeleted: true,
        isActive: true
      }
    });

    console.log(`\n📊 Total users: ${allUsers.length}`);
    console.log('\nUser Status:');
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} - isDeleted: ${user.isDeleted}, isActive: ${user.isActive}`);
    });

    console.log('\n✅ All users now have isDeleted field set!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingUsers();
