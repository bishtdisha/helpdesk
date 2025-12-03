import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { ticketService, UpdateTicketData } from '@/lib/services/ticket-service';
import { auditService } from '@/lib/services/audit-service';
import { TicketPriority, TicketStatus } from '@prisma/client';
import {
  TicketNotFoundError,
  TicketAccessDeniedError,
  InvalidTicketStatusTransitionError,
} from '@/lib/services/ticket-service';

/**
 * GET /api/tickets/:id - Get ticket details
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

    // Get ticket with access control
    const ticket = await ticketService.getTicket(ticketId, currentUser.id);

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tickets/:id - Update ticket
 * 
 * Request body:
 * - title: Ticket title (optional)
 * - description: Ticket description (optional)
 * - status: Ticket status (optional)
 * - priority: Ticket priority (optional)
 * - category: Ticket category (optional)
 * - assignedTo: Assignee user ID (optional)
 * - teamId: Team ID (optional)
 */
export async function PUT(
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
    const { title, description, status, priority, category, assignedTo, teamId, customerId, phone } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Title cannot be empty',
          },
          { status: 400 }
        );
      }

      if (title.length > 200) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Title cannot exceed 200 characters',
          },
          { status: 400 }
        );
      }
    }

    // Validate description if provided
    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Description cannot be empty',
          },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (status !== undefined && !Object.values(TicketStatus).includes(status)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: `Invalid status. Must be one of: ${Object.values(TicketStatus).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority !== undefined && !Object.values(TicketPriority).includes(priority)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: `Invalid priority. Must be one of: ${Object.values(TicketPriority).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category !== undefined && category !== null && category.length > 100) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Category cannot exceed 100 characters',
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: UpdateTicketData = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category?.trim() || undefined;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (teamId !== undefined) updateData.teamId = teamId;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (phone !== undefined) updateData.phone = phone?.trim() || undefined;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'No fields to update',
        },
        { status: 400 }
      );
    }

    // Update the ticket
    const ticket = await ticketService.updateTicket(ticketId, updateData, currentUser.id);

    // Log audit entry
    await auditService.logTicketOperation(
      currentUser.id,
      'ticket_updated',
      ticketId,
      { updates: Object.keys(updateData) },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: 'Ticket updated successfully',
      ticket,
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    
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

    // Handle Prisma foreign key constraint errors
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid assignedTo, teamId, or customerId',
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

/**
 * DELETE /api/tickets/:id - Delete ticket (Admin only)
 */
export async function DELETE(
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

    // Delete the ticket (permission check is done in service)
    await ticketService.deleteTicket(ticketId, currentUser.id);

    // Log audit entry
    await auditService.logTicketOperation(
      currentUser.id,
      'ticket_deleted',
      ticketId,
      {},
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
