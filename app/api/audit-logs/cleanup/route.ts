import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/middleware';
import { auditLogger } from '@/lib/rbac/audit-logger';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';

/**
 * POST /api/audit-logs/cleanup
 * Clean up old audit logs based on retention policy (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Apply RBAC middleware - only admins can clean up audit logs
    const rbacResult = await withRBAC(request, {
      requireAuth: true,
      requiredPermission: {
        action: PERMISSION_ACTIONS.DELETE,
        resource: RESOURCE_TYPES.AUDIT_LOGS,
      },
      auditAction: 'cleanup_audit_logs',
    });

    if (rbacResult.response) {
      return rbacResult.response;
    }

    const body = await request.json();
    const retentionDays = body.retentionDays || 90; // Default to 90 days

    // Validate retention days
    if (retentionDays < 1 || retentionDays > 365) {
      return NextResponse.json(
        { error: 'Retention days must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Perform cleanup
    const deletedCount = await auditLogger.cleanupOldLogs(retentionDays);

    return NextResponse.json({
      success: true,
      deletedCount,
      retentionDays,
      message: `Successfully deleted ${deletedCount} audit log entries older than ${retentionDays} days`,
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to clean up audit logs' },
      { status: 500 }
    );
  }
}