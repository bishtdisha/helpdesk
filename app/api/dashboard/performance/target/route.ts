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
    const achieved = await prisma.ticket.count({
      where: {
        ...ticketFilter,
        resolvedAt: {
          gte: today,
        },
      },
    });

    // Set daily target (can be customized per user/role)
    // For now, using a default target of 10 tickets per day
    const target = 10;

    const percentage = (achieved / target) * 100;

    return NextResponse.json({
      target,
      achieved,
      percentage,
    });
  } catch (error) {
    console.error('Error fetching daily target:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
