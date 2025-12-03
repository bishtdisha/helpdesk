import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserIdFromMiddleware } from '@/lib/server-auth';
import { getTicketFilterForUser, getUserFilterForUser } from '@/lib/dashboard-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: NextRequest) {
  try {
    // Use lightweight auth - middleware already validated
    const userId = await getUserIdFromMiddleware();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get role-based filters
    const ticketFilter = await getTicketFilterForUser(userId);
    const userFilter = await getUserFilterForUser(userId);

    // Parallel queries for better performance
    const [openTickets, resolvedToday, avgResponseTime, activeCustomers] = await Promise.all([
      // Open tickets count (filtered by role)
      prisma.ticket.count({
        where: { 
          ...ticketFilter,
          status: { in: ['OPEN', 'IN_PROGRESS'] } 
        }
      }),
      
      // Resolved today count (filtered by role)
      prisma.ticket.count({
        where: {
          ...ticketFilter,
          status: 'RESOLVED',
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Average response time (in hours) (filtered by role)
      prisma.ticket.aggregate({
        where: {
          ...ticketFilter,
          status: { in: ['RESOLVED', 'CLOSED'] },
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        _avg: {
          id: true // Placeholder - you'd calculate actual response time
        }
      }),
      
      // Active customers (users with tickets in last 30 days) (filtered by role)
      prisma.user.count({
        where: {
          ...userFilter,
          customerTickets: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      })
    ]);

    // Calculate percentage changes (mock for now - you'd compare with previous period)
    const stats = {
      openTickets: {
        value: openTickets,
        change: -12,
        changeType: 'negative'
      },
      resolvedToday: {
        value: resolvedToday,
        change: 8,
        changeType: 'positive'
      },
      avgResponseTime: {
        value: '2.4h', // You'd calculate this from actual data
        change: -15,
        changeType: 'positive'
      },
      activeCustomers: {
        value: activeCustomers,
        change: 5,
        changeType: 'positive'
      }
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
