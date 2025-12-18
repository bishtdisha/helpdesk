import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { ticketService } from '@/lib/services/ticket-service';
import { prisma } from '@/lib/db';
import {
  TicketNotFoundError,
  TicketAccessDeniedError,
} from '@/lib/services/ticket-service';

/**
 * GET /api/teams/:id/tickets/:ticketId - Get ticket details within team context
 * This endpoint provides read-only access to ticket details for the Team Management module
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; ticketId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const teamId = params.id;
    const ticketId = params.ticketId;

    // Verify the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get ticket with access control using existing service
    const ticket = await ticketService.getTicket(ticketId, currentUser.id);

    // Verify the ticket belongs to this team (optional - for stricter access control)
    if (ticket.teamId && ticket.teamId !== teamId) {
      return NextResponse.json(
        { 
          error: 'Access denied',
          message: 'This ticket does not belong to the specified team'
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ ticket, team });
  } catch (error) {
    console.error('Error fetching team ticket:', error);
    
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
