import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json(
      { count },
      {
        headers: {
          // Cache for 5 seconds, stale-while-revalidate for 15 seconds
          'Cache-Control': 'private, max-age=5, stale-while-revalidate=15',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
