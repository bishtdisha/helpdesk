import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { TicketStatus } from '@prisma/client';
import { getTicketFilterForUser } from '@/lib/dashboard-helpers';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get role-based filter
    const ticketFilter = await getTicketFilterForUser(currentUser.id);

    // Get all tickets and group by status in memory (1 query instead of 5)
    const tickets = await prisma.ticket.groupBy({
      by: ['status'],
      where: ticketFilter,
      _count: { status: true },
    });

    // Map to expected format
    const statusBreakdown = tickets
      .map(item => ({
        status: item.status,
        count: item._count.status,
      }))
      .filter(item => item.count > 0);

    return NextResponse.json({
      statusBreakdown,
    });
  } catch (error) {
    console.error('Error fetching workload by status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
