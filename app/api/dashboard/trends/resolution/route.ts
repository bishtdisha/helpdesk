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
    const chartData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const resolvedTickets = await prisma.ticket.findMany({
        where: {
          ...ticketFilter,
          resolvedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const resolutionTimes = resolvedTickets.map(t => {
        if (!t.resolvedAt) return 0;
        return (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      });

      const avgResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
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
