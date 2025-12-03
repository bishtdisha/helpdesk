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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tickets resolved today (filtered by role)
    const resolved = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        resolvedAt: {
          gte: today,
        },
      },
    });

    // Get tickets created today with first comment for response time (filtered by role)
    const ticketsToday = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        createdAt: {
          gte: today,
        },
      },
      select: {
        id: true,
        createdAt: true,
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

    // Calculate average response time
    const responseTimes = ticketsToday
      .filter(t => t.comments.length > 0)
      .map(t => {
        const diff = t.comments[0].createdAt.getTime() - t.createdAt.getTime();
        return diff / (1000 * 60 * 60); // Convert to hours
      });

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Get SLA success rate for today (filtered by role)
    const resolvedToday = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        resolvedAt: {
          gte: today,
        },
      },
      select: {
        resolvedAt: true,
        slaDueAt: true,
      },
    });

    const slaCompliant = resolvedToday.filter(t =>
      t.slaDueAt && t.resolvedAt && t.resolvedAt <= t.slaDueAt
    ).length;

    const slaSuccessRate = resolvedToday.length > 0
      ? (slaCompliant / resolvedToday.length) * 100
      : 0;

    return NextResponse.json({
      resolved,
      avgResponseTime,
      slaSuccessRate,
    });
  } catch (error) {
    console.error('Error fetching today performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
