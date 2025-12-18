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

    // Calculate dates for trend
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel for better performance
    const [
      total,
      newTickets,
      inProgress,
      onHold,
      resolved,
      closed,
      currentPeriod,
      previousPeriod,
    ] = await Promise.all([
      // Total tickets
      prisma.ticket.count({ where: ticketFilter }),
      // New tickets (OPEN status only)
      prisma.ticket.count({
        where: { ...ticketFilter, status: 'OPEN' },
      }),
      // In progress tickets
      prisma.ticket.count({
        where: { ...ticketFilter, status: 'IN_PROGRESS' },
      }),
      // On Hold tickets (WAITING_FOR_CUSTOMER)
      prisma.ticket.count({
        where: { ...ticketFilter, status: 'WAITING_FOR_CUSTOMER' },
      }),
      // Resolved tickets
      prisma.ticket.count({
        where: { ...ticketFilter, status: 'RESOLVED' },
      }),
      // Cancelled tickets (CLOSED)
      prisma.ticket.count({
        where: { ...ticketFilter, status: 'CLOSED' },
      }),
      // Current period (last 7 days)
      prisma.ticket.count({
        where: { ...ticketFilter, createdAt: { gte: last7Days } },
      }),
      // Previous period
      prisma.ticket.count({
        where: { ...ticketFilter, createdAt: { gte: previous7Days, lt: last7Days } },
      }),
    ]);

    const trend = previousPeriod > 0
      ? Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100)
      : 0;

    // Calculate open (all non-closed/resolved) for backward compatibility
    const open = newTickets + inProgress + onHold;

    return NextResponse.json({
      total,
      newTickets,
      open,
      inProgress,
      onHold,
      resolved,
      closed,
      pending: onHold, // backward compatibility
      trend,
    });
  } catch (error) {
    console.error('Error fetching total tickets KPI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
