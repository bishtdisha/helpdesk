import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import {
  feedbackService,
  FeedbackAccessDeniedError,
} from '@/lib/services/feedback-service';

/**
 * GET /api/feedback/summary - Get aggregated feedback summary
 * 
 * Query parameters:
 * - teamId: Filter by team (optional)
 * - agentId: Filter by agent (optional)
 * - startDate: Start date for filtering (optional, ISO format)
 * - endDate: End date for filtering (optional, ISO format)
 * 
 * Access: Admin (all feedback), Team Leader (team feedback only)
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || undefined;
    const agentId = searchParams.get('agentId') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Parse dates if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Invalid startDate format. Use ISO format (YYYY-MM-DD)',
          },
          { status: 400 }
        );
      }
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Invalid endDate format. Use ISO format (YYYY-MM-DD)',
          },
          { status: 400 }
        );
      }
    }

    // Get feedback summary
    const summary = await feedbackService.getFeedbackSummary(currentUser.id, {
      teamId,
      agentId,
      startDate,
      endDate,
    });

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    console.error('Error fetching feedback summary:', error);
    
    if (error instanceof FeedbackAccessDeniedError) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: error.code,
          message: error.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
