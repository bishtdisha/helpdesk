import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { followerService } from '@/lib/services/follower-service';
import {
  FollowerAlreadyExistsError,
  FollowerPermissionDeniedError,
} from '@/lib/services/follower-service';

/**
 * GET /api/tickets/:id/followers - Get all followers of a ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get followers
    const followers = await followerService.getFollowers(ticketId, currentUser.id);

    return NextResponse.json({
      followers,
      total: followers.length,
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    
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

/**
 * POST /api/tickets/:id/followers - Add a follower to a ticket
 * 
 * Request body:
 * - userId: User ID to add as follower (required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
        { status: 400 }
      );
    }

    // Validate userId is a string
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'userId must be a valid user ID',
        },
        { status: 400 }
      );
    }

    // Add follower
    const follower = await followerService.addFollower(
      ticketId,
      userId.trim(),
      currentUser.id
    );

    return NextResponse.json(
      {
        message: 'Follower added successfully',
        follower,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding follower:', error);
    
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

    if (error instanceof FollowerAlreadyExistsError) {
      return NextResponse.json(
        {
          error: 'Follower already exists',
          code: 'FOLLOWER_ALREADY_EXISTS',
          message: error.message,
        },
        { status: 409 }
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

    if (error instanceof Error && error.message.includes('User not found')) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'User not found',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
