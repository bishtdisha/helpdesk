import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { getTicketFilterForUser } from '@/lib/dashboard-helpers';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get role-based filter
    const ticketFilter = await getTicketFilterForUser(currentUser.id);

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    let startDate = new Date();
    let endDate = new Date();

    if (range === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      // Calculate date range based on preset
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      switch (range) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7days':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '15days':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 15);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '30days':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
      }
    }

    // Run initial queries in parallel for better performance
    const [resolvedInRange, assignedTickets] = await Promise.all([
      // Get SLA success rate for date range (filtered by role)
      prisma.ticket.findMany({
        where: {
          ...ticketFilter,
          resolvedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          resolvedAt: true,
          slaDueAt: true,
        },
      }),
      // Get assigned tickets count (only tickets assigned to user OR they are following)
      prisma.ticket.count({
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'],
          },
          OR: [
            { assignedTo: currentUser.id },
            { 
              followers: {
                some: {
                  userId: currentUser.id
                }
              }
            }
          ],
        },
      }),
    ]);

    // Calculate resolved count from fetched data
    const resolved = resolvedInRange.length;

    const slaCompliant = resolvedInRange.filter(t =>
      t.slaDueAt && t.resolvedAt && t.resolvedAt <= t.slaDueAt
    ).length;

    const slaSuccessRate = resolvedInRange.length > 0
      ? (slaCompliant / resolvedInRange.length) * 100
      : 0;

    // Calculate average first response time
    // First response = first non-internal comment from assigned user after ticket creation
    const ticketsWithFirstResponse = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        assignedTo: true,
        comments: {
          where: {
            isInternal: false,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
          select: {
            createdAt: true,
            authorId: true,
          },
        },
      },
    });

    // Calculate first response times (in minutes)
    const responseTimes: number[] = [];
    for (const ticket of ticketsWithFirstResponse) {
      const firstComment = ticket.comments[0];
      if (firstComment) {
        const responseTime = (firstComment.createdAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60); // in minutes
        responseTimes.push(responseTime);
      }
    }

    const avgFirstResponseMinutes = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Format first response time
    const formatResponseTime = (minutes: number) => {
      if (minutes < 60) {
        return `${Math.round(minutes)}m`;
      } else if (minutes < 1440) { // less than 24 hours
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      } else {
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
      }
    };

    // Calculate comparison period (previous period of same length)
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1); // Day before current period starts
    prevEndDate.setHours(23, 59, 59, 999);
    const prevStartDate = new Date(prevEndDate.getTime() - periodLength);
    prevStartDate.setHours(0, 0, 0, 0);

    // Get previous period data - single query
    const prevResolvedInRange = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        resolvedAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      select: {
        resolvedAt: true,
        slaDueAt: true,
      },
    });

    // Calculate previous resolved count from fetched data
    const prevResolved = prevResolvedInRange.length;

    const prevSlaCompliant = prevResolvedInRange.filter(t =>
      t.slaDueAt && t.resolvedAt && t.resolvedAt <= t.slaDueAt
    ).length;

    const prevSlaSuccessRate = prevResolvedInRange.length > 0
      ? (prevSlaCompliant / prevResolvedInRange.length) * 100
      : 0;

    // Get previous period first response time
    const prevTicketsWithFirstResponse = await prisma.ticket.findMany({
      where: {
        ...ticketFilter,
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        comments: {
          where: {
            isInternal: false,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
    });

    const prevResponseTimes: number[] = [];
    for (const ticket of prevTicketsWithFirstResponse) {
      const firstComment = ticket.comments[0];
      if (firstComment) {
        const responseTime = (firstComment.createdAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60);
        prevResponseTimes.push(responseTime);
      }
    }

    const prevAvgFirstResponseMinutes = prevResponseTimes.length > 0
      ? prevResponseTimes.reduce((a, b) => a + b, 0) / prevResponseTimes.length
      : 0;

    // Calculate changes
    const resolvedChange = prevResolved > 0 
      ? ((resolved - prevResolved) / prevResolved) * 100 
      : resolved > 0 ? 100 : 0;
    
    const slaChange = prevSlaSuccessRate > 0 
      ? slaSuccessRate - prevSlaSuccessRate 
      : slaSuccessRate > 0 ? slaSuccessRate : 0;

    // For response time, negative change is good (faster)
    const responseTimeChange = prevAvgFirstResponseMinutes > 0
      ? ((avgFirstResponseMinutes - prevAvgFirstResponseMinutes) / prevAvgFirstResponseMinutes) * 100
      : 0;

    // Get comparison label based on range
    const getComparisonLabel = () => {
      switch (range) {
        case 'today': return 'vs Yesterday';
        case '7days': return 'vs Previous 7 Days';
        case '15days': return 'vs Previous 15 Days';
        case '30days': return 'vs Previous 30 Days';
        default: return 'vs Previous Period';
      }
    };

    return NextResponse.json({
      resolved,
      assignedTickets,
      slaSuccessRate,
      firstResponseTime: formatResponseTime(avgFirstResponseMinutes),
      firstResponseMinutes: avgFirstResponseMinutes,
      comparison: {
        label: getComparisonLabel(),
        resolved: {
          previous: prevResolved,
          change: resolvedChange,
        },
        slaSuccessRate: {
          previous: prevSlaSuccessRate,
          change: slaChange,
        },
        firstResponseTime: {
          previous: formatResponseTime(prevAvgFirstResponseMinutes),
          previousMinutes: prevAvgFirstResponseMinutes,
          change: responseTimeChange,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching today performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
