import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import { prisma } from '@/lib/db'
import { TicketStatus, TicketPriority } from '@prisma/client'
import * as XLSX from 'xlsx'
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns'

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
    const isExport = searchParams.get('export') === 'true'

    // Build where clause for resolved tickets
    const where: any = {
      status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      resolvedAt: { not: null },
    }
    
    if (from && to) {
      where.resolvedAt = { gte: from, lte: to }
    }
    if (teamId) where.teamId = teamId

    // Get resolved tickets with resolution times
    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        id: true,
        ticketNumber: true,
        priority: true,
        category: true,
        createdAt: true,
        resolvedAt: true,
        team: { select: { id: true, name: true } },
      },
    })

    // Calculate resolution time for each ticket
    const ticketsWithTime = tickets.map(ticket => {
      const resolutionMinutes = differenceInMinutes(ticket.resolvedAt!, ticket.createdAt)
      const resolutionHours = differenceInHours(ticket.resolvedAt!, ticket.createdAt)
      return {
        ...ticket,
        resolutionMinutes,
        resolutionHours,
        resolutionTimeFormatted: resolutionHours > 24 
          ? `${Math.round(resolutionHours / 24)}d ${resolutionHours % 24}h`
          : `${resolutionHours}h ${resolutionMinutes % 60}m`,
      }
    })

    // Group by priority
    const byPriority = Object.values(TicketPriority).map(priority => {
      const priorityTickets = ticketsWithTime.filter(t => t.priority === priority)
      const avgMinutes = priorityTickets.length > 0
        ? priorityTickets.reduce((sum, t) => sum + t.resolutionMinutes, 0) / priorityTickets.length
        : 0
      const avgHours = Math.round(avgMinutes / 60)
      
      return {
        priority,
        count: priorityTickets.length,
        avgResolutionMinutes: Math.round(avgMinutes),
        avgResolutionHours: avgHours,
        avgResolutionFormatted: avgHours > 24 ? `${Math.round(avgHours / 24)}d` : `${avgHours}h`,
      }
    })

    // Group by team
    const teamMap = new Map<string, { name: string; tickets: typeof ticketsWithTime }>()
    ticketsWithTime.forEach(ticket => {
      const teamId = ticket.team?.id || 'unassigned'
      const teamName = ticket.team?.name || 'Unassigned'
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, { name: teamName, tickets: [] })
      }
      teamMap.get(teamId)!.tickets.push(ticket)
    })

    const byTeam = Array.from(teamMap.entries()).map(([id, data]) => {
      const avgMinutes = data.tickets.length > 0 
        ? data.tickets.reduce((sum, t) => sum + t.resolutionMinutes, 0) / data.tickets.length
        : 0
      const avgHours = Math.round(avgMinutes / 60)
      return {
        teamId: id,
        teamName: data.name,
        count: data.tickets.length,
        avgResolutionMinutes: Math.round(avgMinutes),
        avgResolutionHours: avgHours,
        avgResolutionFormatted: avgHours > 24 ? `${Math.round(avgHours / 24)}d` : `${avgHours}h`,
      }
    }).sort((a, b) => a.avgResolutionMinutes - b.avgResolutionMinutes)

    // Group by category
    const categoryMap = new Map<string, typeof ticketsWithTime>()
    ticketsWithTime.forEach(ticket => {
      const category = ticket.category || 'Uncategorized'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push(ticket)
    })

    const byCategory = Array.from(categoryMap.entries()).map(([name, tickets]) => {
      const avgMinutes = tickets.length > 0
        ? tickets.reduce((sum, t) => sum + t.resolutionMinutes, 0) / tickets.length
        : 0
      const avgHours = Math.round(avgMinutes / 60)
      return {
        category: name,
        count: tickets.length,
        avgResolutionMinutes: Math.round(avgMinutes),
        avgResolutionHours: avgHours,
        avgResolutionFormatted: avgHours > 24 ? `${Math.round(avgHours / 24)}d` : `${avgHours}h`,
      }
    }).sort((a, b) => b.count - a.count)

    // Overall summary
    const totalMinutes = ticketsWithTime.reduce((sum, t) => sum + t.resolutionMinutes, 0)
    const avgMinutes = ticketsWithTime.length > 0 ? totalMinutes / ticketsWithTime.length : 0
    const avgHours = Math.round(avgMinutes / 60)
    
    let fastestTicket = { resolutionMinutes: 0, resolutionTimeFormatted: 'N/A' }
    let slowestTicket = { resolutionMinutes: 0, resolutionTimeFormatted: 'N/A' }
    
    if (ticketsWithTime.length > 0) {
      fastestTicket = ticketsWithTime.reduce((min, t) => 
        t.resolutionMinutes < min.resolutionMinutes ? t : min, 
        ticketsWithTime[0]
      )
      slowestTicket = ticketsWithTime.reduce((max, t) => 
        t.resolutionMinutes > max.resolutionMinutes ? t : max, 
        ticketsWithTime[0]
      )
    }

    // Handle export
    if (isExport) {
      const exportData = ticketsWithTime.map(t => ({
        'Ticket #': t.ticketNumber,
        'Priority': t.priority,
        'Team': t.team?.name || 'Unassigned',
        'Category': t.category || 'Uncategorized',
        'Created': format(t.createdAt, 'yyyy-MM-dd HH:mm'),
        'Resolved': format(t.resolvedAt!, 'yyyy-MM-dd HH:mm'),
        'Resolution Time': t.resolutionTimeFormatted,
        'Resolution Hours': t.resolutionHours,
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 },  // Ticket #
        { wch: 12 },  // Priority
        { wch: 20 },  // Team
        { wch: 20 },  // Category
        { wch: 20 },  // Created
        { wch: 20 },  // Resolved
        { wch: 18 },  // Resolution Time
        { wch: 18 },  // Resolution Hours
      ]
      
      XLSX.utils.book_append_sheet(wb, ws, 'Resolution Time')
      
      // Add summary sheet
      const summaryData = [
        { Metric: 'Total Tickets', Value: ticketsWithTime.length },
        { Metric: 'Avg Resolution Time', Value: avgHours > 24 ? `${Math.round(avgHours / 24)} days` : `${avgHours} hours` },
        { Metric: 'Fastest Resolution', Value: fastestTicket?.resolutionTimeFormatted || 'N/A' },
        { Metric: 'Slowest Resolution', Value: slowestTicket?.resolutionTimeFormatted || 'N/A' },
      ]
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      
      // Set summary column widths
      summaryWs['!cols'] = [
        { wch: 25 },  // Metric
        { wch: 20 },  // Value
      ]
      
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="resolution-time-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
        },
      })
    }

    return NextResponse.json({
      summary: {
        totalTickets: ticketsWithTime.length,
        avgResolutionTime: avgHours > 24 ? `${Math.round(avgHours / 24)}d` : `${avgHours}h`,
        avgResolutionHours: avgHours,
        fastestResolution: fastestTicket?.resolutionTimeFormatted || 'N/A',
        slowestResolution: slowestTicket?.resolutionTimeFormatted || 'N/A',
      },
      byPriority,
      byTeam,
      byCategory,
      // Chart data
      priorityChart: byPriority.map(p => ({
        name: p.priority,
        value: p.avgResolutionHours,
        count: p.count,
      })),
      teamChart: byTeam.slice(0, 10).map(t => ({
        name: t.teamName,
        value: t.avgResolutionHours,
        count: t.count,
      })),
    })
  } catch (error) {
    console.error('Error generating resolution time report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
