import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import { prisma } from '@/lib/db'
import { TicketStatus } from '@prisma/client'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

const AGENT_CAPACITY = 15 // Default capacity per agent

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId') || undefined
    const isExport = searchParams.get('export') === 'true'

    // Get agents with open tickets
    const agentWhere: any = {
      isActive: true,
      assignedTickets: {
        some: {
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER] },
        },
      },
    }
    if (teamId) agentWhere.teamId = teamId

    const agents = await prisma.user.findMany({
      where: agentWhere,
      include: {
        team: { select: { name: true } },
        assignedTickets: {
          where: {
            status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER] },
          },
          select: { id: true },
        },
      },
    })

    // Calculate agent workload
    const agentMetrics = agents.map(agent => {
      const openTickets = agent.assignedTickets.length
      const utilizationPercent = Math.round((openTickets / AGENT_CAPACITY) * 100)
      
      let status: 'overloaded' | 'optimal' | 'underutilized'
      if (utilizationPercent > 100) status = 'overloaded'
      else if (utilizationPercent >= 70) status = 'optimal'
      else status = 'underutilized'

      return {
        name: agent.name || 'Unknown',
        team: agent.team?.name || 'Unassigned',
        openTickets,
        capacity: AGENT_CAPACITY,
        utilizationPercent,
        status,
      }
    }).sort((a, b) => b.openTickets - a.openTickets)

    // Summary
    const totalOpenTickets = agentMetrics.reduce((sum, a) => sum + a.openTickets, 0)
    const avgTicketsPerAgent = agentMetrics.length > 0 
      ? Math.round(totalOpenTickets / agentMetrics.length) 
      : 0
    const overloadedAgents = agentMetrics.filter(a => a.status === 'overloaded').length
    const underutilizedAgents = agentMetrics.filter(a => a.status === 'underutilized').length

    // By team
    const teamMap = new Map<string, { totalTickets: number; members: number }>()
    agentMetrics.forEach(a => {
      if (!teamMap.has(a.team)) teamMap.set(a.team, { totalTickets: 0, members: 0 })
      const team = teamMap.get(a.team)!
      team.totalTickets += a.openTickets
      team.members++
    })
    const byTeam = Array.from(teamMap.entries()).map(([team, data]) => ({
      team,
      ...data,
      avgPerMember: data.members > 0 ? Math.round(data.totalTickets / data.members) : 0,
    }))

    // Distribution buckets
    const distribution = [
      { range: 'Underutilized (<70%)', count: underutilizedAgents, color: '#f59e0b' },
      { range: 'Optimal (70-100%)', count: agentMetrics.filter(a => a.status === 'optimal').length, color: '#10b981' },
      { range: 'Overloaded (>100%)', count: overloadedAgents, color: '#ef4444' },
    ]

    // Handle export
    if (isExport) {
      const exportData = agentMetrics.map(a => ({
        'Agent': a.name,
        'Team': a.team,
        'Open Tickets': a.openTickets,
        'Capacity': a.capacity,
        'Utilization %': a.utilizationPercent,
        'Status': a.status,
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      XLSX.utils.book_append_sheet(wb, ws, 'Workload Distribution')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="workload-distribution-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
        },
      })
    }

    return NextResponse.json({
      summary: {
        totalAgents: agentMetrics.length,
        totalOpenTickets,
        avgTicketsPerAgent,
        overloadedAgents,
        underutilizedAgents,
      },
      byAgent: agentMetrics,
      byTeam,
      distribution,
    })
  } catch (error) {
    console.error('Error generating workload distribution report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
