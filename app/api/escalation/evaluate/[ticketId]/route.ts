import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { escalationService } from '@/lib/services/escalation-service';
import { prisma } from '@/lib/db';
import { TicketAccessControl } from '@/lib/rbac/ticket-access-control';

/**
 * POST /api/escalation/evaluate/:ticketId - Manually evaluate a ticket for escalation
 * 
 * This endpoint allows authorized users to manually trigger escalation evaluation
 * for a specific ticket. It will check all active escalation rules and execute
 * any applicable actions.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const ticketId = params.ticketId;

    // Get the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        creator: true,
        assignedUser: true,
        team: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          error: 'Not found',
          code: 'TICKET_NOT_FOUND',
          message: 'Ticket not found',
        },
        { status: 404 }
      );
    }

    // Check if user has access to this ticket
    const accessControl = new TicketAccessControl();
    const canAccess = await accessControl.canAccessTicket(currentUser.id, ticketId);

    if (!canAccess) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: 'TICKET_ACCESS_DENIED',
          message: 'You do not have permission to access this ticket',
        },
        { status: 403 }
      );
    }

    // Evaluate the ticket against all escalation rules
    const applicableActions = await escalationService.evaluateTicket(ticket);

    if (applicableActions.length === 0) {
      return NextResponse.json({
        message: 'No escalation rules apply to this ticket',
        ticketId,
        escalationsExecuted: 0,
        results: [],
      });
    }

    // Execute each applicable escalation action
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const action of applicableActions) {
      try {
        const result = await escalationService.executeEscalation(ticket, action.rule);
        results.push({
          ruleId: action.rule.id,
          ruleName: action.rule.name,
          actionType: action.rule.actionType,
          success: true,
          result,
        });
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          ruleId: action.rule.id,
          ruleName: action.rule.name,
          actionType: action.rule.actionType,
          success: false,
          error: errorMessage,
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      message: `Evaluated ticket and executed ${successCount} escalation(s)`,
      ticketId,
      escalationsExecuted: successCount,
      escalationsFailed: errorCount,
      results,
    });
  } catch (error) {
    console.error('Error evaluating ticket for escalation:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Evaluation error',
          code: 'EVALUATION_ERROR',
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
