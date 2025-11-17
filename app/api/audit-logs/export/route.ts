import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { auditService } from '@/lib/services';
import { hasPermission } from '@/lib/rbac/permissions';

/**
 * POST /api/audit-logs/export
 * Export audit logs (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is Admin
    const isAdmin = await hasPermission(user.id, 'audit_logs', 'read');
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can export audit logs' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      format = 'csv',
      userId,
      action,
      resourceType,
      resourceId,
      success,
      startDate,
      endDate,
    } = body;

    // Validate format
    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "csv" or "json"' },
        { status: 400 }
      );
    }

    const filters = {
      userId,
      action,
      resourceType,
      resourceId,
      success,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    // Export audit logs
    let content: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      content = await auditService.exportAuditLogsCSV(filters);
      contentType = 'text/csv';
      filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      content = await auditService.exportAuditLogsJSON(filters);
      contentType = 'application/json';
      filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    }

    // Return file as download
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
