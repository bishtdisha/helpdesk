import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { subDays, startOfDay, endOfDay, differenceInHours } from 'date-fns';

/**
 * GET /api/dashboard/all - Batch endpoint for all dashboard data
 * Returns all KPIs and widget data in a single request for optimal performance
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const thirtyDaysAgo = subDays(now, 30);

    // Build base where clause based on user role
    const userRole = currentUser.role?.name;
    const isAdmin = userRole === 'Admin/Manager';
    const isTeamLeader = userRole === 'Team Leader';

    let baseWhere: any = {};
    
    if (!isAdmin) {
      if (isTeamLeader && currentUser.teamId) {
        baseWhere.teamId = currentUser.teamId;
      } else {
        baseWhere.assignedTo = currentUser.id;
      }
    }

    // Execute all queries in parallel for maximum performance
    const [
      // Total tickets count
      totalTickets,
      // Open tickets
      openTickets,
      // Tickets by status
      ticketsByStatus,
      // Tickets by priority
      ticketsByPriority,
      // SLA at risk (due within 2 hours)
      slaAtRisk,
      // SLA breached
      slaBreached,
      // Resolved today
      resolvedToday,
      // Created today
      createdToday,
      // My assigned tickets (for current user)
      myTickets,
      // Recent tickets for list
      recentTickets,
      // Tickets created in last 30 days for trend
      ticketTrend,
    ] = await Promise.all([
      // Total tickets
      prisma.ticket.count({ where: baseWhere }),
      
      // Open tickets
      prisma.ticket.count({
        where: {
          ...baseWhere,
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER] },
        },
      }),
      
      // Tickets by status
      prisma.ticket.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true },
      }),
      
      // Tickets by priority
      prisma.ticket.groupBy({
        by: ['priority'],
        where: {
          ...baseWhere,
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER] },
        },
        _count: { priority: true },
      }),
      
      // SLA at risk (due within 2 hours, not resolved)
      prisma.ticket.count({
        where: {
          ...baseWhere,
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          slaDueAt: {
            gte: now,
            lte: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          },
        },
      }),
      
      // SLA breached
      prisma.ticket.count({
        where: {
          ...baseWhere,
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          slaDueAt: { lt: now },
        },
      }),
      
      // Resolved today
      prisma.ticket.count({
        where: {
          ...baseWhere,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      
      // Created today
      prisma.ticket.count({
        where: {
          ...baseWhere,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      
      // My tickets count
      prisma.ticket.count({
        where: {
          assignedTo: currentUser.id,
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      }),
      
      // Recent tickets for list widget
      prisma.ticket.findMany({
        where: {
          assignedTo: currentUser.id,
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          status: true,
          priority: true,
          slaDueAt: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
        orderBy: [
          { slaDueAt: 'asc' },
          { createdAt: 'desc' },
        ],
        take: 10,
      }),
      
      // Ticket trend (last 30 days)
      prisma.ticket.findMany({
        where: {
          ...baseWhere,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
          status: true,
        },
      }),
    ]);

    // Calculate SLA compliance
    const totalWithSLA = openTickets + slaBreached;
    const slaCompliance = totalWithSLA > 0 
      ? Math.round(((totalWithSLA - slaBreached) / totalWithSLA) * 100) 
      : 100;

    // Calculate average resolution time from resolved tickets
    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        ...baseWhere,
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        resolvedAt: { not: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
      take: 100,
    });

    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, t) => {
        if (t.resolvedAt) {
          return sum + differenceInHours(t.resolvedAt, t.createdAt);
        }
        return sum;
      }, 0);
      avgResolutionHours = Math.round(totalHours / resolvedTickets.length);
    }

    // Format status distribution
    const statusDistribution = Object.values(TicketStatus).map(status => {
      const found = ticketsByStatus.find(s => s.status === status);
      return {
        status,
        count: found?._count?.status || 0,
      };
    });

    // Format priority distribution
    const priorityDistribution = Object.values(TicketPriority).map(priority => {
      const found = ticketsByPriority.find(p => p.priority === priority);
      return {
        priority,
        count: found?._count?.priority || 0,
      };
    });

    // Calculate daily trend for last 7 days
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const created = ticketTrend.filter(t => 
        t.createdAt >= dayStart && t.createdAt <= dayEnd
      ).length;
      
      const resolved = ticketTrend.filter(t => 
        t.resolvedAt && t.resolvedAt >= dayStart && t.resolvedAt <= dayEnd
      ).length;
      
      dailyTrend.push({
        date: date.toISOString().split('T')[0],
        created,
        resolved,
      });
    }

    return NextResponse.json({
      // KPIs
      kpis: {
        totalTickets,
        openTickets,
        myTickets,
        slaAtRisk,
        slaBreached,
        slaCompliance,
        resolvedToday,
        createdToday,
        avgResolutionHours,
        avgResolutionFormatted: avgResolutionHours > 24 
          ? `${Math.round(avgResolutionHours / 24)}d` 
          : `${avgResolutionHours}h`,
      },
      // Distributions
      statusDistribution,
      priorityDistribution,
      // Trends
      dailyTrend,
      // Lists
      recentTickets,
      // Metadata
      generatedAt: now.toISOString(),
      userRole,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
