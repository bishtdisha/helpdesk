import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { analyticsService, AnalyticsAccessDeniedError } from '@/lib/services/analytics-service';
import { ticketService } from '@/lib/services/ticket-service';
import { TicketFilters } from '@/lib/types/ticket';

/**
 * Convert tickets to CSV format
 */
function convertTicketsToCSV(tickets: any[], columns: string[]): string {
  const lines: string[] = [];
  
  // Define column mappings
  const columnMap: Record<string, { header: string; getValue: (ticket: any) => string }> = {
    id: { header: 'Ticket ID', getValue: (t) => t.id },
    title: { header: 'Title', getValue: (t) => `"${(t.title || '').replace(/"/g, '""')}"` },
    description: { header: 'Description', getValue: (t) => `"${(t.description || '').replace(/"/g, '""')}"` },
    status: { header: 'Status', getValue: (t) => t.status },
    priority: { header: 'Priority', getValue: (t) => t.priority },
    customer: { header: 'Customer', getValue: (t) => `"${t.customer?.name || t.customer?.email || ''}"` },
    assignee: { header: 'Assignee', getValue: (t) => `"${t.assignedUser?.name || 'Unassigned'}"` },
    team: { header: 'Team', getValue: (t) => `"${t.team?.name || ''}"` },
    category: { header: 'Category', getValue: (t) => t.category || '' },
    createdAt: { header: 'Created Date', getValue: (t) => new Date(t.createdAt).toISOString() },
    updatedAt: { header: 'Updated Date', getValue: (t) => new Date(t.updatedAt).toISOString() },
    resolvedAt: { header: 'Resolved Date', getValue: (t) => t.resolvedAt ? new Date(t.resolvedAt).toISOString() : '' },
    closedAt: { header: 'Closed Date', getValue: (t) => t.closedAt ? new Date(t.closedAt).toISOString() : '' },
  };
  
  // If no columns specified, use all
  const selectedColumns = columns.length > 0 ? columns : Object.keys(columnMap);
  
  // Add header row
  const headers = selectedColumns.map(col => columnMap[col]?.header || col).join(',');
  lines.push(headers);
  
  // Add data rows
  tickets.forEach(ticket => {
    const values = selectedColumns.map(col => {
      const mapping = columnMap[col];
      return mapping ? mapping.getValue(ticket) : '';
    });
    lines.push(values.join(','));
  });
  
  return lines.join('\n');
}

/**
 * POST /api/analytics/export - Export analytics report or tickets
 * 
 * Request body:
 * - reportType: Type of report (organization, team, agent, comparative, tickets)
 * - format: Export format (csv, json)
 * - teamId: Team ID (required for team reports)
 * - agentId: Agent ID (required for agent reports)
 * - startDate: Start date for date range (ISO format)
 * - endDate: End date for date range (ISO format)
 * - columns: Array of column IDs to include (for ticket exports)
 * - filters: Ticket filters (for ticket exports)
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
    const { reportType, format, teamId, agentId, startDate: startDateParam, endDate: endDateParam, columns, filters } = body;

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
    const validReportTypes = ['organization', 'team', 'agent', 'comparative', 'tickets'];
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

    let reportData: string;
    let filename: string;

    // Handle ticket export separately
    if (reportType === 'tickets') {
      // Build ticket filters - remove pagination for export
      const ticketFilters: TicketFilters = {
        ...filters,
        limit: 10000, // Large limit to get all tickets
      };

      // Fetch tickets with RBAC filtering
      const result = await ticketService.listTickets(ticketFilters, currentUser.id);
      
      // Convert to CSV
      if (format === 'csv') {
        reportData = convertTicketsToCSV(result.data, columns || []);
      } else {
        reportData = JSON.stringify(result.data, null, 2);
      }

      filename = `tickets-export-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.${format}`;
    } else {
      // Export analytics report
      reportData = await analyticsService.exportReport(
        reportType as 'organization' | 'team' | 'agent' | 'comparative',
        format,
        {
          teamId,
          agentId,
          dateRange: { startDate, endDate },
        },
        currentUser.id
      );

      filename = `${reportType}-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.${format}`;
    }

    // Set appropriate content type
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

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
