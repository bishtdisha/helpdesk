"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, Eye, Clock, AlertCircle } from "lucide-react"
import { TicketStatus, TicketPriority } from "@prisma/client"
import { TicketWithRelations, PaginatedTickets, TicketFilters } from "@/lib/types/ticket"
import { useAuth } from "@/lib/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"

interface TicketListProps {
  onCreateTicket?: () => void
  onViewTicket?: (ticketId: string) => void
}

export function TicketList({ onCreateTicket, onViewTicket }: TicketListProps) {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (teamFilter !== 'all') params.append('teamId', teamFilter)
      if (assigneeFilter !== 'all') params.append('assignedTo', assigneeFilter)

      const response = await fetch(`/api/tickets?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }

      const data: PaginatedTickets = await response.json()
      setTickets(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [pagination.page, searchTerm, statusFilter, priorityFilter, teamFilter, assigneeFilter])

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.URGENT:
        return "destructive"
      case TicketPriority.HIGH:
        return "destructive"
      case TicketPriority.MEDIUM:
        return "default"
      case TicketPriority.LOW:
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return "destructive"
      case TicketStatus.IN_PROGRESS:
        return "default"
      case TicketStatus.WAITING_FOR_CUSTOMER:
        return "secondary"
      case TicketStatus.RESOLVED:
        return "outline"
      case TicketStatus.CLOSED:
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatStatus = (status: TicketStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatPriority = (priority: TicketPriority) => {
    return priority.charAt(0) + priority.slice(1).toLowerCase()
  }

  const isSLAAtRisk = (slaDueAt: Date | null) => {
    if (!slaDueAt) return false
    const now = new Date()
    const dueDate = new Date(slaDueAt)
    const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursRemaining > 0 && hoursRemaining < 4 // At risk if less than 4 hours remaining
  }

  const isSLABreached = (slaDueAt: Date | null) => {
    if (!slaDueAt) return false
    return new Date(slaDueAt) < new Date()
  }

  const canCreateTicket = () => {
    // All roles can create tickets
    return true
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Support Tickets</h2>
          <p className="text-muted-foreground">
            {user?.role?.name === 'Admin/Manager' && 'Manage all tickets across the organization'}
            {user?.role?.name === 'Team Leader' && 'Manage tickets for your team'}
            {user?.role?.name === 'User/Employee' && 'View and manage your tickets'}
          </p>
        </div>
        {canCreateTicket() && (
          <Button onClick={onCreateTicket} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Ticket Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {tickets.filter(t => t.status === TicketStatus.OPEN).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter(t => t.status === TicketStatus.RESOLVED).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by title, description, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                  <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TicketStatus.WAITING_FOR_CUSTOMER}>Waiting</SelectItem>
                  <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                  <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            Showing {tickets.length} of {pagination.total} tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tickets found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {ticket.category && <span className="mr-2">#{ticket.category}</span>}
                            ID: {ticket.id.slice(0, 8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{ticket.customer.name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {formatStatus(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(ticket.priority)}>
                          {formatPriority(ticket.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.assignedUser ? (
                          <div>
                            <div className="font-medium">{ticket.assignedUser.name}</div>
                            {ticket.team && (
                              <div className="text-xs text-muted-foreground">{ticket.team.name}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ticket.slaDueAt && (
                          <div className="flex items-center gap-1">
                            {isSLABreached(ticket.slaDueAt) ? (
                              <>
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm text-red-600 font-medium">Breached</span>
                              </>
                            ) : isSLAAtRisk(ticket.slaDueAt) ? (
                              <>
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="text-sm text-orange-600">
                                  {formatDistanceToNow(new Date(ticket.slaDueAt), { addSuffix: true })}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(ticket.slaDueAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTicket?.(ticket.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
