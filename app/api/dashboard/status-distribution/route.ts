import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserIdFromMiddleware } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    // Use lightweight auth - middleware already validated
    const userId = await getUserIdFromMiddleware();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ticket counts by status
    const statusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const statusColors: Record<string, string> = {
      OPEN: '#ef4444',
      IN_PROGRESS: '#f59e0b',
      WAITING: '#6b7280',
      RESOLVED: '#10b981',
      CLOSED: '#3b82f6'
    };

    const statusNames: Record<string, string> = {
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      WAITING: 'Waiting',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed'
    };

    const distributionData = statusCounts.map(item => ({
      name: statusNames[item.status] || item.status,
      value: item._count.id,
      color: statusColors[item.status] || '#6b7280'
    }));

    return NextResponse.json(distributionData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Dashboard status distribution error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status distribution' },
      { status: 500 }
    );
  }
}
