const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJayTickets() {
  console.log('🔍 Checking Jay Vara\'s tickets...\n');

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
        team: true
      }
    });

    if (!jay) {
      console.log('❌ Jay not found in database');
      return;
    }

    console.log('✅ Found Jay:');
    console.log(`   ID: ${jay.id}`);
    console.log(`   Name: ${jay.name}`);
    console.log(`   Email: ${jay.email}`);
    console.log(`   Role: ${jay.role?.name || 'No role'}`);
    console.log(`   Team: ${jay.team?.name || 'No team'}\n`);

    // Check tickets created by Jay
    const createdTickets = await prisma.ticket.findMany({
      where: { createdBy: jay.id }
    });
    console.log(`📝 Tickets created by Jay: ${createdTickets.length}`);

    // Check tickets assigned to Jay
    const assignedTickets = await prisma.ticket.findMany({
      where: { assignedTo: jay.id }
    });
    console.log(`👤 Tickets assigned to Jay: ${assignedTickets.length}`);

    // Check tickets where Jay is customer
    const customerTickets = await prisma.ticket.findMany({
      where: { customerId: jay.id }
    });
    console.log(`🎫 Tickets where Jay is customer: ${customerTickets.length}\n`);

    // Show all tickets Jay should see (based on role-based access control)
    const allJayTickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { createdBy: jay.id },
          { assignedTo: jay.id },
          { customerId: jay.id }
        ]
      },
      include: {
        customer: { select: { name: true } },
        assignedUser: { select: { name: true } },
        creator: { select: { name: true } }
      }
    });

    console.log(`📊 Total tickets Jay should see: ${allJayTickets.length}\n`);

    if (allJayTickets.length > 0) {
      console.log('Ticket Details:');
      allJayTickets.forEach((ticket, index) => {
        console.log(`\n${index + 1}. Ticket #${ticket.ticketNumber}`);
        console.log(`   Title: ${ticket.title}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Priority: ${ticket.priority}`);
        console.log(`   Customer: ${ticket.customer.name}`);
        console.log(`   Assigned: ${ticket.assignedUser?.name || 'Unassigned'}`);
        console.log(`   Created by: ${ticket.creator.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkJayTickets();
