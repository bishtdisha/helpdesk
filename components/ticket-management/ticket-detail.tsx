"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentInput } from "@/components/comment-input"
import {
  Clock,
  User,
  Users,
  MessageSquare,
  Paperclip,
  History,
  AlertCircle,
  CheckCircle,
  UserPlus,
} from "lucide-react"
import { TicketStatus, TicketPriority } from "@prisma/client"
import { TicketWithRelations } from "@/lib/types/ticket"
import { useAuth } from "@/lib/hooks/use-auth"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"

interface TicketDetailProps {
  ticketId: string
  onBack?: () => void
  onAssign?: (ticketId: string) => void
  readOnly?: boolean
}

export function TicketDetail({ ticketId, onBack, onAssign, readOnly = true }: TicketDetailProps) {
  const { user } = useAuth()
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  // Fetch ticket details
  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch ticket')
      }

      const data = await response.json()
      setTicket(data.ticket || data)
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newComment,
          isInternal: false 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to add comment')
      }

      // Clear input after successful submission
      setNewComment("")
      
      // Update comment list immediately on success
      await fetchTicket()
      
      toast.success('Comment added successfully')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!ticket) return

    try {
      const response = await fetch(`/api/tickets/${ticket.id}/close`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to close ticket')
      }

      await fetchTicket()
    } catch (error) {
      console.error('Error closing ticket:', error)
    }
  }

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
    if (!status) return 'Unknown'
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatPriority = (priority: TicketPriority) => {
    if (!priority) return 'Unknown'
    return priority.charAt(0) + priority.slice(1).toLowerCase()
  }

  const canAssignTicket = () => {
    if (!user?.role) return false
    return user.role.name === 'Admin/Manager' || user.role.name === 'Team Leader'
  }

  const canCloseTicket = () => {
    if (!user?.role) return false
    return user.role.name === 'Admin/Manager' || user.role.name === 'Team Leader'
  }

  const isSLABreached = (slaDueAt: Date | null) => {
    if (!slaDueAt) return false
    return new Date(slaDueAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading ticket details...</div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-muted-foreground">Ticket not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">{ticket.title}</h2>
            <p className="text-muted-foreground">
              Ticket #{ticket.ticketNumber ? String(ticket.ticketNumber).padStart(5, '0') : 'N/A'} • Created {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : 'Unknown'}
            </p>
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            {canAssignTicket() && (
              <Button onClick={() => onAssign?.(ticket.id)} variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Assign
              </Button>
            )}
            {canCloseTicket() && ticket.status !== TicketStatus.CLOSED && (
              <Button onClick={handleCloseTicket} variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Close Ticket
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Ticket Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={getStatusColor(ticket.status)} 
              className={`text-sm ${ticket.status === TicketStatus.RESOLVED ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800' : ''}`}
            >
              {ticket.status ? formatStatus(ticket.status) : 'Unknown'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getPriorityColor(ticket.priority)} className="text-sm">
              {ticket.priority ? formatPriority(ticket.priority) : 'Unknown'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assignee</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SLA Status</CardTitle>
          </CardHeader>
          <CardContent>
            {ticket.slaDueAt ? (
              <div className="flex items-center gap-2">
                {isSLABreached(ticket.slaDueAt) ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">Breached</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      {ticket.slaDueAt ? formatDistanceToNow(new Date(ticket.slaDueAt), { addSuffix: true }) : 'No SLA'}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">No SLA</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details and Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Tabs for Comments, Attachments, History */}
          <Card>
            <Tabs defaultValue="comments">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="comments">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments ({ticket.comments?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="attachments">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attachments ({ticket.attachments?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="comments" className="space-y-4">
                  {/* Comments List */}
                  <div className="space-y-4">
                    {ticket.comments && ticket.comments.length > 0 ? (
                      ticket.comments
                        // Sort comments chronologically (oldest first)
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        // Filter internal comments based on user permissions
                        .filter((comment) => {
                          // Show all comments to admins and team leaders
                          if (user?.role?.name === 'Admin/Manager' || user?.role?.name === 'Team Leader') {
                            return true;
                          }
                          // Show all comments
                          return true;
                        })
                        .map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-4 bg-muted rounded-lg">
                          <Avatar className="h-8 w-8">
                            <div className="bg-primary text-primary-foreground flex items-center justify-center h-full">
                              {comment.author.name?.charAt(0) || 'U'}
                            </div>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comment.author.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Unknown'}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No comments yet
                      </div>
                    )}
                  </div>

                  {/* Add Comment - Only show in edit mode */}
                  {!readOnly && (
                    <div className="space-y-2">
                      <CommentInput
                        value={newComment}
                        onChange={setNewComment}
                        placeholder="Add a comment..."
                        disabled={submittingComment}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || submittingComment}
                        >
                          {submittingComment ? 'Adding...' : 'Add Comment'}
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attachments">
                  {ticket.attachments && ticket.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {ticket.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{attachment.fileName}</div>
                              <div className="text-xs text-muted-foreground">
                                {(attachment.fileSize / 1024).toFixed(2)} KB • Uploaded by{' '}
                                {attachment.uploader.name}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No attachments
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history">
                  {ticket.history && ticket.history.length > 0 ? (
                    <div className="space-y-3">
                      {ticket.history.map((entry) => (
                        <div key={entry.id} className="flex gap-3 p-3 border-l-2 border-muted">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{entry.user.name}</span>
                              <span className="text-sm text-muted-foreground">{entry.action}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.createdAt), 'MMM d, yyyy HH:mm')}
                              </span>
                            </div>
                            {entry.fieldName && (
                              <div className="text-sm text-muted-foreground">
                                Changed {entry.fieldName}: {entry.oldValue} → {entry.newValue}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No history available
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="font-medium">{ticket.customer?.name || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">{ticket.customer?.email || 'No email'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {ticket.category && (
                <div>
                  <div className="text-muted-foreground">Category</div>
                  <div className="font-medium">{ticket.category}</div>
                </div>
              )}
              {ticket.phone && (
                <div>
                  <div className="text-muted-foreground">Phone Number</div>
                  <div className="font-medium">{ticket.phone}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground">Created By</div>
                <div className="font-medium">{ticket.creator?.name || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Created At</div>
                <div className="font-medium">
                  {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm') : 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Updated</div>
                <div className="font-medium">
                  {ticket.updatedAt ? format(new Date(ticket.updatedAt), 'MMM d, yyyy HH:mm') : 'Unknown'}
                </div>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <div className="text-muted-foreground">Resolved At</div>
                  <div className="font-medium">
                    {format(new Date(ticket.resolvedAt), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              )}
              {ticket.closedAt && (
                <div>
                  <div className="text-muted-foreground">Closed At</div>
                  <div className="font-medium">
                    {format(new Date(ticket.closedAt), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
