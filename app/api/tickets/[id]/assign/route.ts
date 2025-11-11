import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { ticketService } from '@/lib/services/ticket-service';
import { auditService } from '@/lib/services/audit-service';
import {
  TicketNotFoundError,
  TicketAccessDeniedError,
  TicketAssignmentDeniedError,
} from '@/lib/services/ticket-service';

/**
 * POST /api/tickets/:id/assign - Assign ticket to a user
 * 
 * Request body:
 * - assigneeId: User ID to assign the ticket to (required)
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
    const { assigneeId } = body;

    // Validate required fields
    if (!assigneeId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'assigneeId is required',
        },
        { status: 400 }
      );
    }

    // Validate assigneeId is a string
    if (typeof assigneeId !== 'string' || assigneeId.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'assigneeId must be a valid user ID',
        },
        { status: 400 }
      );
    }

    // Assign the ticket
    const ticket = await ticketService.assignTicket(
      ticketId,
      assigneeId.trim(),
      currentUser.id
    );

    // Log audit entry
    await auditService.logTicketOperation(
      currentUser.id,
      'ticket_assigned',
      ticketId,
      { assigneeId: assigneeId.trim() },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: 'Ticket assigned successfully',
      ticket,
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    
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

    if (error instanceof TicketAssignmentDeniedError) {
      return NextResponse.json(
        {
          error: 'Assignment denied',
          code: error.code,
          message: error.message,
        },
        { status: 403 }
      );
    }

    // Handle case where assignee user doesn't exist
    if (error instanceof Error && error.message.includes('Assignee user not found')) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Assignee user not found',
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
