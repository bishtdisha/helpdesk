import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { ticketService } from '@/lib/services/ticket-service';
import { TicketAccessDeniedError } from '@/lib/services/ticket-service';

/**
 * GET /api/tickets/similar - Find similar resolved tickets
 * 
 * Query parameters:
 * - content: Ticket content (title + description) to find similar tickets for
 * - limit: Number of similar tickets to return (default: 5, max: 10)
 * - excludeId: Ticket ID to exclude from results (optional)
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
    const content = searchParams.get('content');
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') || '5')));
    const excludeId = searchParams.get('excludeId') || undefined;

    // Validate required parameters
    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Content parameter is required and must be at least 10 characters',
        },
        { status: 400 }
      );
    }

    // Find similar tickets
    const similarTickets = await ticketService.findSimilarTickets(
      content.trim(),
      currentUser.id,
      limit,
      excludeId
    );

    return NextResponse.json({
      similarTickets,
      count: similarTickets.length,
    });
  } catch (error) {
    console.error('Error finding similar tickets:', error);
    
    if (error instanceof TicketAccessDeniedError) {
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