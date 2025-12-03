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

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get tickets resolved in last 7 days (filtered by role)
    const resolved = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        resolvedAt: {
          gte: last7Days,
        },
      },
    });

    // Get resolved tickets with timestamps for avg resolution time (filtered by role)
    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        resolvedAt: {
          gte: last7Days,
        },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
        slaDueAt: true,
      },
    });

    // Calculate average resolution time
    const resolutionTimes = resolvedTickets.map(t => {
      if (!t.resolvedAt) return 0;
      return (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
    });

    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Calculate SLA success rate
    const slaCompliant = resolvedTickets.filter(t =>
      t.slaDueAt && t.resolvedAt && t.resolvedAt <= t.slaDueAt
    ).length;

    const slaSuccessRate = resolvedTickets.length > 0
      ? (slaCompliant / resolvedTickets.length) * 100
      : 0;

    // Calculate trends (compare with previous 7 days) (filtered by role)
    const previousResolved = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        resolvedAt: {
          gte: previous7Days,
          lt: last7Days,
        },
      },
    });

    const previousResolvedTickets = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        resolvedAt: {
          gte: previous7Days,
          lt: last7Days,
        },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
        slaDueAt: true,
      },
    });

    const previousResolutionTimes = previousResolvedTickets.map(t => {
      if (!t.resolvedAt) return 0;
      return (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
    });

    const previousAvgResolutionTime = previousResolutionTimes.length > 0
      ? previousResolutionTimes.reduce((a, b) => a + b, 0) / previousResolutionTimes.length
      : 0;

    const previousSlaCompliant = previousResolvedTickets.filter(t =>
      t.slaDueAt && t.resolvedAt && t.resolvedAt <= t.slaDueAt
    ).length;

    const previousSlaRate = previousResolvedTickets.length > 0
      ? (previousSlaCompliant / previousResolvedTickets.length) * 100
      : 0;

    const trends = {
      resolved: previousResolved > 0
        ? Math.round(((resolved - previousResolved) / previousResolved) * 100)
        : 0,
      resolutionTime: previousAvgResolutionTime > 0
        ? Math.round(((avgResolutionTime - previousAvgResolutionTime) / previousAvgResolutionTime) * 100)
        : 0,
      sla: previousSlaRate > 0
        ? slaSuccessRate - previousSlaRate
        : 0,
    };

    return NextResponse.json({
      resolved,
      avgResolutionTime,
      slaSuccessRate,
      trends,
    });
  } catch (error) {
    console.error('Error fetching week performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
