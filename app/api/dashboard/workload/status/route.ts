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

    // Get count of tickets by status (filtered by role)
    const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'];
    
    const statusBreakdown = await Promise.all(
      statuses.map(async (status) => {
        const count = await prisma.ticket.count({
          where: { 
            ...ticketFilter,
            status 
          },
        });
        return { status, count };
      })
    );

    // Filter out statuses with 0 count
    const filteredBreakdown = statusBreakdown.filter(item => item.count > 0);

    return NextResponse.json({
      statusBreakdown: filteredBreakdown,
    });
  } catch (error) {
    console.error('Error fetching workload by status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
