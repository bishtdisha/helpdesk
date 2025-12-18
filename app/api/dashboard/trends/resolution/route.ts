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

    // Fetch all resolved tickets in date range in 1 query instead of 30
    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        resolvedAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    // Group by date and calculate averages in memory
    const resolutionByDate = new Map<string, number[]>();

    resolvedTickets.forEach(t => {
      if (!t.resolvedAt) return;
      const dateKey = format(t.resolvedAt, 'yyyy-MM-dd');
      const resolutionHours = (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (!resolutionByDate.has(dateKey)) {
        resolutionByDate.set(dateKey, []);
      }
      resolutionByDate.get(dateKey)!.push(resolutionHours);
    });

    // Build chart data
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const times = resolutionByDate.get(dateKey) || [];
      const avgResolutionTime = times.length > 0
        ? times.reduce((a, b) => a + b, 0) / times.length
        : 0;

      chartData.push({
        date: format(date, 'MMM dd'),
        avgResolutionTime: parseFloat(avgResolutionTime.toFixed(2)),
      });
    }

    // Target resolution time (24 hours)
    const targetHours = 24;

    return NextResponse.json({ chartData, targetHours });
  } catch (error) {
    console.error('Error fetching resolution trends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
