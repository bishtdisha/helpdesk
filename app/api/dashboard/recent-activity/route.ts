import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserIdFromMiddleware } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 15; // More frequent updates for recent activity

export async function GET(request: NextRequest) {
  try {
    // Use lightweight auth - middleware already validated
    const userId = await getUserIdFromMiddleware();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent tickets and user updates
    const [recentTickets, recentUserUpdates] = await Promise.all([
      prisma.ticket.findMany({
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          updatedAt: true,
          customer: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.user.findMany({
        take: 2,
        orderBy: { updatedAt: 'desc' },
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          role: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    const activities = [
      ...recentTickets.map(ticket => ({
        action: ticket.status === 'RESOLVED' ? 'Ticket resolved' : 'Ticket updated',
        customer: ticket.customer?.name || 'Unknown',
        time: getTimeAgo(ticket.updatedAt),
        priority: ticket.priority || 'Med',
        type: 'ticket' as const
      })),
      ...recentUserUpdates.map(user => ({
        action: 'User role updated',
        customer: user.name || 'Unknown',
        time: getTimeAgo(user.updatedAt),
        priority: 'Med' as const,
        type: 'admin' as const
      }))
    ].slice(0, 4);

    return NextResponse.json(activities, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('Dashboard recent activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
