import { prisma } from '@/lib/db';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  success: boolean;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class AuditService {
  /**
   * Log a ticket operation
   */
  async logTicketOperation(
    userId: string,
    action: string,
    ticketId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resourceType: 'ticket',
          resourceId: ticketId,
          success: true,
          details: details || {},
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log ticket operation:', error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Log a permission denial
   */
  async logPermissionDenial(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: `${action}_denied`,
          resourceType,
          resourceId,
          success: false,
          details: { reason: reason || 'Permission denied' },
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log permission denial:', error);
    }
  }

  /**
   * Log a general user action
   */
  async logUserAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    success: boolean = true,
    details?: any,
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
          details: details || {},
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters: AuditLogFilter): Promise<PaginatedAuditLogs> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }

    if (filters.success !== undefined) {
      where.success = filters.success;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Export audit logs to JSON
   */
  async exportAuditLogsJSON(filters: AuditLogFilter): Promise<string> {
    // Remove pagination for export
    const exportFilters = { ...filters, page: undefined, limit: undefined };
    
    const where: any = {};

    if (exportFilters.userId) {
      where.userId = exportFilters.userId;
    }

    if (exportFilters.action) {
      where.action = exportFilters.action;
    }

    if (exportFilters.resourceType) {
      where.resourceType = exportFilters.resourceType;
    }

    if (exportFilters.resourceId) {
      where.resourceId = exportFilters.resourceId;
    }

    if (exportFilters.success !== undefined) {
      where.success = exportFilters.success;
    }

    if (exportFilters.startDate || exportFilters.endDate) {
      where.timestamp = {};
      if (exportFilters.startDate) {
        where.timestamp.gte = exportFilters.startDate;
      }
      if (exportFilters.endDate) {
        where.timestamp.lte = exportFilters.endDate;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogsCSV(filters: AuditLogFilter): Promise<string> {
    // Remove pagination for export
    const exportFilters = { ...filters, page: undefined, limit: undefined };
    
    const where: any = {};

    if (exportFilters.userId) {
      where.userId = exportFilters.userId;
    }

    if (exportFilters.action) {
      where.action = exportFilters.action;
    }

    if (exportFilters.resourceType) {
      where.resourceType = exportFilters.resourceType;
    }

    if (exportFilters.resourceId) {
      where.resourceId = exportFilters.resourceId;
    }

    if (exportFilters.success !== undefined) {
      where.success = exportFilters.success;
    }

    if (exportFilters.startDate || exportFilters.endDate) {
      where.timestamp = {};
      if (exportFilters.startDate) {
        where.timestamp.gte = exportFilters.startDate;
      }
      if (exportFilters.endDate) {
        where.timestamp.lte = exportFilters.endDate;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // CSV header
    const headers = [
      'Timestamp',
      'User ID',
      'User Name',
      'User Email',
      'Action',
      'Resource Type',
      'Resource ID',
      'Success',
      'IP Address',
      'User Agent',
      'Details',
    ];

    // CSV rows
    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.userId || '',
      log.user?.name || '',
      log.user?.email || '',
      log.action,
      log.resourceType,
      log.resourceId || '',
      log.success ? 'Yes' : 'No',
      log.ipAddress || '',
      log.userAgent || '',
      JSON.stringify(log.details || {}),
    ]);

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV
    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map((cell) => escapeCSV(cell.toString())).join(',')),
    ];

    return csvLines.join('\n');
  }
}

export const auditService = new AuditService();
