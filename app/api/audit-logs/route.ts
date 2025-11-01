import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/middleware';
import { auditLogger } from '@/lib/rbac/audit-logger';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';
import { AuditLogFilter } from '@/lib/types/rbac';

/**
 * GET /api/audit-logs
 * Get audit logs with filtering and pagination (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply RBAC middleware - only admins can view audit logs
    const rbacResult = await withRBAC(request, {
      requireAuth: true,
      requiredPermission: {
        action: PERMISSION_ACTIONS.READ,
        resource: RESOURCE_TYPES.AUDIT_LOGS,
      },
      auditAction: 'view_audit_logs',
    });

    if (rbacResult.response) {
      return rbacResult.response;
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page

    // Build filter from query parameters
    const filter: AuditLogFilter = {};

    if (searchParams.get('userId')) {
      filter.userId = searchParams.get('userId')!;
    }

    if (searchParams.get('action')) {
      filter.action = searchParams.get('action')!;
    }

    if (searchParams.get('resourceType')) {
      filter.resourceType = searchParams.get('resourceType')!;
    }

    if (searchParams.get('resourceId')) {
      filter.resourceId = searchParams.get('resourceId')!;
    }

    if (searchParams.get('success')) {
      filter.success = searchParams.get('success') === 'true';
    }

    if (searchParams.get('startDate')) {
      filter.startDate = new Date(searchParams.get('startDate')!);
    }

    if (searchParams.get('endDate')) {
      filter.endDate = new Date(searchParams.get('endDate')!);
    }

    if (searchParams.get('ipAddress')) {
      filter.ipAddress = searchParams.get('ipAddress')!;
    }

    // Get audit logs
    const result = await auditLogger.getAuditLogs(filter, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}