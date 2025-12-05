// Complete flow test - simulates what happens when Jay logs in
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulate the ticket access control logic
async function getTicketFilters(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      team: true,
      teamLeaderships: {
        include: {
          team: true,
        },
      },
    },
  });

  if (!user?.role) {
    throw new Error('User role not found');
  }

  const roleName = user.role.name;

  console.log(`   Role: ${roleName}`);

  if (roleName === 'Admin/Manager') {
    return {};
  }

  if (roleName === 'Team Leader') {
    const teamIds = [];
    if (user.teamId) teamIds.push(user.teamId);
    if (user.teamLeaderships) {
      teamIds.push(...user.teamLeaderships.map(tl => tl.teamId));
    }
    return { teamId: { in: teamIds } };
  }

  if (roleName === 'Employee') {
    const followedTickets = await prisma.ticketFollower.findMany({
      where: { userId },
      select: { ticketId: true },
    });
    const followedTicketIds = followedTickets.map(f => f.ticketId);

    const orConditions = [
      { createdBy: userId },
      { assignedTo: userId },
    ];

    if (followedTicketIds.length > 0) {
      orConditions.push({ id: { in: followedTicketIds } });
    }

    console.log(`   Followed tickets: ${followedTicketIds.length}`);
    console.log(`   OR conditions: ${orConditions.length}`);

    return { OR: orConditions };
  }

  return { id: 'impossible' };
}

// Simulate the listTickets service method
async function listTickets(userId) {
  const page = 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  console.log('\n2️⃣ Getting role-based filters...');
  const roleFilters = await getTicketFilters(userId);
  console.log('   Filters:', JSON.stringify(roleFilters, null, 2));

  const where = {
    AND: [roleFilters],
  };

  console.log('\n3️⃣ Counting tickets...');
  const total = await prisma.ticket.count({ where });
  console.log(`   Total count: ${total}`);

  console.log('\n4️⃣ Fetching tickets...');
  const tickets = await prisma.ticket.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          comments: true,
          attachments: true,
          followers: true,
        },
      },
    },
  });

  console.log(`   Tickets found: ${tickets.length}`);

  return {
    data: tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
}

async function testCompleteFlow() {
  try {
    console.log('🔍 Testing Complete Data Flow for Jay Vara\n');
    console.log('='.repeat(60));

    // 1. Find Jay Vara
    console.log('\n1️⃣ Finding Jay Vara...');
    const jay = await prisma.user.findFirst({
      where: {
        name: { contains: 'Jay Vara', mode: 'insensitive' }
      },
      include: {
        role: true,
      }
    });

    if (!jay) {
      console.log('❌ Jay Vara not found');
      return;
    }

    console.log(`   Found: ${jay.name} (${jay.email})`);
    console.log(`   User ID: ${jay.id}`);

    // 2. Simulate the API call
    const result = await listTickets(jay.id);

    console.log('\n5️⃣ API Response:');
    console.log(`   Total tickets: ${result.pagination.total}`);
    console.log(`   Tickets in response: ${result.data.length}`);

    console.log('\n6️⃣ Ticket Details:');
    result.data.forEach((ticket, index) => {
      console.log(`\n   Ticket ${index + 1}:`);
      console.log(`   - ID: ${ticket.id}`);
      console.log(`   - Number: #${ticket.ticketNumber}`);
      console.log(`   - Title: ${ticket.title}`);
      console.log(`   - Status: ${ticket.status}`);
      console.log(`   - Priority: ${ticket.priority}`);
      console.log(`   - Customer: ${ticket.customer?.name || 'N/A'}`);
      console.log(`   - Created by: ${ticket.creator?.name || 'N/A'}`);
      console.log(`   - Assigned to: ${ticket.assignedUser?.name || 'Unassigned'}`);
      console.log(`   - Team: ${ticket.team?.name || 'No team'}`);
      console.log(`   - Comments: ${ticket._count?.comments || 0}`);
      console.log(`   - Attachments: ${ticket._count?.attachments || 0}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Complete Flow Test Successful!');
    console.log('\n📊 Summary:');
    console.log(`   User: ${jay.name}`);
    console.log(`   Role: ${jay.role?.name}`);
    console.log(`   Tickets visible: ${result.data.length}`);
    console.log(`   Total in database: ${result.pagination.total}`);

    if (result.data.length === 0) {
      console.log('\n⚠️  WARNING: No tickets returned!');
      console.log('   This means the issue is in the database query or filters.');
    } else {
      console.log('\n✅ Tickets are being returned correctly from the database.');
      console.log('   If the dashboard is still empty, the issue is in the frontend.');
    }

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteFlow();
