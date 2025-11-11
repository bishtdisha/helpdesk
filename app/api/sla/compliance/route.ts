import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { slaService, SLAFilters } from '@/lib/services/sla-service';
import { TicketPriority } from '@prisma/client';

/**
 * GET /api/sla/compliance - Get SLA compliance metrics with role-based filtering
 * 
 * Query parameters:
 * - teamId: Filter by team ID (optional)
 * - priority: Filter by priority (optional)
 * - startDate: Filter by start date (optional, ISO 8601 format)
 * - endDate: Filter by end date (optional, ISO 8601 format)
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
    const priority = searchParams.get('priority') as TicketPriority | undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Validate priority if provided
    if (priority && !Object.values(TicketPriority).includes(priority)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid priority. Must be one of: LOW, MEDIUM, HIGH, URGENT',
        },
        { status: 400 }
      );
    }

    // Parse dates
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: 'Invalid startDate format. Use ISO 8601 format.',
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
            message: 'Invalid endDate format. Use ISO 8601 format.',
          },
          { status: 400 }
        );
      }
    }

    // Build filters
    const filters: SLAFilters = {
      teamId,
      priority,
      startDate,
      endDate,
    };

    // Get compliance metrics with role-based filtering
    const metrics = await slaService.getSLAComplianceMetrics(filters, currentUser.id);

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching SLA compliance metrics:', error);
    
    if (error instanceof Error && error.message === 'User role not found') {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: 'ACCESS_DENIED',
          message: 'User role not found',
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
