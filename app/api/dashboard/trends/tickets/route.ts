import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { format, subDays } from 'date-fns';
import { getTicketFilterForUser } from '@/lib/dashboard-helpers';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get role-based filter
    const ticketFilter = await getTicketFilterForUser(currentUser.id);

    const days = 30;
    const startDate = subDays(new Date(), days - 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Fetch all tickets in the date range in 2 queries instead of 60
    const [createdTickets, resolvedTickets] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          ...ticketFilter,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true },
      }),
      prisma.ticket.findMany({
        where: {
          ...ticketFilter,
          resolvedAt: { gte: startDate, lte: endDate },
        },
        select: { resolvedAt: true },
      }),
    ]);

    // Group by date in memory (much faster than 60 DB queries)
    const createdByDate = new Map<string, number>();
    const resolvedByDate = new Map<string, number>();

    createdTickets.forEach(t => {
      const dateKey = format(t.createdAt, 'yyyy-MM-dd');
      createdByDate.set(dateKey, (createdByDate.get(dateKey) || 0) + 1);
    });

    resolvedTickets.forEach(t => {
      if (t.resolvedAt) {
        const dateKey = format(t.resolvedAt, 'yyyy-MM-dd');
        resolvedByDate.set(dateKey, (resolvedByDate.get(dateKey) || 0) + 1);
      }
    });

    // Build chart data
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      chartData.push({
        date: format(date, 'MMM dd'),
        created: createdByDate.get(dateKey) || 0,
        resolved: resolvedByDate.get(dateKey) || 0,
      });
    }

    return NextResponse.json({ chartData });
  } catch (error) {
    console.error('Error fetching ticket trends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
