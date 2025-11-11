import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { analyticsService, AnalyticsAccessDeniedError } from '@/lib/services/analytics-service';

/**
 * GET /api/analytics/agents/:id - Get agent-specific analytics (Team Leader/Admin)
 * 
 * Query parameters:
 * - startDate: Start date for date range (ISO format)
 * - endDate: End date for date range (ISO format)
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

    const agentId = params.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to last 30 days if not provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format. Use ISO format (YYYY-MM-DD)',
        },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Start date must be before end date',
        },
        { status: 400 }
      );
    }

    // Get agent metrics
    const metrics = await analyticsService.getAgentMetrics(
      agentId,
      currentUser.id,
      { startDate, endDate }
    );

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching agent analytics:', error);
    
    if (error instanceof AnalyticsAccessDeniedError) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: error.code,
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('Agent not found')) {
      return NextResponse.json(
        {
          error: 'Not found',
          code: 'AGENT_NOT_FOUND',
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
