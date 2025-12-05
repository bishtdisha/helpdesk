"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentInput } from "@/components/comment-input"
import { AttachmentList } from "@/components/attachment-list"
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
  onManageFollowers?: () => void
  readOnly?: boolean
}

export function TicketDetail({ ticketId, onBack, onAssign, onManageFollowers, readOnly = true }: TicketDetailProps) {
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
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border border-blue-100 dark:border-blue-900">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-xs font-mono">
                #{ticket.ticketNumber ? String(ticket.ticketNumber).padStart(5, '0') : 'N/A'}
              </Badge>
              <Badge 
                variant={getStatusColor(ticket.status)} 
                className={`text-xs ${ticket.status === TicketStatus.RESOLVED ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800' : ''}`}
              >
                {ticket.status ? formatStatus(ticket.status) : 'Unknown'}
              </Badge>
              <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                {ticket.priority ? formatPriority(ticket.priority) : 'Unknown'}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{ticket.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Created {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : 'Unknown'}
              </span>
              {ticket.creator && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  by {ticket.creator.name}
                </span>
              )}
            </div>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              {canAssignTicket() && (
                <Button onClick={() => onAssign?.(ticket.id)} variant="outline" size="sm" className="shadow-sm">
                  <User className="h-4 w-4 mr-2" />
                  Assign
                </Button>
              )}
              {canCloseTicket() && ticket.status !== TicketStatus.CLOSED && (
                <Button onClick={handleCloseTicket} variant="outline" size="sm" className="shadow-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Close Ticket
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Metadata - Improved Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Assignee</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {ticket.assignedUser ? (
              <div>
                <div className="font-semibold text-lg">{ticket.assignedUser.name}</div>
                {ticket.team && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {ticket.team.name}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Followers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {ticket.followers && ticket.followers.length > 0 ? (
              <div className="space-y-1.5">
                <div className="font-semibold text-lg">{ticket.followers.length} {ticket.followers.length === 1 ? 'Follower' : 'Followers'}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {ticket.followers.slice(0, 3).map((follower) => (
                    <Badge key={follower.id} variant="secondary" className="text-xs">
                      {follower.user.name}
                    </Badge>
                  ))}
                  {ticket.followers.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{ticket.followers.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">No followers</span>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isSLABreached(ticket.slaDueAt) ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                <Clock className={`h-4 w-4 ${isSLABreached(ticket.slaDueAt) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">SLA Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {ticket.slaDueAt ? (
              <div>
                {isSLABreached(ticket.slaDueAt) ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-lg font-semibold text-red-600">Breached</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDistanceToNow(new Date(ticket.slaDueAt), { addSuffix: true })}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-green-600">On Track</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due {formatDistanceToNow(new Date(ticket.slaDueAt), { addSuffix: true })}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">No SLA</span>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Customer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {ticket.customer ? (
              <div>
                <div className="font-semibold text-lg">{ticket.customer.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{ticket.customer.email}</div>
              </div>
            ) : (
              <span className="text-muted-foreground">No customer</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details and Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Tabs for Comments, Attachments, History */}
          <Card className="shadow-sm">
            <Tabs defaultValue="comments">
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                  <TabsTrigger value="comments" className="flex items-center gap-2 py-2.5">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Comments</span>
                    <Badge variant="secondary" className="ml-1">{ticket.comments?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="flex items-center gap-2 py-2.5">
                    <Paperclip className="h-4 w-4" />
                    <span className="hidden sm:inline">Attachments</span>
                    <Badge variant="secondary" className="ml-1">{ticket.attachments?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2 py-2.5">
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">History</span>
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
                  <AttachmentList
                    attachments={ticket.attachments || []}
                    onDelete={async (attachment) => {
                      if (!confirm(`Are you sure you want to delete "${attachment.fileName}"?`)) {
                        return;
                      }
                      
                      try {
                        const response = await fetch(`/api/attachments/${attachment.id}`, {
                          method: 'DELETE',
                          credentials: 'include',
                        });
                        
                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.message || 'Failed to delete attachment');
                        }
                        
                        toast.success('Attachment deleted successfully');
                        // Refresh ticket data to update attachments list
                        fetchTicket();
                      } catch (error) {
                        console.error('Delete error:', error);
                        toast.error(error instanceof Error ? error.message : 'Failed to delete attachment');
                      }
                    }}
                    canDelete={(attachment) => {
                      // User can delete if they uploaded it or are admin
                      return attachment.uploader?.id === user?.id || user?.role === 'Admin/Manager';
                    }}
                  />
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
        <div className="space-y-4">
          {/* Additional Info */}
          <Card className="shadow-sm border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3 pb-3 border-b">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full mt-0.5">
                  <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div className="font-medium">
                    {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm') : 'Unknown'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">by {ticket.creator?.name || 'Unknown'}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 pb-3 border-b">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-full mt-0.5">
                  <div className="h-2 w-2 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Last Updated</div>
                  <div className="font-medium">
                    {ticket.updatedAt ? format(new Date(ticket.updatedAt), 'MMM d, yyyy HH:mm') : 'Unknown'}
                  </div>
                </div>
              </div>
              
              {ticket.resolvedAt && (
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-full mt-0.5">
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Resolved</div>
                    <div className="font-medium">
                      {format(new Date(ticket.resolvedAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              )}
              
              {ticket.closedAt && (
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-0.5">
                    <CheckCircle className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Closed</div>
                    <div className="font-medium">
                      {format(new Date(ticket.closedAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {(ticket.category || ticket.phone) && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {ticket.category && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      {ticket.category}
                    </Badge>
                  </div>
                )}
                {ticket.phone && (
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium">{ticket.phone}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
