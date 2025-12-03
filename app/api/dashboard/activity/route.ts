import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserIdFromMiddleware } from '@/lib/server-auth';
import { getTicketFilterForUser } from '@/lib/dashboard-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    // Use lightweight auth - middleware already validated
    const userId = await getUserIdFromMiddleware();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get role-based filter
    const ticketFilter = await getTicketFilterForUser(userId);

    // Get last 7 days of ticket activity (filtered by role)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const tickets = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Group by day
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activityData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      const dayName = days[date.getDay()];
      
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.createdAt);
        return ticketDate.toDateString() === date.toDateString();
      });
      
      return {
        name: dayName,
        open: dayTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
        resolved: dayTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length
      };
    });

    return NextResponse.json(activityData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}
