import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserIdFromMiddleware } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: NextRequest) {
  try {
    // Use lightweight auth - middleware already validated
    const userId = await getUserIdFromMiddleware();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parallel queries for better performance
    const [openTickets, resolvedToday, avgResponseTime, activeCustomers] = await Promise.all([
      // Open tickets count
      prisma.ticket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
      }),
      
      // Resolved today count
      prisma.ticket.count({
        where: {
          status: 'RESOLVED',
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Average response time (in hours)
      prisma.ticket.aggregate({
        where: {
          status: { in: ['RESOLVED', 'CLOSED'] },
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        _avg: {
          id: true // Placeholder - you'd calculate actual response time
        }
      }),
      
      // Active customers (customers with tickets in last 30 days)
      prisma.customer.count({
        where: {
          tickets: {
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
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
