import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Run all queries in parallel
    const [total, myTickets, pending, slaAtRisk] = await Promise.all([
      // Total tickets
      prisma.ticket.count(),
      
      // My tickets (assigned to current user)
      prisma.ticket.count({
        where: { assignedTo: currentUser.id },
      }),
      
      // Pending tickets - OPEN or IN_PROGRESS status (need attention)
      prisma.ticket.count({
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
      }),
      
      // SLA at risk - tickets where slaDueAt is within next 2 hours or already passed, and not resolved/closed
      prisma.ticket.count({
        where: {
          slaDueAt: {
            not: null,
            lte: new Date(Date.now() + 2 * 60 * 60 * 1000), // within 2 hours
          },
          status: {
            notIn: ['RESOLVED', 'CLOSED'],
          },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      myTickets,
      pending,
      slaAtRisk,
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
