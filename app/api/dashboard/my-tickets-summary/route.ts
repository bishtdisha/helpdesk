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

    // Run all queries in parallel for better performance
    const [myTickets, failedEscalated, resolved] = await Promise.all([
      // Get tickets assigned to current user
      prisma.ticket.findMany({
        where: { assignedTo: currentUser.id },
        select: { id: true, status: true, priority: true, createdAt: true },
      }),
      // Failed/Escalated (overdue tickets)
      prisma.ticket.count({
        where: {
          assignedTo: currentUser.id,
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] },
          slaDueAt: { lt: now },
        },
      }),
      // Resolved tickets today
      prisma.ticket.count({
        where: {
          assignedTo: currentUser.id,
          status: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { gte: startOfDay },
        },
      }),
    ]);

    // Calculate metrics from fetched tickets (in-memory, fast)
    const openStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'];
    const openTickets = myTickets.filter(t => openStatuses.includes(t.status));
    
    const open = openTickets.length;
    const highPriority = openTickets.filter(t => t.priority === 'HIGH').length;
    const urgent = openTickets.filter(t => t.priority === 'URGENT').length;
    const inProgress = myTickets.filter(t => t.status === 'IN_PROGRESS').length;

    // Calculate average open hours
    const avgOpenHours = openTickets.length > 0
      ? openTickets.reduce((sum, t) => {
          const hours = (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / openTickets.length
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
