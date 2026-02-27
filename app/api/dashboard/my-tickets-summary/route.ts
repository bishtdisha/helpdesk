import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Build where clause based on user role
    // For employees: show tickets they created, are assigned to, or are following
    const ticketWhere = {
      OR: [
        { createdBy: currentUser.id },
        { assignedTo: currentUser.id },
        { followers: { some: { userId: currentUser.id } } },
      ],
    };

    // Run all queries in parallel for better performance
    const [myTickets, failedEscalated, resolved] = await Promise.all([
      // Get tickets for current user (created, assigned, or following)
      prisma.ticket.findMany({
        where: ticketWhere,
        select: { id: true, status: true, priority: true, createdAt: true, assignedTo: true },
      }),
      // Failed/Escalated (overdue tickets)
      prisma.ticket.count({
        where: {
          ...ticketWhere,
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] },
          slaDueAt: { lt: now },
        },
      }),
      // Resolved tickets today
      prisma.ticket.count({
        where: {
          ...ticketWhere,
          status: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { gte: startOfDay },
        },
      }),
    ]);

    // Calculate metrics from fetched tickets (in-memory, fast)
    const openStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'];
    const openTickets = myTickets.filter(t => openStatuses.includes(t.status));
    
    // For "My Tickets" - show only tickets assigned to the user
    const assignedOpenTickets = openTickets.filter(t => t.assignedTo === currentUser.id);
    
    const open = assignedOpenTickets.length;
    const highPriority = assignedOpenTickets.filter(t => t.priority === 'HIGH').length;
    const urgent = assignedOpenTickets.filter(t => t.priority === 'URGENT').length;
    const inProgress = myTickets.filter(t => t.status === 'IN_PROGRESS' && t.assignedTo === currentUser.id).length;

    // Calculate average open hours for assigned tickets
    const avgOpenHours = assignedOpenTickets.length > 0
      ? assignedOpenTickets.reduce((sum, t) => {
          const hours = (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / assignedOpenTickets.length
      : 0;

    return NextResponse.json({
      open,
      highPriority,
      urgent,
      avgOpenHours,
      failedEscalated,
      resolved,
      inProgress,
    });
  } catch (error) {
    console.error('Error fetching my tickets summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
