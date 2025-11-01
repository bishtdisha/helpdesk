import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/middleware';
import { auditLogger } from '@/lib/rbac/audit-logger';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';

/**
 * GET /api/audit-logs/stats
 * Get audit log statistics for monitoring dashboard (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply RBAC middleware - only admins can view audit statistics
    const rbacResult = await withRBAC(request, {
      requireAuth: true,
      requiredPermission: {
        action: PERMISSION_ACTIONS.READ,
        resource: RESOURCE_TYPES.AUDIT_LOGS,
      },
      auditAction: 'view_audit_stats',
    });

    if (rbacResult.response) {
      return rbacResult.response;
    }

    const { searchParams } = new URL(request.url);

    // Parse date range parameters
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (searchParams.get('startDate')) {
      startDate = new Date(searchParams.get('startDate')!);
    }

    if (searchParams.get('endDate')) {
      endDate = new Date(searchParams.get('endDate')!);
    }

    // Default to last 30 days if no date range specified
    if (!startDate && !endDate) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    // Get audit statistics
    const stats = await auditLogger.getAuditStats(startDate, endDate);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit statistics' },
      { status: 500 }
    );
  }
}