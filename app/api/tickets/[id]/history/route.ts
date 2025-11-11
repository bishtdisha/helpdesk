import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { ticketAccessControl } from '@/lib/rbac/ticket-access-control';
import {
  TicketNotFoundError,
  TicketAccessDeniedError,
} from '@/lib/services/ticket-service';

/**
 * GET /api/tickets/:id/history - Get ticket history/audit trail
 * 
 * Query parameters:
 * - limit: Number of history entries to return (default: 50, max: 200)
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

    // Check if user can access this ticket
    const canAccess = await ticketAccessControl.canAccessTicket(currentUser.id, ticketId);
    
    if (!canAccess) {
      throw new TicketAccessDeniedError(ticketId, currentUser.id);
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new TicketNotFoundError(ticketId);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    // Get ticket history
    const history = await prisma.ticketHistory.findMany({
      where: { ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      history,
      total: history.length,
    });
  } catch (error) {
    console.error('Error fetching ticket history:', error);
    
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
