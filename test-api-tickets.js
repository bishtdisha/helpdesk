const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulate the ticket access control logic
async function getTicketFiltersForUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      team: true,
      teamLeaderships: {
        include: {
          team: true
        }
      }
    }
  });

  if (!user?.role) {
    throw new Error('User role not found');
  }

  const roleName = user.role.name;
  console.log(`User: ${user.name}`);
  console.log(`Role: ${roleName}`);
  console.log(`Team: ${user.team?.name || 'None'}`);
  console.log(`Team ID: ${user.teamId || 'None'}`);
  console.log(`Leading teams: ${user.teamLeaderships.length}\n`);

  let filters;

  switch (roleName) {
    case 'Admin/Manager':
      console.log('✅ Admin/Manager - No filters (see all tickets)');
      filters = {};
      break;

    case 'Team Leader':
      console.log('✅ Team Leader - Filter by team tickets');
      const teamIds = user.teamLeaderships.map(tl => tl.teamId);
      if (user.teamId && !teamIds.includes(user.teamId)) {
        teamIds.push(user.teamId);
      }
      console.log(`   Team IDs: ${teamIds.join(', ')}`);
      
      if (teamIds.length === 0) {
        filters = { id: 'impossible' };
      } else {
        filters = { teamId: { in: teamIds } };
      }
      break;

    case 'Employee':
      console.log('✅ Employee - Filter by created/assigned/following');
      // Get followed tickets
      const followedTickets = await prisma.ticketFollower.findMany({
        where: { userId: userId },
        select: { ticketId: true }
      });
      const followedTicketIds = followedTickets.map(f => f.ticketId);
      
      filters = {
        OR: [
          { createdBy: userId },
          { assignedTo: userId },
          { id: { in: followedTicketIds } },
        ]
      };
      break;

    default:
      console.log('❌ Unknown role - No access');
      filters = { id: 'impossible' };
  }

  return filters;
}

async function testJayVaraTickets() {
  try {
    // Find Jay Vara
    const jayVara = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'Vara',
          mode: 'insensitive'
        }
      }
    });

    if (!jayVara) {
      console.log('❌ Jay Vara not found');
      return;
    }

    console.log('=== Testing Ticket Access for Jay Vara ===\n');
    
    const filters = await getTicketFiltersForUser(jayVara.id);
    
    console.log('\n📋 Applying filters to query tickets...\n');
    
    const tickets = await prisma.ticket.findMany({
      where: filters,
      include: {
        customer: { select: { name: true } },
        assignedUser: { select: { name: true } },
        creator: { select: { name: true } },
        team: { select: { name: true } }
      }
    });

    console.log(`✅ Found ${tickets.length} tickets\n`);

    if (tickets.length > 0) {
      tickets.forEach((ticket, index) => {
        console.log(`${index + 1}. Ticket #${ticket.ticketNumber} - ${ticket.title}`);
        console.log(`   Team: ${ticket.team?.name || 'No team'}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Customer: ${ticket.customer.name}`);
        console.log(`   Assigned: ${ticket.assignedUser?.name || 'Unassigned'}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJayVaraTickets();
