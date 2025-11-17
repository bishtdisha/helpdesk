import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { notificationService } from '@/lib/services/notification-service';

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
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

    const preferences = await notificationService.getUserNotificationPreferences(
      user.id
    );

    // If no preferences exist, return defaults
    if (!preferences) {
      return NextResponse.json({
        userId: user.id,
        emailEnabled: true,
        inAppEnabled: true,
        notifyOnCreation: true,
        notifyOnAssignment: true,
        notifyOnStatusChange: true,
        notifyOnComment: true,
        notifyOnResolution: true,
        notifyOnSLABreach: true,
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const allowedFields = [
      'emailEnabled',
      'inAppEnabled',
      'notifyOnCreation',
      'notifyOnAssignment',
      'notifyOnStatusChange',
      'notifyOnComment',
      'notifyOnResolution',
      'notifyOnSLABreach',
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (field in body && typeof body[field] === 'boolean') {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const preferences = await notificationService.updateNotificationPreferences(
      user.id,
      updates
    );

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
