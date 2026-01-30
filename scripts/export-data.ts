import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('Exporting data from local database...');

    const data = {
      users: await prisma.user.findMany(),
      roles: await prisma.role.findMany(),
      teams: await prisma.team.findMany(),
      tickets: await prisma.ticket.findMany(),
      comments: await prisma.comment.findMany(),
      // Add other tables as needed
    };

    fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
    console.log('✅ Data exported successfully to data-export.json');
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
