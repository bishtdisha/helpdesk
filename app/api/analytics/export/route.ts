import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { analyticsService, AnalyticsAccessDeniedError } from '@/lib/services/analytics-service';

/**
 * POST /api/analytics/export - Export analytics report
 * 
 * Request body:
 * - reportType: Type of report (organization, team, agent, comparative)
 * - format: Export format (csv, json)
 * - teamId: Team ID (required for team reports)
 * - agentId: Agent ID (required for agent reports)
 * - startDate: Start date for date range (ISO format)
 * - endDate: End date for date range (ISO format)
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
    const { reportType, format, teamId, agentId, startDate: startDateParam, endDate: endDateParam } = body;

    // Validate required fields
    if (!reportType || !format) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'reportType and format are required',
        },
        { status: 400 }
      );
    }

    // Validate report type
    const validReportTypes = ['organization', 'team', 'agent', 'comparative'];
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: `Invalid reportType. Must be one of: ${validReportTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ['csv', 'json'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: `Invalid format. Must be one of: ${validFormats.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate team ID for team reports
    if (reportType === 'team' && !teamId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'teamId is required for team reports',
        },
        { status: 400 }
      );
    }

    // Validate agent ID for agent reports
    if (reportType === 'agent' && !agentId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'agentId is required for agent reports',
        },
        { status: 400 }
      );
    }

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

    // Export report
    const reportData = await analyticsService.exportReport(
      reportType,
      format,
      {
        teamId,
        agentId,
        dateRange: { startDate, endDate },
      },
      currentUser.id
    );

    // Set appropriate content type and filename
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const extension = format === 'csv' ? 'csv' : 'json';
    const filename = `${reportType}-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.${extension}`;

    return new NextResponse(reportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    
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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Export error',
          code: 'EXPORT_ERROR',
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
