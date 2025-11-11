import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-auth';
import { auditService } from '@/lib/services';
import { hasPermission } from '@/lib/rbac/permissions';

/**
 * GET /api/audit-logs
 * Get audit logs with filtering (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is Admin
    const isAdmin = await hasPermission(session.user.id, 'audit_logs', 'read');
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can view audit logs' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const successParam = searchParams.get('success');
    const success = successParam ? successParam === 'true' : undefined;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Get audit logs
    const result = await auditService.getAuditLogs({
      userId,
      action,
      resourceType,
      resourceId,
      success,
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
