import { prisma } from '../db';
import { AuditLogEntry, AuditLogFilter, AuditLogResult } from '../types/rbac';

/**
 * Audit Logger Service - Tracks permission-sensitive actions and security events
 * 
 * This service provides comprehensive audit logging for RBAC operations,
 * permission violations, and user activity monitoring.
 */
export class AuditLogger {
  /**
   * Log a permission-sensitive action
   * 
   * @param userId - ID of the user performing the action (null for system actions)
   * @param action - The action being performed
   * @param resourceType - Type of resource being acted upon
   * @param resourceId - ID of the specific resource (optional)
   * @param success - Whether the action was successful
   * @param details - Additional details about the action
   * @param ipAddress - IP address of the user (optional)
   * @param userAgent - User agent string (optional)
   */
  async logAction(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId?: string,
    success: boolean = true,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resourceType,
          resourceId,
          success,
          details: details ? JSON.parse(JSON.stringify(details)) : null,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Log audit failures but don't throw - we don't want audit logging to break the main operation
      console.error('Failed to log audit action:', error);
    }
  }

  /**
   * Log a permission violation attempt
   * 
   * @param userId - ID of the user attempting the action
   * @param action - The action that was attempted
   * @param resourceType - Type of resource that was accessed
   * @param resourceId - ID of the specific resource (optional)
   * @param reason - Reason for the permission denial
   * @param ipAddress - IP address of the user (optional)
   * @param userAgent - User agent string (optional)
   */
  async logPermissionViolation(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction(
      userId,
      `permission_violation_${action}`,
      resourceType,
      resourceId,
      false,
      {
        attemptedAction: action,
        denialReason: reason,
        violationType: 'permission_denied',
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log user authentication events
   * 
   * @param userId - ID of the user (null for failed login attempts)
   * @param action - Authentication action (login, logout, failed_login, etc.)
   * @param success - Whether the authentication was successful
   * @param details - Additional details about the authentication
   * @param ipAddress - IP address of the user
   * @param userAgent - User agent string
   */
  async logAuthEvent(
    userId: string | null,
    action: string,
    success: boolean,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction(
      userId,
      action,
      'authentication',
      userId || undefined,
      success,
      details,
      ipAddress,
      userAgent
    );
  }

  /**
   * Log role and team assignment changes
   * 
   * @param performerId - ID of the user performing the assignment
   * @param targetUserId - ID of the user being assigned
   * @param action - Assignment action (assign_role, assign_team, etc.)
   * @param details - Details about the assignment
   * @param ipAddress - IP address of the performer
   * @param userAgent - User agent string
   */
  async logRoleAssignment(
    performerId: string,
    targetUserId: string,
    action: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction(
      performerId,
      action,
      'user',
      targetUserId,
      true,
      {
        ...details,
        targetUserId,
        assignmentType: 'role_team_management',
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log data access events for sensitive operations
   * 
   * @param userId - ID of the user accessing the data
   * @param action - Access action (view, export, etc.)
   * @param resourceType - Type of resource being accessed
   * @param resourceId - ID of the specific resource
   * @param details - Additional details about the access
   * @param ipAddress - IP address of the user
   * @param userAgent - User agent string
   */
  async logDataAccess(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction(
      userId,
      `data_access_${action}`,
      resourceType,
      resourceId,
      true,
      {
        ...details,
        accessType: 'data_access',
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Get audit logs with filtering and pagination
   * 
   * @param filter - Filter criteria for the audit logs
   * @param page - Page number (1-based)
   * @param limit - Number of records per page
   * @returns Promise<AuditLogResult> - Paginated audit log results
   */
  async getAuditLogs(
    filter: AuditLogFilter = {},
    page: number = 1,
    limit: number = 50
  ): Promise<AuditLogResult> {
    const offset = (page - 1) * limit;

    // Build where clause based on filter
    const where: any = {};

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.action) {
      where.action = {
        contains: filter.action,
        mode: 'insensitive',
      };
    }

    if (filter.resourceType) {
      where.resourceType = filter.resourceType;
    }

    if (filter.resourceId) {
      where.resourceId = filter.resourceId;
    }

    if (filter.success !== undefined) {
      where.success = filter.success;
    }

    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) {
        where.timestamp.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.timestamp.lte = filter.endDate;
      }
    }

    if (filter.ipAddress) {
      where.ipAddress = filter.ipAddress;
    }

    // Get total count for pagination
    const totalCount = await prisma.auditLog.count({ where });

    // Get audit logs with user information
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      logs: logs.map(log => ({
        id: log.id,
        userId: log.userId,
        user: log.user,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        success: log.success,
        details: log.details as Record<string, any> | null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.timestamp,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get audit log statistics for monitoring dashboard
   * 
   * @param startDate - Start date for statistics (optional)
   * @param endDate - End date for statistics (optional)
   * @returns Promise<AuditLogStats> - Audit log statistics
   */
  async getAuditStats(startDate?: Date, endDate?: Date): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    permissionViolations: number;
    uniqueUsers: number;
    topActions: Array<{ action: string; count: number }>;
    topResources: Array<{ resourceType: string; count: number }>;
    recentViolations: Array<{
      userId: string;
      action: string;
      resourceType: string;
      timestamp: Date;
      user?: { name: string; email: string };
    }>;
  }> {
    const where: any = {};

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    // Get basic statistics
    const [
      totalActions,
      successfulActions,
      failedActions,
      permissionViolations,
      uniqueUsers,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, success: true } }),
      prisma.auditLog.count({ where: { ...where, success: false } }),
      prisma.auditLog.count({
        where: {
          ...where,
          action: {
            startsWith: 'permission_violation_',
          },
        },
      }),
      prisma.auditLog.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      }).then(results => results.filter(r => r.userId).length),
    ]);

    // Get top actions
    const topActionsRaw = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    });

    const topActions = topActionsRaw.map(item => ({
      action: item.action,
      count: item._count.action,
    }));

    // Get top resource types
    const topResourcesRaw = await prisma.auditLog.groupBy({
      by: ['resourceType'],
      where,
      _count: {
        resourceType: true,
      },
      orderBy: {
        _count: {
          resourceType: 'desc',
        },
      },
      take: 10,
    });

    const topResources = topResourcesRaw.map(item => ({
      resourceType: item.resourceType,
      count: item._count.resourceType,
    }));

    // Get recent permission violations
    const recentViolations = await prisma.auditLog.findMany({
      where: {
        ...where,
        action: {
          startsWith: 'permission_violation_',
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    return {
      totalActions,
      successfulActions,
      failedActions,
      permissionViolations,
      uniqueUsers,
      topActions,
      topResources,
      recentViolations: recentViolations.map(violation => ({
        userId: violation.userId!,
        action: violation.action,
        resourceType: violation.resourceType,
        timestamp: violation.timestamp,
        user: violation.user,
      })),
    };
  }

  /**
   * Delete old audit logs based on retention policy
   * 
   * @param retentionDays - Number of days to retain logs
   * @returns Promise<number> - Number of deleted records
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    // Log the cleanup action
    await this.logAction(
      null,
      'audit_log_cleanup',
      'system',
      undefined,
      true,
      {
        deletedCount: result.count,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
      }
    );

    return result.count;
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();