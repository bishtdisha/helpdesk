"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  User, 
  Users, 
  Calendar,
  Phone,
  Tag,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  MessageSquare,
  Paperclip,
  History
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface TicketDetails {
  id: string
  ticketNumber: number
  title: string
  description: string
  status: string
  priority: string
  phone?: string
  category?: string
  createdAt: string
  updatedAt: string
  slaDueAt?: string
  resolvedAt?: string
  customer?: {
    id: string
    name: string
    email: string
  }
  creator?: {
    id: string
    name: string
    email: string
  }
  assignedUser?: {
    id: string
    name: string
    email: string
  }
  team?: {
    id: string
    name: string
  }
  comments?: Array<{
    id: string
    content: string
    isInternal: boolean
    createdAt: string
    author: {
      id: string
      name: string
      email: string
    }
  }>
  attachments?: Array<{
    id: string
    filename: string
    fileSize: number
    mimeType: string
    createdAt: string
    uploader: {
      id: string
      name: string
    }
  }>
  followers?: Array<{
    user: {
      id: string
      name: string
      email: string
    }
  }>
  history?: Array<{
    id: string
    action: string
    field?: string
    oldValue?: string
    newValue?: string
    createdAt: string
    user: {
      id: string
      name: string
    }
  }>
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  OPEN: { label: "New", color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/50" },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-700", bgColor: "bg-yellow-100 dark:bg-yellow-900/50" },
  WAITING_FOR_CUSTOMER: { label: "On Hold", color: "text-orange-700", bgColor: "bg-orange-100 dark:bg-orange-900/50" },
  RESOLVED: { label: "Resolved", color: "text-green-700", bgColor: "bg-green-100 dark:bg-green-900/50" },
  CLOSED: { label: "Cancelled", color: "text-gray-700", bgColor: "bg-gray-100 dark:bg-gray-900/50" },
}

const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  LOW: { label: "Low", color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/50" },
  MEDIUM: { label: "Medium", color: "text-yellow-700", bgColor: "bg-yellow-100 dark:bg-yellow-900/50" },
  HIGH: { label: "High", color: "text-orange-700", bgColor: "bg-orange-100 dark:bg-orange-900/50" },
  URGENT: { label: "Urgent", color: "text-red-700", bgColor: "bg-red-100 dark:bg-red-900/50" },
}

export default function TeamTicketViewPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.teamId as string
  const ticketId = params.ticketId as string
  
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}/tickets/${ticketId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch ticket')
        }
        const data = await response.json()
        setTicket(data.ticket || data)
      } catch (error) {
        console.error('Error fetching ticket:', error)
        toast.error('Failed to load ticket')
        router.push(`/helpdesk/teams/${teamId}`)
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [ticketId, teamId, router])

  const handleBack = () => {
    router.push(`/helpdesk/teams/${teamId}`)
  }

  const handleEdit = () => {
    router.push(`/helpdesk/teams/${teamId}/tickets/${ticketId}`)
  }

  const formatTicketNumber = (num: number) => {
    return `#${String(num).padStart(5, '0')}`
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isOverdue = (slaDueAt?: string) => {
    if (!slaDueAt) return false
    return new Date(slaDueAt) < new Date()
  }

  if (loading) {
    return (
      <div className="w-full px-6 py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="w-full px-6 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Ticket not found</div>
        </div>
      </div>
    )
  }

  const status = statusConfig[ticket.status] || statusConfig.OPEN
  const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded">
                  {formatTicketNumber(ticket.ticketNumber)}
                </span>
                {isOverdue(ticket.slaDueAt) && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/50 rounded">
                    <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
                    <span className="text-xs font-bold text-red-600">SLA Breached</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {ticket.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Created {formatDate(ticket.createdAt)}
              </p>
            </div>
          </div>
          <Button onClick={handleEdit} className="shadow-md">
            <Edit className="w-4 h-4 mr-2" />
            Edit Ticket
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Priority Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Status & Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${status.bgColor} ${status.color} border-0 text-sm px-3 py-1`}>
                    {status.label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge className={`${priority.bgColor} ${priority.color} border-0 text-sm px-3 py-1`}>
                    {priority.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {ticket.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          {ticket.comments && ticket.comments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments ({ticket.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticket.comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className={`p-4 rounded-lg border ${
                        comment.isInternal 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                          : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{comment.author.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                        {comment.isInternal && (
                          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                            Internal
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments Section */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Attachments ({ticket.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ticket.attachments.map((attachment) => (
                    <div 
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 dark:bg-gray-900/50"
                    >
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Paperclip className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{attachment.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.fileSize)} • {attachment.uploader.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* History Section */}
          {ticket.history && ticket.history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticket.history.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">{entry.user.name}</span>
                          {' '}{entry.action}
                          {entry.field && (
                            <span className="text-muted-foreground">
                              {' '}({entry.field}: {entry.oldValue} → {entry.newValue})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* People Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer */}
              {ticket.customer && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Customer</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ticket.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{ticket.customer.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Assigned To */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Assigned To</p>
                {ticket.assignedUser ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ticket.assignedUser.name}</p>
                      <p className="text-xs text-muted-foreground">{ticket.assignedUser.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </div>

              <Separator />

              {/* Team */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Team</p>
                {ticket.team ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-sm font-medium">{ticket.team.name}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No team assigned</p>
                )}
              </div>

              {/* Creator */}
              {ticket.creator && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Created By</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ticket.creator.name}</p>
                        <p className="text-xs text-muted-foreground">{ticket.creator.email}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone */}
              {ticket.phone && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">{ticket.phone}</p>
                  </div>
                </div>
              )}

              {/* Category */}
              {ticket.category && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
                  <Badge variant="outline">{ticket.category}</Badge>
                </div>
              )}

              <Separator />

              {/* Dates */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
                  <p className="text-sm">{formatDate(ticket.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</p>
                  <p className="text-sm">{formatDate(ticket.updatedAt)}</p>
                </div>
                {ticket.slaDueAt && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">SLA Due</p>
                    <div className={`flex items-center gap-2 ${isOverdue(ticket.slaDueAt) ? 'text-red-600' : ''}`}>
                      <Clock className="w-4 h-4" />
                      <p className="text-sm">{formatDate(ticket.slaDueAt)}</p>
                    </div>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Resolved</p>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <p className="text-sm">{formatDate(ticket.resolvedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Followers Card */}
          {ticket.followers && ticket.followers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Followers ({ticket.followers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ticket.followers.map((follower) => (
                    <div key={follower.user.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-600" />
                      </div>
                      <p className="text-sm">{follower.user.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
