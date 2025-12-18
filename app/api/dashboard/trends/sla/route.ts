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
        resolvedAt: true,
        slaDueAt: true,
      },
    });

    // Group by date and calculate SLA rates in memory
    const ticketsByDate = new Map<string, { total: number; compliant: number }>();

    resolvedTickets.forEach(t => {
      if (!t.resolvedAt) return;
      const dateKey = format(t.resolvedAt, 'yyyy-MM-dd');
      
      if (!ticketsByDate.has(dateKey)) {
        ticketsByDate.set(dateKey, { total: 0, compliant: 0 });
      }
      
      const data = ticketsByDate.get(dateKey)!;
      data.total++;
      if (t.slaDueAt && t.resolvedAt <= t.slaDueAt) {
        data.compliant++;
      }
    });

    // Build chart data
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const data = ticketsByDate.get(dateKey) || { total: 0, compliant: 0 };
      const slaRate = data.total > 0 ? (data.compliant / data.total) * 100 : 0;

      chartData.push({
        date: format(date, 'MMM dd'),
        slaRate: parseFloat(slaRate.toFixed(2)),
      });
    }

    return NextResponse.json({ chartData });
  } catch (error) {
    console.error('Error fetching SLA trends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
