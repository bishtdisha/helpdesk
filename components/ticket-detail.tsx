'use client';

import { useState } from 'react';
import { useTicket } from '@/lib/hooks/use-ticket';
import { useTicketDetailUpdates } from '@/lib/hooks/use-ticket-detail-updates';
import { useTicketMutations } from '@/lib/hooks/use-ticket-mutations';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { TicketStatusBadge } from './ticket-status-badge';
import { PriorityBadge } from './priority-badge';
import { SLACountdownTimer } from './sla-countdown-timer';
import { TicketComments } from './ticket-comments';
import { FollowerManager } from './follower-manager';
import { TicketTimeline } from './ticket-timeline';
import { InlineHelp } from '@/components/ui/inline-help';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertCircle, 
  User, 
  Users, 
  Calendar, 
  Edit, 
  UserPlus,
  X,
  RefreshCw
} from 'lucide-react';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TicketDetailProps {
  ticketId: string;
  onClose?: () => void;
}

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const { ticket, isLoading, isError, error, refresh } = useTicket(ticketId);
  const { updateTicket } = useTicketMutations();
  const permissions = usePermissions();
  const { user } = useAuth();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track ticket updates and show notifications
  useTicketDetailUpdates(ticket, {
    showToast: true,
  });

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      toast.success('Ticket refreshed');
    } catch (err) {
      toast.error('Failed to refresh ticket');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle status update
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    
    setIsUpdating(true);
    try {
      await updateTicket(ticket.id, { status: newStatus }, { showUndo: true });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle priority update
  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket) return;
    
    setIsUpdating(true);
    try {
      await updateTicket(ticket.id, { priority: newPriority });
      toast.success('Ticket priority updated successfully');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update priority');
    } finally {
      setIsUpdating(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError || !ticket) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || 'Failed to load ticket details. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refresh()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if user can edit this ticket
  const canEdit = permissions.canEditTicket(ticket);
  const canAssign = permissions.canAssignTicket(ticket);
  const isOwnTicket = user?.id === ticket.createdById;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                <TooltipButton 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  tooltip="Refresh ticket data"
                  shortcut="F5"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </TooltipButton>
                {onClose && (
                  <TooltipButton 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose}
                    tooltip="Close ticket detail view"
                    shortcut="Esc"
                  >
                    <X className="h-4 w-4" />
                  </TooltipButton>
                )}
              </div>
              <CardDescription>
                Ticket #{ticket.id.slice(0, 8)} • Created {format(new Date(ticket.createdAt), 'PPp')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metadata Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ticket Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              {canEdit ? (
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <TicketStatusBadge status={ticket.status} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">
                      <TicketStatusBadge status="OPEN" />
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS">
                      <TicketStatusBadge status="IN_PROGRESS" />
                    </SelectItem>
                    <SelectItem value="RESOLVED">
                      <TicketStatusBadge status="RESOLVED" />
                    </SelectItem>
                    <SelectItem value="CLOSED">
                      <TicketStatusBadge status="CLOSED" />
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  <TicketStatusBadge status={ticket.status} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              {canEdit ? (
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => handlePriorityChange(value as TicketPriority)}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <PriorityBadge priority={ticket.priority} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      <PriorityBadge priority="LOW" />
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <PriorityBadge priority="MEDIUM" />
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <PriorityBadge priority="HIGH" />
                    </SelectItem>
                    <SelectItem value="URGENT">
                      <PriorityBadge priority="URGENT" />
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  <PriorityBadge priority={ticket.priority} />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Assignee and Team Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned To
              </label>
              <div className="flex items-center gap-2">
                {ticket.assignedUser ? (
                  <>
                    <Avatar className="h-8 w-8">
                      <div className="bg-primary text-primary-foreground flex items-center justify-center h-full w-full text-sm">
                        {ticket.assignedUser.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{ticket.assignedUser.name}</p>
                      <p className="text-xs text-muted-foreground">{ticket.assignedUser.email}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
                {canAssign && (
                  <TooltipButton 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto"
                    tooltip="Assign ticket to a team member"
                    shortcut="Ctrl+A"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign
                  </TooltipButton>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team
              </label>
              <div>
                {ticket.team ? (
                  <p className="text-sm font-medium">{ticket.team.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No team assigned</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* SLA and Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">SLA Status</label>
              <div>
                <SLACountdownTimer 
                  slaDueAt={ticket.slaDueAt}
                  createdAt={ticket.createdAt}
                  status={ticket.status}
                  detailed={true}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last Updated
              </label>
              <p className="text-sm">{format(new Date(ticket.updatedAt), 'PPp')}</p>
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Customer</label>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <div className="bg-secondary text-secondary-foreground flex items-center justify-center h-full w-full text-sm">
                  {ticket.customer.name?.charAt(0).toUpperCase() || 'C'}
                </div>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{ticket.customer.name}</p>
                <p className="text-xs text-muted-foreground">{ticket.customer.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Created By */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Created By</label>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <div className="bg-secondary text-secondary-foreground flex items-center justify-center h-full w-full text-sm">
                  {ticket.creator.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{ticket.creator.name}</p>
                <p className="text-xs text-muted-foreground">{ticket.creator.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Help for SLA Management */}
      {ticket.slaDueAt && (
        <InlineHelp
          title="Understanding SLA Timers"
          variant="info"
          collapsible
          defaultOpen={false}
          links={[
            { text: "SLA Policy Documentation", href: "#", external: true }
          ]}
        >
          <div className="space-y-2">
            <p>SLA (Service Level Agreement) timers track how much time remains to meet our response and resolution commitments.</p>
            <p><strong>Green:</strong> Plenty of time remaining</p>
            <p><strong>Yellow:</strong> Approaching deadline</p>
            <p><strong>Red:</strong> SLA breach imminent or occurred</p>
            <p>SLA times are calculated based on ticket priority and business hours.</p>
          </div>
        </InlineHelp>
      )}

      {/* Followers Section */}
      <FollowerManager ticketId={ticket.id} />

      {/* Comments Section */}
      <TicketComments ticketId={ticket.id} />

      {/* Activity Timeline */}
      <TicketTimeline 
        ticketId={ticket.id} 
        comments={ticket.comments}
        attachments={ticket.attachments}
      />

      {/* Action Buttons */}
      {(canEdit || canAssign || isOwnTicket) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Ticket
                </Button>
              )}
              {canAssign && (
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Ticket
                </Button>
              )}
              {canEdit && ticket.status !== 'CLOSED' && (
                <Button 
                  variant="outline"
                  onClick={() => handleStatusChange('CLOSED')}
                  disabled={isUpdating}
                >
                  Close Ticket
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
