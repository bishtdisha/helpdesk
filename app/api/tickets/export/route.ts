import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { TicketPriority, TicketStatus, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { ticketAccessControl } from '@/lib/rbac/ticket-access-control';

/**
 * GET /api/tickets/export - Export filtered tickets to Excel
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const statusParam = searchParams.get('status');
    const status = statusParam && Object.values(TicketStatus).includes(statusParam as TicketStatus)
      ? statusParam as TicketStatus
      : undefined;
    
    const priorityParam = searchParams.get('priority');
    const priority = priorityParam && Object.values(TicketPriority).includes(priorityParam as TicketPriority)
      ? priorityParam as TicketPriority
      : undefined;
    
    const teamId = searchParams.get('teamId') || undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const search = searchParams.get('search') || undefined;
    const month = searchParams.get('month') || undefined;

    // Build where clause based on user role
    const accessFilter = await ticketAccessControl.getTicketFilters(currentUser.id);
    
    const where: Prisma.TicketWhereInput = { ...accessFilter };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (teamId && teamId !== 'all') where.teamId = teamId;
    if (assignedTo && assignedTo !== 'all') {
      if (assignedTo === 'unassigned') {
        where.assignedTo = undefined;
      } else {
        where.assignedTo = assignedTo;
      }
    }
    if (search) {
      const searchNum = parseInt(search);
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        ...(isNaN(searchNum) ? [] : [{ ticketNumber: { equals: searchNum } }]),
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    // Fetch tickets with all required relations
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        followers: {
          include: { user: { select: { name: true } } },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for Excel
    const excelData = tickets.map((ticket) => {
      const resolutionTime = ticket.closedAt && ticket.createdAt
        ? calculateResolutionTime(ticket.createdAt, ticket.closedAt)
        : '';

      const followers = ticket.followers
        .map((f) => f.user.name)
        .filter(Boolean)
        .join(', ');

      const lastCommentDate = ticket.comments[0]?.createdAt
        ? formatDate(ticket.comments[0].createdAt)
        : '';

      return {
        'Ticket No.': ticket.ticketNumber,
        'Status': formatStatus(ticket.status),
        'Assigned Date': formatDate(ticket.createdAt),
        'Assigned Person': ticket.assignedUser?.name || 'Unassigned',
        'Customer': ticket.customer?.name || '-',
        'Title/Short Description': ticket.title,
        'Last Comment Date': lastCommentDate,
        'Project Code': ticket.team?.name || '-',
        'Close Date': ticket.closedAt ? formatDate(ticket.closedAt) : '',
        'Followers': followers || '-',
        'Resolution Time': resolutionTime,
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // Ticket No.
      { wch: 18 },  // Status
      { wch: 18 },  // Assigned Date
      { wch: 20 },  // Assigned Person
      { wch: 25 },  // Customer
      { wch: 50 },  // Title
      { wch: 18 },  // Last Comment Date
      { wch: 15 },  // Project Code
      { wch: 18 },  // Close Date
      { wch: 30 },  // Followers
      { wch: 15 },  // Resolution Time
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Tickets Report');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    const filename = `tickets-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatus(status: TicketStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function calculateResolutionTime(createdAt: Date, closedAt: Date): string {
  const diffMs = new Date(closedAt).getTime() - new Date(createdAt).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  if (diffDays > 0) {
    return `${diffDays}d ${remainingHours}h`;
  }
  return `${diffHours}h`;
}
