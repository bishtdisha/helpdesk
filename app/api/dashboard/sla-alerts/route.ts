import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { TicketPriority } from '@prisma/client';
import { getTicketFilterForUser } from '@/lib/dashboard-helpers';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get role-based filter
    const ticketFilter = await getTicketFilterForUser(currentUser.id);

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Get tickets near breach (within next 2 hours) (filtered by role)
    const nearBreachTickets = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'],
        },
        slaDueAt: {
          gte: now,
          lte: twoHoursFromNow,
        },
      },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        priority: true,
        slaDueAt: true,
      },
      orderBy: {
        slaDueAt: 'asc',
      },
      take: 10,
    });

    // Calculate time left in minutes for each ticket
    const nearBreach = nearBreachTickets.map(ticket => ({
      ...ticket,
      timeLeftMinutes: ticket.slaDueAt
        ? Math.floor((ticket.slaDueAt.getTime() - now.getTime()) / (1000 * 60))
        : 0,
    }));

    // Get breached tickets count (filtered by role)
    const breached = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'],
        },
        slaDueAt: {
          lt: now,
        },
      },
    });

    // Get priority matrix - fetch all open tickets once and calculate in memory
    const allOpenTickets = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'],
        },
      },
      select: {
        id: true,
        priority: true,
        slaDueAt: true,
      },
    });

    const priorities: TicketPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    const priorityMatrix = priorities.map((priority) => {
      const openTickets = allOpenTickets.filter(t => t.priority === priority);
      const open = openTickets.length;

      // Calculate average SLA time left
      const ticketsWithSLA = openTickets.filter(t => t.slaDueAt);
      const avgSlaLeftMinutes = ticketsWithSLA.length > 0
        ? ticketsWithSLA.reduce((sum, t) => {
            if (!t.slaDueAt) return sum;
            const minutesLeft = Math.floor((t.slaDueAt.getTime() - now.getTime()) / (1000 * 60));
            return sum + Math.max(0, minutesLeft);
          }, 0) / ticketsWithSLA.length
        : 0;

      // Count breached tickets for this priority
      const breachedCount = openTickets.filter(t => t.slaDueAt && t.slaDueAt < now).length;

      return {
        priority,
        open,
        avgSlaLeftMinutes: Math.round(avgSlaLeftMinutes),
        breached: breachedCount,
      };
    });

    return NextResponse.json({
      nearBreach,
      breached,
      priorityMatrix,
    });
  } catch (error) {
    console.error('Error fetching SLA alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
