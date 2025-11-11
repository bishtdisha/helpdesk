import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { ticketService } from '@/lib/services/ticket-service';
import {
  TicketNotFoundError,
  TicketAccessDeniedError,
  InvalidTicketStatusTransitionError,
} from '@/lib/services/ticket-service';

/**
 * POST /api/tickets/:id/close - Close a ticket
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

    // Close the ticket
    const ticket = await ticketService.closeTicket(ticketId, currentUser.id);

    return NextResponse.json({
      message: 'Ticket closed successfully',
      ticket,
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    
    if (error instanceof TicketNotFoundError) {
      return NextResponse.json(
        {
          error: 'Ticket not found',
          code: error.code,
          message: error.message,
        },
        { status: 404 }
      );
    }

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

    if (error instanceof InvalidTicketStatusTransitionError) {
      return NextResponse.json(
        {
          error: 'Invalid status transition',
          code: 'INVALID_STATUS_TRANSITION',
          message: error.message,
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
