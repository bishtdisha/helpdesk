const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testIndexes() {
  console.log('🔍 Testing Database Indexes Performance...\n');

  try {
    // Test 1: Query tickets by status (should use index)
    console.time('Query tickets by status');
    const openTickets = await prisma.ticket.findMany({
      where: { status: 'OPEN' },
      take: 10
    });
    console.timeEnd('Query tickets by status');
    console.log(`Found ${openTickets.length} open tickets\n`);

    // Test 2: Query tickets by priority (should use index)
    console.time('Query tickets by priority');
    const urgentTickets = await prisma.ticket.findMany({
      where: { priority: 'URGENT' },
      take: 10
    });
    console.timeEnd('Query tickets by priority');
    console.log(`Found ${urgentTickets.length} urgent tickets\n`);

    // Test 3: Query tickets by assignedTo (should use index)
    console.time('Query tickets by assignedTo');
    const assignedTickets = await prisma.ticket.findMany({
      where: { assignedTo: { not: null } },
      take: 10
    });
    console.timeEnd('Query tickets by assignedTo');
    console.log(`Found ${assignedTickets.length} assigned tickets\n`);

    // Test 4: Query users by roleId (should use new index)
    console.time('Query users by roleId');
    const usersWithRole = await prisma.user.findMany({
      where: { roleId: { not: null } },
      take: 10
    });
    console.timeEnd('Query users by roleId');
    console.log(`Found ${usersWithRole.length} users with roles\n`);

    // Test 5: Query users by teamId (should use new index)
    console.time('Query users by teamId');
    const usersWithTeam = await prisma.user.findMany({
      where: { teamId: { not: null } },
      take: 10
    });
    console.timeEnd('Query users by teamId');
    console.log(`Found ${usersWithTeam.length} users with teams\n`);

    // Test 6: Complex query with joins (should benefit from indexes)
    console.time('Complex query with joins');
    const ticketsWithDetails = await prisma.ticket.findMany({
      where: {
        status: 'OPEN',
        priority: { in: ['HIGH', 'URGENT'] }
      },
      include: {
        assignedUser: true,
        team: true,
        customer: true
      },
      take: 10
    });
    console.timeEnd('Complex query with joins');
    console.log(`Found ${ticketsWithDetails.length} tickets with details\n`);

    console.log('✅ All index tests completed successfully!');
    console.log('\n💡 If query times are under 50ms, indexes are working well.');
    console.log('   If times are over 100ms, you may need more data or additional optimization.');

  } catch (error) {
    console.error('❌ Error testing indexes:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testIndexes();
