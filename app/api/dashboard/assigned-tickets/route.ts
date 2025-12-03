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
    const tickets = await prisma.ticket.findMany({
      where: {
        assignedTo: currentUser.id,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'],
        },
      },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
      orderBy: [
        { priority: 'desc' }, // URGENT first
        { createdAt: 'asc' }, // Oldest first
      ],
      take: 10, // Limit to 10 tickets
    });

    return NextResponse.json({
      tickets,
    });
  } catch (error) {
    console.error('Error fetching assigned tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
