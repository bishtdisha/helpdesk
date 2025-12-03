import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get tickets assigned to current user
    const myTickets = await prisma.ticket.findMany({
      where: {
        assignedTo: currentUser.id,
      },
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    // Calculate metrics
    const open = myTickets.filter(t =>
      ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'].includes(t.status)
    ).length;

    const highPriority = myTickets.filter(t =>
      t.priority === 'HIGH' && ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'].includes(t.status)
    ).length;

    const urgent = myTickets.filter(t =>
      t.priority === 'URGENT' && ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'].includes(t.status)
    ).length;

    // Calculate average open hours
    const openTickets = myTickets.filter(t =>
      ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'].includes(t.status)
    );

    const avgOpenHours = openTickets.length > 0
      ? openTickets.reduce((sum, t) => {
          const hours = (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / openTickets.length
      : 0;

    // Failed/Escalated (tickets that have been reassigned or escalated)
    // For now, we'll count tickets that are overdue
    const now = new Date();
    const failedEscalated = await prisma.ticket.count({
      where: {
        assignedTo: currentUser.id,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'],
        },
        slaDueAt: {
          lt: now,
        },
      },
    });

    return NextResponse.json({
      open,
      highPriority,
      urgent,
      avgOpenHours,
      failedEscalated,
    });
  } catch (error) {
    console.error('Error fetching my tickets summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
