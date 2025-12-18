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

    // Only count open/active tickets for priority mix
    const activeFilter = {
      ...ticketFilter,
      status: {
        in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] as const,
      },
    };

    // Get counts by priority
    const [urgent, high, medium, low] = await Promise.all([
      prisma.ticket.count({
        where: { ...activeFilter, priority: 'URGENT' },
      }),
      prisma.ticket.count({
        where: { ...activeFilter, priority: 'HIGH' },
      }),
      prisma.ticket.count({
        where: { ...activeFilter, priority: 'MEDIUM' },
      }),
      prisma.ticket.count({
        where: { ...activeFilter, priority: 'LOW' },
      }),
    ]);

    const total = urgent + high + medium + low;
    const highPriorityPercent = total > 0 
      ? ((urgent + high) / total) * 100 
      : 0;

    // Calculate trend (compare high priority % from last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Current period high priority tickets
    const currentHighPriority = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        priority: { in: ['URGENT', 'HIGH'] },
        createdAt: { gte: last7Days },
      },
    });

    const currentTotal = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        createdAt: { gte: last7Days },
      },
    });

    // Previous period high priority tickets
    const previousHighPriority = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        priority: { in: ['URGENT', 'HIGH'] },
        createdAt: { gte: previous7Days, lt: last7Days },
      },
    });

    const previousTotal = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        createdAt: { gte: previous7Days, lt: last7Days },
      },
    });

    const currentPercent = currentTotal > 0 ? (currentHighPriority / currentTotal) * 100 : 0;
    const previousPercent = previousTotal > 0 ? (previousHighPriority / previousTotal) * 100 : 0;
    const trend = currentPercent - previousPercent;

    return NextResponse.json({
      urgent,
      high,
      medium,
      low,
      total,
      highPriorityPercent,
      trend,
    });
  } catch (error) {
    console.error('Error fetching priority mix KPI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
