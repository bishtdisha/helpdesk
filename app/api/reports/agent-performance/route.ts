import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import { prisma } from '@/lib/db'
import { TicketStatus } from '@prisma/client'
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
    const assigneeId = searchParams.get('assigneeId') || undefined
    const isExport = searchParams.get('export') === 'true'

    // Build where clause
    const where: any = {}
    if (from && to) {
      where.createdAt = { gte: from, lte: to }
    }
    if (assigneeId) where.assignedTo = assigneeId

    // Get all agents with their tickets
    const agents = await prisma.user.findMany({
      where: {
        assignedTickets: { some: where },
      },
      include: {
        team: { select: { name: true } },
        assignedTickets: {
          where,
          select: {
            id: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
            slaDueAt: true,
          },
        },
      },
    })

    const now = new Date()

    // Calculate agent metrics
    const agentMetrics = agents.map(agent => {
      const tickets = agent.assignedTickets
      const resolved = tickets.filter(t => 
        t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
      )
      
      // Avg resolution time
      const resolvedWithTime = resolved.filter(t => t.resolvedAt)
      const avgHours = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, t) => sum + differenceInHours(t.resolvedAt!, t.createdAt), 0) / resolvedWithTime.length
        : 0
      const avgResolutionTime = avgHours > 24 ? `${Math.round(avgHours / 24)}d` : `${Math.round(avgHours)}h`

      // SLA compliance
      const ticketsWithSLA = tickets.filter(t => t.slaDueAt)
      const breached = ticketsWithSLA.filter(t => {
        if (t.resolvedAt) return t.resolvedAt > t.slaDueAt!
        return now > t.slaDueAt!
      })
      const slaCompliance = ticketsWithSLA.length > 0
        ? Math.round(((ticketsWithSLA.length - breached.length) / ticketsWithSLA.length) * 100)
        : 100

      return {
        id: agent.id,
        name: agent.name || 'Unknown',
        team: agent.team?.name || 'Unassigned',
        ticketsAssigned: tickets.length,
        ticketsResolved: resolved.length,
        avgResolutionTime,
        slaCompliance,
        customerSatisfaction: 85 + Math.floor(Math.random() * 15), // Placeholder
      }
    }).sort((a, b) => b.ticketsResolved - a.ticketsResolved)

    // Summary
    const totalResolved = agentMetrics.reduce((sum, a) => sum + a.ticketsResolved, 0)
    const topPerformer = agentMetrics[0]?.name || 'N/A'

    // Top performers
    const topPerformers = agentMetrics.slice(0, 3).map(a => ({
      name: a.name,
      resolved: a.ticketsResolved,
      avgTime: a.avgResolutionTime,
      slaRate: a.slaCompliance,
    }))

    // Performance metrics for radar chart
    const performanceMetrics = agentMetrics.slice(0, 3).map(a => ({
      agent: a.name.split(' ')[0], // First name only
      speed: Math.min(100, Math.round(100 - (parseInt(a.avgResolutionTime) || 0) * 2)),
      quality: a.customerSatisfaction,
      volume: Math.min(100, Math.round((a.ticketsResolved / (totalResolved / agentMetrics.length)) * 50)),
      sla: a.slaCompliance,
    }))

    // Handle export
    if (isExport) {
      const exportData = agentMetrics.map(a => ({
        'Agent': a.name,
        'Team': a.team,
        'Tickets Assigned': a.ticketsAssigned,
        'Tickets Resolved': a.ticketsResolved,
        'Avg Resolution Time': a.avgResolutionTime,
        'SLA Compliance %': a.slaCompliance,
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      XLSX.utils.book_append_sheet(wb, ws, 'Agent Performance')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="agent-performance-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
        },
      })
    }

    return NextResponse.json({
      summary: {
        totalAgents: agentMetrics.length,
        totalTicketsResolved: totalResolved,
        avgResolutionTime: agentMetrics[0]?.avgResolutionTime || '0h',
        topPerformer,
      },
      agents: agentMetrics,
      topPerformers,
      performanceMetrics,
    })
  } catch (error) {
    console.error('Error generating agent performance report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
