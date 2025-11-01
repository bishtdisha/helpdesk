import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllSessions() {
  try {
    console.log('🧹 Clearing all user sessions...');
    
    const result = await prisma.userSession.deleteMany({});
    
    console.log(`✅ Cleared ${result.count} sessions successfully!`);
    console.log('🔓 All users are now logged out.');
    
  } catch (error) {
    console.error('❌ Error clearing sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllSessions();