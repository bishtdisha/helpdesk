import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import { prisma } from '@/lib/db'
import { TicketStatus, TicketPriority } from '@prisma/client'
import * as XLSX from 'xlsx'
import { format, parseISO, differenceInHours } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') ? parseISO(searchParams.get('from')!) : undefined
    const to = searchParams.get('to') ? parseISO(searchParams.get('to')!) : undefined
    const teamId = searchParams.get('teamId') || undefined
    const assigneeId = searchParams.get('assigneeId') || undefined
    const isExport = searchParams.get('export') === 'true'

    // Build where clause
    const where: any = {}
    if (from && to) {
      where.createdAt = { gte: from, lte: to }
    }
    if (teamId) where.teamId = teamId
    if (assigneeId) where.assignedTo = assigneeId

    // Get tickets
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        assignedUser: { select: { name: true } },
        team: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate summary
    const total = tickets.length
    const open = tickets.filter(t => t.status === TicketStatus.OPEN).length
    const inProgress = tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length
    const resolved = tickets.filter(t => t.status === TicketStatus.RESOLVED).length
    const closed = tickets.filter(t => t.status === TicketStatus.CLOSED).length

    // Calculate avg resolution time
    const resolvedTickets = tickets.filter(t => t.resolvedAt && t.createdAt)
    const avgResolutionHours = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + differenceInHours(t.resolvedAt!, t.createdAt), 0) / resolvedTickets.length
      : 0
    const avgResolutionTime = avgResolutionHours > 24 
      ? `${Math.round(avgResolutionHours / 24)}d` 
      : `${Math.round(avgResolutionHours)}h`

    // Status distribution
    const byStatus = [
      { name: 'Open', value: open, color: '#3b82f6' },
      { name: 'In Progress', value: inProgress, color: '#f59e0b' },
      { name: 'Resolved', value: resolved, color: '#10b981' },
      { name: 'Closed', value: closed, color: '#6366f1' },
    ]

    // Priority distribution
    const byPriority = [
      { name: 'Low', value: tickets.filter(t => t.priority === TicketPriority.LOW).length, color: '#10b981' },
      { name: 'Medium', value: tickets.filter(t => t.priority === TicketPriority.MEDIUM).length, color: '#3b82f6' },
      { name: 'High', value: tickets.filter(t => t.priority === TicketPriority.HIGH).length, color: '#f59e0b' },
      { name: 'Urgent', value: tickets.filter(t => t.priority === TicketPriority.URGENT).length, color: '#ef4444' },
    ]

    // Trend data (group by date)
    const trendMap = new Map<string, { created: number; resolved: number }>()
    tickets.forEach(t => {
      const date = format(t.createdAt, 'MMM dd')
      if (!trendMap.has(date)) trendMap.set(date, { created: 0, resolved: 0 })
      trendMap.get(date)!.created++
      if (t.resolvedAt) {
        const resolvedDate = format(t.resolvedAt, 'MMM dd')
        if (!trendMap.has(resolvedDate)) trendMap.set(resolvedDate, { created: 0, resolved: 0 })
        trendMap.get(resolvedDate)!.resolved++
      }
    })
    const trend = Array.from(trendMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .slice(-14)

    // Recent tickets
    const recentTickets = tickets.slice(0, 10).map(t => ({
      ticketNumber: t.ticketNumber,
      title: t.title,
      status: t.status.replace(/_/g, ' '),
      priority: t.priority,
      assignee: t.assignedUser?.name || 'Unassigned',
      createdAt: format(t.createdAt, 'MMM dd, yyyy'),
    }))

    // Handle export
    if (isExport) {
      const exportData = tickets.map(t => ({
        'Ticket #': t.ticketNumber,
        'Title': t.title,
        'Status': t.status.replace(/_/g, ' '),
        'Priority': t.priority,
        'Assignee': t.assignedUser?.name || 'Unassigned',
        'Team': t.team?.name || '-',
        'Created': format(t.createdAt, 'MMM dd, yyyy HH:mm'),
        'Resolved': t.resolvedAt ? format(t.resolvedAt, 'MMM dd, yyyy HH:mm') : '-',
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      XLSX.utils.book_append_sheet(wb, ws, 'Ticket Summary')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="ticket-summary-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
        },
      })
    }

    return NextResponse.json({
      summary: { total, open, inProgress, resolved, closed, avgResolutionTime },
      byStatus,
      byPriority,
      trend,
      recentTickets,
    })
  } catch (error) {
    console.error('Error generating ticket summary report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
