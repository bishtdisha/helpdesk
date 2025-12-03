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

      const created = await prisma.ticket.count({
        where: {
          ...ticketFilter,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const resolved = await prisma.ticket.count({
        where: {
          ...ticketFilter,
          resolvedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      chartData.push({
        date: format(date, 'MMM dd'),
        created,
        resolved,
      });
    }

    return NextResponse.json({ chartData });
  } catch (error) {
    console.error('Error fetching ticket trends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
