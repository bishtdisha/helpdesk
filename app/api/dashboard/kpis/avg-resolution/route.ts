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

    // Get resolved tickets with timestamps (filtered by role)
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
        comments: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
    });

    if (resolvedTickets.length === 0) {
      return NextResponse.json({
        resolutionTime: 0,
        responseTime: 0,
        trend: 0,
      });
    }

    // Calculate average resolution time
    const resolutionTimes = resolvedTickets.map(ticket => {
      if (!ticket.resolvedAt) return 0;
      const diff = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
      return diff / (1000 * 60 * 60); // Convert to hours
    });

    const avgResolutionTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;

    // Calculate average response time (time to first comment)
    const responseTimes = resolvedTickets
      .filter(ticket => ticket.comments.length > 0)
      .map(ticket => {
        const firstComment = ticket.comments[0];
        const diff = firstComment.createdAt.getTime() - ticket.createdAt.getTime();
        return diff / (1000 * 60 * 60); // Convert to hours
      });

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentPeriodTickets = resolvedTickets.filter(t =>
      t.resolvedAt && t.resolvedAt >= last7Days
    );
    const currentAvg = currentPeriodTickets.length > 0
      ? currentPeriodTickets.reduce((sum, t) => {
          if (!t.resolvedAt) return sum;
          return sum + (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        }, 0) / currentPeriodTickets.length
      : 0;

    const previousPeriodTickets = resolvedTickets.filter(t =>
      t.resolvedAt && t.resolvedAt >= previous7Days && t.resolvedAt < last7Days
    );
    const previousAvg = previousPeriodTickets.length > 0
      ? previousPeriodTickets.reduce((sum, t) => {
          if (!t.resolvedAt) return sum;
          return sum + (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        }, 0) / previousPeriodTickets.length
      : 0;

    const trend = previousAvg > 0
      ? Math.round(((currentAvg - previousAvg) / previousAvg) * 100)
      : 0;

    return NextResponse.json({
      resolutionTime: avgResolutionTime,
      responseTime: avgResponseTime,
      trend,
    });
  } catch (error) {
    console.error('Error fetching avg resolution KPI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
