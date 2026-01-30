import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log('Importing data to production database...');

    const rawData = fs.readFileSync('data-export.json', 'utf-8');
    const data = JSON.parse(rawData);

    // Import in order (respecting foreign key constraints)
    console.log('Importing roles...');
    for (const role of data.roles) {
      await prisma.role.upsert({
        where: { id: role.id },
        update: role,
        create: role,
      });
    }

    console.log('Importing users...');
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }

    console.log('Importing teams...');
    for (const team of data.teams) {
      await prisma.team.upsert({
        where: { id: team.id },
        update: team,
        create: team,
      });
    }

    console.log('Importing tickets...');
    for (const ticket of data.tickets) {
      await prisma.ticket.upsert({
        where: { id: ticket.id },
        update: ticket,
        create: ticket,
      });
    }

    console.log('Importing comments...');
    for (const comment of data.comments) {
      await prisma.comment.upsert({
        where: { id: comment.id },
        update: comment,
        create: comment,
      });
    }

    console.log('✅ Data imported successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
