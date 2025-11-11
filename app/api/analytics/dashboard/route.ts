import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { analyticsService, AnalyticsAccessDeniedError } from '@/lib/services/analytics-service';

/**
 * GET /api/analytics/dashboard - Get role-specific dashboard data
 * 
 * Query parameters:
 * - startDate: Start date for date range (ISO format)
 * - endDate: End date for date range (ISO format)
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

    // Get dashboard data based on user role
    const dashboardData = await analyticsService.getDashboardData(
      currentUser.id,
      { startDate, endDate }
    );

    if (!dashboardData) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: 'ANALYTICS_ACCESS_DENIED',
          message: 'You do not have permission to view analytics',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
