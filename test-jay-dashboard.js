// Test Jay Vara's dashboard data flow
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testJayDashboard() {
  try {
    console.log('🔍 Testing Jay Vara Dashboard Data Flow\n');
    console.log('='.repeat(60));

    // 1. Find Jay Vara
    const jay = await prisma.user.findFirst({
      where: {
        name: { contains: 'Jay Vara', mode: 'insensitive' }
      },
      include: {
        role: true,
        team: true
      }
    });

    if (!jay) {
      console.log('❌ Jay Vara not found');
      return;
    }

    console.log('\n1️⃣ User Info:');
    console.log(`   Name: ${jay.name}`);
    console.log(`   Email: ${jay.email}`);
    console.log(`   Role: ${jay.role?.name}`);
    console.log(`   Team: ${jay.team?.name || 'No team'}`);
    console.log(`   User ID: ${jay.id}`);

    // 2. Check tickets created by Jay
    const createdTickets = await prisma.ticket.findMany({
      where: { createdBy: jay.id },
      include: {
        customer: { select: { name: true } },
        assignedUser: { select: { name: true } }
      }
    });

    console.log(`\n2️⃣ Tickets Created by Jay: ${createdTickets.length}`);
    createdTickets.forEach(t => {
      console.log(`   - #${t.ticketNumber}: ${t.title}`);
      console.log(`     Status: ${t.status}, Priority: ${t.priority}`);
      console.log(`     Assigned to: ${t.assignedUser?.name || 'Unassigned'}`);
    });

    // 3. Check tickets assigned to Jay
    const assignedTickets = await prisma.ticket.findMany({
      where: { assignedTo: jay.id },
      include: {
        customer: { select: { name: true } },
        creator: { select: { name: true } }
      }
    });

    console.log(`\n3️⃣ Tickets Assigned to Jay: ${assignedTickets.length}`);
    assignedTickets.forEach(t => {
      console.log(`   - #${t.ticketNumber}: ${t.title}`);
      console.log(`     Status: ${t.status}, Priority: ${t.priority}`);
      console.log(`     Created by: ${t.creator?.name || 'Unknown'}`);
    });

    // 4. Check tickets Jay is following
    const followedTickets = await prisma.ticketFollower.findMany({
      where: { userId: jay.id },
      include: {
        ticket: {
          include: {
            customer: { select: { name: true } },
            assignedUser: { select: { name: true } }
          }
        }
      }
    });

    console.log(`\n4️⃣ Tickets Jay is Following: ${followedTickets.length}`);
    followedTickets.forEach(f => {
      const t = f.ticket;
      console.log(`   - #${t.ticketNumber}: ${t.title}`);
      console.log(`     Status: ${t.status}, Priority: ${t.priority}`);
    });

    // 5. Simulate the Employee role filter
    const followedTicketIds = followedTickets.map(f => f.ticketId);
    
    const orConditions = [
      { createdBy: jay.id },
      { assignedTo: jay.id },
    ];
    
    if (followedTicketIds.length > 0) {
      orConditions.push({ id: { in: followedTicketIds } });
    }

    const employeeFilteredTickets = await prisma.ticket.findMany({
      where: {
        OR: orConditions
      },
      include: {
        customer: { select: { name: true } },
        assignedUser: { select: { name: true } },
        creator: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n5️⃣ Total Tickets Jay Should See (Employee Filter): ${employeeFilteredTickets.length}`);
    employeeFilteredTickets.forEach(t => {
      console.log(`   - #${t.ticketNumber}: ${t.title}`);
      console.log(`     Status: ${t.status}, Priority: ${t.priority}`);
      console.log(`     Created by: ${t.creator?.name || 'Unknown'}`);
      console.log(`     Assigned to: ${t.assignedUser?.name || 'Unassigned'}`);
      
      const reasons = [];
      if (t.createdBy === jay.id) reasons.push('Created by Jay');
      if (t.assignedTo === jay.id) reasons.push('Assigned to Jay');
      if (followedTicketIds.includes(t.id)) reasons.push('Following');
      console.log(`     Reason: ${reasons.join(', ')}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test Complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Created by Jay: ${createdTickets.length}`);
    console.log(`   - Assigned to Jay: ${assignedTickets.length}`);
    console.log(`   - Following: ${followedTickets.length}`);
    console.log(`   - Total visible: ${employeeFilteredTickets.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJayDashboard();
