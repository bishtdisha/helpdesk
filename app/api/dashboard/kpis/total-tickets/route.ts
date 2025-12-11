import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { getTicketFilterForUser } from '@/lib/dashboard-helpers';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get role-based filter
    const ticketFilter = await getTicketFilterForUser(currentUser.id);

    // Get total tickets count (filtered by role)
    const total = await prisma.ticket.count({
      where: ticketFilter,
    });

    // Get open tickets count (filtered by role)
    const open = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'],
        },
      },
    });

    // Get resolved tickets count (filtered by role)
    const resolved = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: {
          in: ['RESOLVED', 'CLOSED'],
        },
      },
    });

    // Get pending tickets count (filtered by role)
    const pending = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: 'WAITING_FOR_CUSTOMER',
      },
    });

    // Get in progress tickets count (filtered by role)
    const inProgress = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: 'IN_PROGRESS',
      },
    });

    // Get closed tickets count (filtered by role)
    const closed = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        status: 'CLOSED',
      },
    });

    // Calculate trend (last 7 days vs previous 7 days) (filtered by role)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentPeriod = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        createdAt: {
          gte: last7Days,
        },
      },
    });

    const previousPeriod = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        createdAt: {
          gte: previous7Days,
          lt: last7Days,
        },
      },
    });

    const trend = previousPeriod > 0
      ? Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100)
      : 0;

    return NextResponse.json({
      total,
      open,
      resolved,
      pending,
      inProgress,
      closed,
      trend,
    });
  } catch (error) {
    console.error('Error fetching total tickets KPI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
