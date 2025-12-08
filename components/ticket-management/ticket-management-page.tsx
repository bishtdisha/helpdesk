"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TicketList } from "./ticket-list"
import { TicketFilters } from "./ticket-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Ticket, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { usePermissions } from "@/lib/hooks/use-permissions"

interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
}

export function TicketManagementPage() {
  const router = useRouter()
  const permissions = usePermissions()
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  })

  // Fetch ticket stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/tickets?limit=1000')
        if (response.ok) {
          const data = await response.json()
          const tickets = data.data || []
          setStats({
            total: tickets.length,
            open: tickets.filter((t: any) => t.status === 'OPEN').length,
            inProgress: tickets.filter((t: any) => t.status === 'IN_PROGRESS').length,
            resolved: tickets.filter((t: any) => t.status === 'RESOLVED').length,
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{stats.open}</p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">{stats.inProgress}</p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.resolved}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
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
