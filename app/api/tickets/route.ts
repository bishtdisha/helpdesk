import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { ticketService, CreateTicketData, TicketFilters } from '@/lib/services/ticket-service';
import { auditService } from '@/lib/services/audit-service';
import { TicketPriority, TicketStatus } from '@prisma/client';
import {
  TicketNotFoundError,
  TicketAccessDeniedError,
  TicketAssignmentDeniedError,
  InvalidTicketStatusTransitionError,
} from '@/lib/services/ticket-service';

/**
 * GET /api/tickets - List tickets with role-based filtering and pagination
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status (can be multiple)
 * - priority: Filter by priority (can be multiple)
 * - teamId: Filter by team ID
 * - assignedTo: Filter by assignee ID
 * - createdBy: Filter by creator ID
 * - customerId: Filter by customer ID
 * - search: Search by title or description
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    
    // Parse status filter (can be multiple)
    const statusParam = searchParams.getAll('status');
    const status = statusParam.length > 0 
      ? statusParam.filter(s => Object.values(TicketStatus).includes(s as TicketStatus)) as TicketStatus[]
      : undefined;
    
    // Parse priority filter (can be multiple)
    const priorityParam = searchParams.getAll('priority');
    const priority = priorityParam.length > 0
      ? priorityParam.filter(p => Object.values(TicketPriority).includes(p as TicketPriority)) as TicketPriority[]
      : undefined;
    
    const teamId = searchParams.get('teamId') || undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const createdBy = searchParams.get('createdBy') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const search = searchParams.get('search') || undefined;

    // Build filters
    const filters: TicketFilters = {
      status,
      priority,
      teamId,
      assignedTo,
      createdBy,
      customerId,
      search,
      page,
      limit,
    };

    // Get tickets with role-based filtering
    const result = await ticketService.listTickets(filters, currentUser.id);

    console.log('🔍 API Response:', {
      userId: currentUser.id,
      userName: currentUser.name,
      ticketsCount: result.data.length,
      total: result.pagination.total
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    
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
 * POST /api/tickets - Create a new ticket
 * 
 * Request body:
 * - title: Ticket title (required)
 * - description: Ticket description (required)
 * - priority: Ticket priority (required: LOW, MEDIUM, HIGH, URGENT)
 * - category: Ticket category (optional)
 * - customerId: Customer ID (required)
 * - teamId: Team ID (optional)
 * - assignedTo: Assigned user ID (optional)
 * - phone: Phone number (optional)
 * - status: Ticket status (optional: OPEN, IN_PROGRESS, WAITING_FOR_CUSTOMER, RESOLVED, CLOSED)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, priority, category, customerId, teamId, phone, status, assignedTo, followerIds } = body;

    // Validate required fields
    if (!title || !description || !priority || !assignedTo) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Title, description, priority, and assignedTo are required',
        },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.trim().length === 0) {
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

    // Validate description length
    if (description.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Description cannot be empty',
        },
        { status: 400 }
      );
    }

    // Validate priority
    if (!Object.values(TicketPriority).includes(priority)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid priority. Must be one of: LOW, MEDIUM, HIGH, URGENT',
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(TicketStatus).includes(status)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid status. Must be one of: OPEN, IN_PROGRESS, WAITING_FOR_CUSTOMER, RESOLVED, CLOSED',
        },
        { status: 400 }
      );
    }

    // Validate phone number format if provided
    if (phone) {
      // Allow alphanumeric characters and common phone symbols: +, -, (, ), space
      const phoneRegex = /^[0-9+\-() ]+$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Phone number can only contain digits, spaces, hyphens, parentheses, and plus signs',
          },
          { status: 400 }
        );
      }

      if (phone.length > 50) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Phone number cannot exceed 50 characters',
          },
          { status: 400 }
        );
      }
    }

    // Validate category length if provided
    if (category && category.length > 100) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Category cannot exceed 100 characters',
        },
        { status: 400 }
      );
    }

    // Validate followerIds if provided
    if (followerIds && !Array.isArray(followerIds)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'followerIds must be an array',
        },
        { status: 400 }
      );
    }

    // Create ticket data
    const ticketData: CreateTicketData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      category: category?.trim() || undefined,
      customerId,
      teamId: teamId || undefined,
      assignedTo: assignedTo || undefined,
      phone: phone?.trim() || undefined,
      status: status || undefined,
      followerIds: followerIds || undefined,
    };

    console.log('🌐 API: Creating ticket via POST /api/tickets');
    console.log('   Current User:', currentUser.name, currentUser.email);
    console.log('   Ticket Data:', { title: ticketData.title, assignedTo: ticketData.assignedTo });
    
    // Create the ticket
    const ticket = await ticketService.createTicket(ticketData, currentUser.id);

    console.log('🌐 API: Ticket created successfully, ID:', ticket.id);

    // Log audit entry
    await auditService.logTicketOperation(
      currentUser.id,
      'ticket_created',
      ticket.id,
      { title: ticket.title, priority: ticket.priority },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      {
        message: 'Ticket created successfully',
        ticket,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating ticket:', error);
    
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

    // Handle foreign key validation errors from our service
    if (error instanceof Error && 
        (error.message.includes('does not exist') || 
         error.message.includes('Foreign key constraint'))) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
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
