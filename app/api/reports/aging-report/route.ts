import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import { prisma } from '@/lib/db'
import { TicketStatus } from '@prisma/client'
import * as XLSX from 'xlsx'
import { format, parseISO, differenceInHours, differenceInDays, formatDistanceToNow } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId') || undefined
    const isExport = searchParams.get('export') === 'true'

    // Get open tickets only
    const where: any = {
      status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER] },
    }
    if (teamId) where.teamId = teamId

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        team: { select: { name: true } },
        assignedUser: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const now = new Date()

    // Categorize by age
    const under24h = tickets.filter(t => differenceInHours(now, t.createdAt) < 24)
    const days1to3 = tickets.filter(t => {
      const hours = differenceInHours(now, t.createdAt)
      return hours >= 24 && hours < 72
    })
    const days3to7 = tickets.filter(t => {
      const days = differenceInDays(now, t.createdAt)
      return days >= 3 && days < 7
    })
    const over7days = tickets.filter(t => differenceInDays(now, t.createdAt) >= 7)

    // Calculate average age
    const totalHours = tickets.reduce((sum, t) => sum + differenceInHours(now, t.createdAt), 0)
    const avgHours = tickets.length > 0 ? totalHours / tickets.length : 0
    const avgAge = avgHours > 24 ? `${Math.round(avgHours / 24)} days` : `${Math.round(avgHours)} hours`

    // By age bucket
    const byAgeBucket = [
      { bucket: '< 24 hours', count: under24h.length, color: '#10b981' },
      { bucket: '1-3 days', count: days1to3.length, color: '#f59e0b' },
      { bucket: '3-7 days', count: days3to7.length, color: '#f97316' },
      { bucket: '> 7 days', count: over7days.length, color: '#ef4444' },
    ]

    // By team
    const teamMap = new Map<string, { under24h: number; days1to3: number; days3to7: number; over7days: number }>()
    tickets.forEach(t => {
      const teamName = t.team?.name || 'Unassigned'
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, { under24h: 0, days1to3: 0, days3to7: 0, over7days: 0 })
      }
      const team = teamMap.get(teamName)!
      const hours = differenceInHours(now, t.createdAt)
      const days = differenceInDays(now, t.createdAt)
      
      if (hours < 24) team.under24h++
      else if (hours < 72) team.days1to3++
      else if (days < 7) team.days3to7++
      else team.over7days++
    })
    const byTeam = Array.from(teamMap.entries()).map(([team, data]) => ({ team, ...data }))

    // Oldest tickets
    const oldestTickets = over7days.concat(days3to7).slice(0, 10).map(t => ({
      ticketNumber: t.ticketNumber,
      title: t.title,
      priority: t.priority,
      assignee: t.assignedUser?.name || 'Unassigned',
      team: t.team?.name || 'Unassigned',
      age: formatDistanceToNow(t.createdAt),
      createdAt: format(t.createdAt, 'MMM dd, yyyy'),
    }))

    // Handle export
    if (isExport) {
      const exportData = tickets.map(t => ({
        'Ticket #': t.ticketNumber,
        'Title': t.title,
        'Priority': t.priority,
        'Status': t.status.replace(/_/g, ' '),
        'Assignee': t.assignedUser?.name || 'Unassigned',
        'Team': t.team?.name || '-',
        'Created': format(t.createdAt, 'MMM dd, yyyy HH:mm'),
        'Age': formatDistanceToNow(t.createdAt),
        'Age (Hours)': differenceInHours(now, t.createdAt),
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 },  // Ticket #
        { wch: 50 },  // Title
        { wch: 12 },  // Priority
        { wch: 18 },  // Status
        { wch: 20 },  // Assignee
        { wch: 20 },  // Team
        { wch: 22 },  // Created
        { wch: 18 },  // Age
        { wch: 14 },  // Age (Hours)
      ]
      
      XLSX.utils.book_append_sheet(wb, ws, 'Aging Report')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="aging-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
        },
      })
    }

    return NextResponse.json({
      summary: {
        totalOpen: tickets.length,
        under24h: under24h.length,
        days1to3: days1to3.length,
        days3to7: days3to7.length,
        over7days: over7days.length,
        avgAge,
      },
      byAgeBucket,
      byTeam,
      oldestTickets,
    })
  } catch (error) {
    console.error('Error generating aging report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
