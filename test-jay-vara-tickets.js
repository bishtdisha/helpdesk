const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJayVaraTickets() {
  console.log('🔍 Checking Jay Vara\'s tickets...\n');

  try {
    // Find Jay Vara specifically
    const jayVara = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'Vara',
          mode: 'insensitive'
        }
      },
      include: {
        role: true,
        team: true
      }
    });

    if (!jayVara) {
      console.log('❌ Jay Vara not found. Let me search for all users with "Jay":\n');
      
      const allJays = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: 'Jay', mode: 'insensitive' } },
            { email: { contains: 'jay', mode: 'insensitive' } }
          ]
        },
        include: {
          role: true
        }
      });

      console.log(`Found ${allJays.length} users with "Jay":\n`);
      allJays.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role?.name || 'No role'}`);
        console.log(`   ID: ${user.id}\n`);
      });
      
      return;
    }

    console.log('✅ Found Jay Vara:');
    console.log(`   ID: ${jayVara.id}`);
    console.log(`   Name: ${jayVara.name}`);
    console.log(`   Email: ${jayVara.email}`);
    console.log(`   Role: ${jayVara.role?.name || 'No role'}`);
    console.log(`   Team: ${jayVara.team?.name || 'No team'}\n`);

    // Check all tickets related to Jay Vara
    const allTickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { createdBy: jayVara.id },
          { assignedTo: jayVara.id },
          { customerId: jayVara.id }
        ]
      },
      include: {
        customer: { select: { name: true } },
        assignedUser: { select: { name: true } },
        creator: { select: { name: true } }
      }
    });

    console.log(`📊 Total tickets for Jay Vara: ${allTickets.length}\n`);

    if (allTickets.length > 0) {
      console.log('Ticket Details:');
      allTickets.forEach((ticket, index) => {
        console.log(`\n${index + 1}. Ticket #${ticket.ticketNumber}`);
        console.log(`   Title: ${ticket.title}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Priority: ${ticket.priority}`);
        console.log(`   Customer: ${ticket.customer.name}`);
        console.log(`   Assigned: ${ticket.assignedUser?.name || 'Unassigned'}`);
        console.log(`   Created by: ${ticket.creator.name}`);
      });
    } else {
      console.log('No tickets found for Jay Vara.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkJayVaraTickets();
