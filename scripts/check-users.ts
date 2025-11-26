/**
 * Check Users Script
 * 
 * This script lists all users in the database to help identify the admin user.
 * 
 * Usage:
 *   npx tsx scripts/check-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Checking users in database...\n');

  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        team: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('   You need to create at least one admin user first.\n');
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. User Details:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role?.name || 'No role'}`);
      console.log(`   Role ID: ${user.roleId || 'null'}`);
      console.log(`   Team: ${user.team?.name || 'No team'}`);
      console.log(`   Team ID: ${user.teamId || 'null'}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Find potential admin users
    const adminUsers = users.filter(u => 
      u.role?.name?.toLowerCase().includes('admin') ||
      u.role?.name?.toLowerCase().includes('manager')
    );

    if (adminUsers.length > 0) {
      console.log('🔑 Potential admin users:');
      adminUsers.forEach(user => {
        console.log(`   - ${user.name || user.email} (${user.email})`);
      });
      console.log('');
    }

    console.log('💡 To use the cleanup script:');
    console.log('   1. Choose which user to preserve as admin');
    console.log('   2. Update the cleanup script with that user\'s name or email');
    console.log('   3. Run: npm run db:cleanup\n');

  } catch (error) {
    console.error('❌ Error checking users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
