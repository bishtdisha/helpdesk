import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customSlaDueAt } = await request.json();

    // Validate the custom SLA date
    if (customSlaDueAt && isNaN(Date.parse(customSlaDueAt))) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Update the custom SLA for this specific ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        customSlaDueAt: customSlaDueAt ? new Date(customSlaDueAt) : null,
      },
      include: {
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
      },
    });

    // Log the SLA change in ticket history
    await prisma.ticketHistory.create({
      data: {
        ticketId: params.id,
        userId: currentUser.id,
        action: 'custom_sla_updated',
        fieldName: 'customSlaDueAt',
        oldValue: ticket.customSlaDueAt?.toISOString() || null,
        newValue: customSlaDueAt || null,
      },
    });

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: customSlaDueAt
        ? 'Custom SLA deadline set successfully'
        : 'Custom SLA deadline removed, using default SLA',
    });
  } catch (error) {
    console.error('Error updating custom SLA:', error);
    return NextResponse.json(
      { error: 'Failed to update custom SLA' },
      { status: 500 }
    );
  }
}
