"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TicketList } from "./ticket-list"
import { TicketFilters } from "./ticket-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Ticket, User, Clock, AlertTriangle } from "lucide-react"
import { usePermissions } from "@/lib/hooks/use-permissions"

interface TicketStats {
  total: number
  myTickets: number
  pending: number
  slaAtRisk: number
}

export function TicketManagementPage() {
  const router = useRouter()
  const permissions = usePermissions()
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    myTickets: 0,
    pending: 0,
    slaAtRisk: 0,
  })

  // Fetch ticket stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/tickets/stats')
        if (response.ok) {
          const data = await response.json()
          setStats({
            total: data.total || 0,
            myTickets: data.myTickets || 0,
            pending: data.pending || 0,
            slaAtRisk: data.slaAtRisk || 0,
          })
        }
      } catch (error) {
        console.error('Error fetching ticket stats:', error)
      }
    }

    fetchStats()
  }, [])

  const handleViewTicket = (ticketId: string) => {
    router.push(`/helpdesk/tickets/${ticketId}`)
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border border-blue-100 dark:border-blue-900">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Ticket className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Support Tickets</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and track all customer support tickets
              </p>
            </div>
          </div>
          
          {permissions.canCreateTicket() && (
            <Link href="/helpdesk/tickets/new">
              <Button size="lg" className="shadow-md">
                <Plus className="h-5 w-5 mr-2" />
                New Ticket
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/30 dark:to-background">
          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Total Tickets</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">All tickets</p>
              </div>
              <div className="p-2 bg-blue-500/15 rounded-lg">
                <Ticket className="h-4 w-4 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/30 dark:to-background">
          <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">My Tickets</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.myTickets}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Assigned to you</p>
              </div>
              <div className="p-2 bg-purple-500/15 rounded-lg">
                <User className="h-4 w-4 text-purple-700 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-950/30 dark:to-background">
          <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Pending</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.pending}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">New + In Progress</p>
              </div>
              <div className="p-2 bg-orange-500/15 rounded-lg">
                <Clock className="h-4 w-4 text-orange-700 dark:text-orange-300" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-300 border-l-3 border-l-red-500 bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/30 dark:to-background">
          <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">SLA At Risk</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.slaAtRisk}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Due within 2 hrs</p>
              </div>
              <div className="p-2 bg-red-500/15 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TicketFilters />

      {/* Ticket List */}
      <TicketList
        onTicketClick={handleViewTicket}
      />
    </div>
  )
}
