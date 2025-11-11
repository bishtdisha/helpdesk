/**
 * Optimized Database Queries
 * Provides optimized query patterns for common operations
 * Requirements: All (Performance Optimization)
 */

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Optimized ticket list query with minimal data transfer
 */
export async function getOptimizedTicketList(
  filters: {
    status?: string[];
    priority?: string[];
    teamId?: string;
    assignedTo?: string;
    createdBy?: string;
    search?: string;
  },
  pagination: {
    page: number;
    limit: number;
  },
  userId: string
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.TicketWhereInput = {
    AND: [
      filters.status ? { status: { in: filters.status as any } } : {},
      filters.priority ? { priority: { in: filters.priority as any } } : {},
      filters.teamId ? { teamId: filters.teamId } : {},
      filters.assignedTo ? { assignedTo: filters.assignedTo } : {},
      filters.createdBy ? { createdBy: filters.createdBy } : {},
      filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {},
    ],
  };

  // Execute queries in parallel
  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        customerId: true,
        assignedTo: true,
        teamId: true,
        createdBy: true,
        slaDueAt: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            followers: true,
            attachments: true,
          },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data: tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Optimized ticket detail query with all related data
 */
export async function getOptimizedTicketDetail(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
        },
      },
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      attachments: {
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      followers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      history: {
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit history to recent 50 entries
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      feedback: true,
    },
  });
}

/**
 * Optimized analytics query for organization metrics
 */
export async function getOptimizedOrganizationMetrics(dateRange: {
  startDate: Date;
  endDate: Date;
}) {
  const { startDate, endDate } = dateRange;

  // Execute all queries in parallel
  const [
    totalTickets,
    ticketsByStatus,
    ticketsByPriority,
    avgResolutionTime,
    avgResponseTime,
    slaCompliance,
    customerSatisfaction,
  ] = await Promise.all([
    // Total tickets
    prisma.ticket.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),

    // Tickets by status
    prisma.ticket.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    }),

    // Tickets by priority
    prisma.ticket.groupBy({
      by: ['priority'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    }),

    // Average resolution time
    prisma.$queryRaw<Array<{ avg: number }>>`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg
      FROM tickets
      WHERE resolved_at IS NOT NULL
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
    `,

    // Average response time (time to first comment)
    prisma.$queryRaw<Array<{ avg: number }>>`
      SELECT AVG(EXTRACT(EPOCH FROM (c.created_at - t.created_at)) / 3600) as avg
      FROM tickets t
      INNER JOIN (
        SELECT ticket_id, MIN(created_at) as created_at
        FROM comments
        GROUP BY ticket_id
      ) c ON t.id = c.ticket_id
      WHERE t.created_at >= ${startDate}
        AND t.created_at <= ${endDate}
    `,

    // SLA compliance rate
    prisma.$queryRaw<Array<{ compliance_rate: number }>>`
      SELECT 
        (COUNT(CASE WHEN resolved_at <= sla_due_at THEN 1 END)::float / 
         NULLIF(COUNT(*), 0)) * 100 as compliance_rate
      FROM tickets
      WHERE sla_due_at IS NOT NULL
        AND resolved_at IS NOT NULL
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
    `,

    // Customer satisfaction
    prisma.ticketFeedback.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _avg: {
        rating: true,
      },
    }),
  ]);

  return {
    totalTickets,
    ticketsByStatus: ticketsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    ),
    ticketsByPriority: ticketsByPriority.reduce(
      (acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      },
      {} as Record<string, number>
    ),
    averageResolutionTime: avgResolutionTime[0]?.avg || 0,
    averageResponseTime: avgResponseTime[0]?.avg || 0,
    slaComplianceRate: slaCompliance[0]?.compliance_rate || 0,
    customerSatisfactionScore: customerSatisfaction._avg.rating || 0,
  };
}

/**
 * Optimized team metrics query
 */
export async function getOptimizedTeamMetrics(
  teamId: string,
  dateRange: {
    startDate: Date;
    endDate: Date;
  }
) {
  const { startDate, endDate } = dateRange;

  const [
    totalTickets,
    ticketsByStatus,
    agentPerformance,
    avgResolutionTime,
    slaCompliance,
  ] = await Promise.all([
    // Total team tickets
    prisma.ticket.count({
      where: {
        teamId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),

    // Tickets by status
    prisma.ticket.groupBy({
      by: ['status'],
      where: {
        teamId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    }),

    // Agent performance
    prisma.ticket.groupBy({
      by: ['assignedTo'],
      where: {
        teamId,
        assignedTo: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    }),

    // Average resolution time
    prisma.$queryRaw<Array<{ avg: number }>>`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg
      FROM tickets
      WHERE team_id = ${teamId}
        AND resolved_at IS NOT NULL
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
    `,

    // SLA compliance
    prisma.$queryRaw<Array<{ compliance_rate: number }>>`
      SELECT 
        (COUNT(CASE WHEN resolved_at <= sla_due_at THEN 1 END)::float / 
         NULLIF(COUNT(*), 0)) * 100 as compliance_rate
      FROM tickets
      WHERE team_id = ${teamId}
        AND sla_due_at IS NOT NULL
        AND resolved_at IS NOT NULL
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
    `,
  ]);

  return {
    teamId,
    totalTickets,
    ticketsByStatus: ticketsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    ),
    agentPerformance: agentPerformance.map((item) => ({
      agentId: item.assignedTo!,
      ticketCount: item._count,
    })),
    averageResolutionTime: avgResolutionTime[0]?.avg || 0,
    slaComplianceRate: slaCompliance[0]?.compliance_rate || 0,
  };
}

/**
 * Batch fetch users with roles
 */
export async function batchFetchUsersWithRoles(userIds: string[]) {
  if (userIds.length === 0) return [];

  return prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });
}

/**
 * Batch fetch tickets with minimal data
 */
export async function batchFetchTickets(ticketIds: string[]) {
  if (ticketIds.length === 0) return [];

  return prisma.ticket.findMany({
    where: {
      id: { in: ticketIds },
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Get unread notification count efficiently
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Bulk mark notifications as read
 */
export async function bulkMarkNotificationsAsRead(
  userId: string,
  notificationIds?: string[]
): Promise<number> {
  const where: Prisma.NotificationWhereInput = {
    userId,
    isRead: false,
  };

  if (notificationIds && notificationIds.length > 0) {
    where.id = { in: notificationIds };
  }

  const result = await prisma.notification.updateMany({
    where,
    data: {
      isRead: true,
      updatedAt: new Date(),
    },
  });

  return result.count;
}
