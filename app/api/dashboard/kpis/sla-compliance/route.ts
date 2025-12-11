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

    // Get all resolved/closed tickets (filtered by role)
    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        status: {
          in: ['RESOLVED', 'CLOSED'],
        },
        resolvedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        createdAt: true,
        resolvedAt: true,
        slaDueAt: true,
      },
    });

    if (resolvedTickets.length === 0) {
      return NextResponse.json({
        percentage: 0,
        status: 'No data',
        trend: 0,
      });
    }

    // Calculate SLA compliance
    const compliantTickets = resolvedTickets.filter(ticket => {
      if (!ticket.slaDueAt || !ticket.resolvedAt) return false;
      return ticket.resolvedAt <= ticket.slaDueAt;
    });

    const percentage = (compliantTickets.length / resolvedTickets.length) * 100;

    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentPeriodTickets = resolvedTickets.filter(t => 
      t.resolvedAt && t.resolvedAt >= last7Days
    );
    const currentCompliant = currentPeriodTickets.filter(t =>
      t.slaDueAt && t.resolvedAt && t.resolvedAt <= t.slaDueAt
    );
    const currentRate = currentPeriodTickets.length > 0
      ? (currentCompliant.length / currentPeriodTickets.length) * 100
      : 0;

    const previousPeriodTickets = resolvedTickets.filter(t =>
      t.resolvedAt && t.resolvedAt >= previous7Days && t.resolvedAt < last7Days
    );
    const previousCompliant = previousPeriodTickets.filter(t =>
      t.slaDueAt && t.resolvedAt && t.resolvedAt <= t.slaDueAt
    );
    const previousRate = previousPeriodTickets.length > 0
      ? (previousCompliant.length / previousPeriodTickets.length) * 100
      : 0;

    const trend = previousRate > 0 ? currentRate - previousRate : 0;

    // Calculate met and breach counts
    const metCount = compliantTickets.length;
    const breachCount = resolvedTickets.length - compliantTickets.length;
    const totalCount = resolvedTickets.length;

    return NextResponse.json({
      percentage,
      status: percentage >= 90 ? 'Excellent' : percentage >= 80 ? 'Good' : 'Needs Attention',
      trend,
      metCount,
      breachCount,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching SLA compliance KPI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
