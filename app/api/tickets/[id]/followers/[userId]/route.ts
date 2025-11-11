import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { followerService } from '@/lib/services/follower-service';
import {
  FollowerNotFoundError,
  FollowerPermissionDeniedError,
} from '@/lib/services/follower-service';

/**
 * DELETE /api/tickets/:id/followers/:userId - Remove a follower from a ticket
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const ticketId = params.id;
    const userIdToRemove = params.userId;

    // Validate userId
    if (!userIdToRemove || userIdToRemove.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
        { status: 400 }
      );
    }

    // Remove follower
    await followerService.removeFollower(
      ticketId,
      userIdToRemove,
      currentUser.id
    );

    return NextResponse.json({
      message: 'Follower removed successfully',
    });
  } catch (error) {
    console.error('Error removing follower:', error);
    
    if (error instanceof FollowerNotFoundError) {
      return NextResponse.json(
        {
          error: 'Follower not found',
          code: 'FOLLOWER_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

    if (error instanceof FollowerPermissionDeniedError) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: error.code,
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('Ticket not found')) {
      return NextResponse.json(
        {
          error: 'Ticket not found',
          code: 'TICKET_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
