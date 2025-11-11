import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import {
  feedbackService,
  SubmitFeedbackData,
  FeedbackAccessDeniedError,
  InvalidFeedbackError,
} from '@/lib/services/feedback-service';

/**
 * GET /api/tickets/:id/feedback - Get feedback for a ticket
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

    // Get feedback
    const feedback = await feedbackService.getFeedback(ticketId, currentUser.id);

    if (!feedback) {
      return NextResponse.json(
        {
          error: 'Feedback not found',
          code: 'FEEDBACK_NOT_FOUND',
          message: 'No feedback has been submitted for this ticket',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    
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
 * POST /api/tickets/:id/feedback - Submit feedback for a ticket
 * 
 * Request body:
 * - customerId: Customer ID (required)
 * - rating: Rating from 1-5 (required)
 * - comment: Optional feedback comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;

    // Parse request body
    const body = await request.json();
    const { customerId, rating, comment } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'customerId is required',
        },
        { status: 400 }
      );
    }

    if (rating === undefined || rating === null) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'rating is required',
        },
        { status: 400 }
      );
    }

    // Validate rating is a number
    if (typeof rating !== 'number') {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'rating must be a number',
        },
        { status: 400 }
      );
    }

    // Validate comment length if provided
    if (comment && typeof comment === 'string' && comment.length > 2000) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Comment cannot exceed 2000 characters',
        },
        { status: 400 }
      );
    }

    const feedbackData: SubmitFeedbackData = {
      ticketId,
      customerId,
      rating,
      comment: comment?.trim(),
    };

    // Submit feedback
    const feedback = await feedbackService.submitFeedback(feedbackData);

    return NextResponse.json(
      {
        message: 'Feedback submitted successfully',
        feedback,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    if (error instanceof InvalidFeedbackError) {
      return NextResponse.json(
        {
          error: 'Invalid feedback',
          code: 'INVALID_FEEDBACK',
          message: error.message,
        },
        { status: 400 }
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
