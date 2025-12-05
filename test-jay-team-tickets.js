const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJayTeamTickets() {
  console.log('🔍 Checking Jay\'s team tickets...\n');

  try {
    // Find Jay
    const jay = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'Jay',
          mode: 'insensitive'
        }
      },
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

    console.log('✅ Jay Info:');
    console.log(`   Role: ${jay.role?.name}`);
    console.log(`   Member of Team: ${jay.team?.name || 'None'}`);
    console.log(`   Team ID: ${jay.teamId || 'None'}`);
    console.log(`   Leading teams: ${jay.teamLeaderships.length}\n`);

    if (jay.teamLeaderships.length > 0) {
      jay.teamLeaderships.forEach(tl => {
        console.log(`   - Leading: ${tl.team.name} (ID: ${tl.teamId})`);
      });
    }

    // Check tickets in Jay's team
    if (jay.teamId) {
      const teamTickets = await prisma.ticket.findMany({
        where: { teamId: jay.teamId },
        include: {
          customer: { select: { name: true } },
          assignedUser: { select: { name: true } }
        }
      });

      console.log(`\n📊 Tickets in Jay's team (${jay.team?.name}): ${teamTickets.length}\n`);

      if (teamTickets.length > 0) {
        teamTickets.forEach((ticket, index) => {
          console.log(`${index + 1}. Ticket #${ticket.ticketNumber} - ${ticket.title}`);
          console.log(`   Status: ${ticket.status}, Priority: ${ticket.priority}`);
          console.log(`   Customer: ${ticket.customer.name}`);
          console.log(`   Assigned: ${ticket.assignedUser?.name || 'Unassigned'}\n`);
        });
      }
    }

    // Check tickets in teams Jay leads
    if (jay.teamLeaderships.length > 0) {
      const teamIds = jay.teamLeaderships.map(tl => tl.teamId);
      const ledTeamTickets = await prisma.ticket.findMany({
        where: { teamId: { in: teamIds } },
        include: {
          customer: { select: { name: true } },
          assignedUser: { select: { name: true } },
          team: { select: { name: true } }
        }
      });

      console.log(`\n📊 Tickets in teams Jay leads: ${ledTeamTickets.length}\n`);

      if (ledTeamTickets.length > 0) {
        ledTeamTickets.forEach((ticket, index) => {
          console.log(`${index + 1}. Ticket #${ticket.ticketNumber} - ${ticket.title}`);
          console.log(`   Team: ${ticket.team?.name}`);
          console.log(`   Status: ${ticket.status}, Priority: ${ticket.priority}`);
          console.log(`   Customer: ${ticket.customer.name}`);
          console.log(`   Assigned: ${ticket.assignedUser?.name || 'Unassigned'}\n`);
        });
      }
    }

    // Show total tickets in database
    const totalTickets = await prisma.ticket.count();
    console.log(`\n📈 Total tickets in database: ${totalTickets}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkJayTeamTickets();
