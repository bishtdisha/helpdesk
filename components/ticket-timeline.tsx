'use client';

import { useMemo } from 'react';
import { useTicketHistory, TimelineActivity } from '@/lib/hooks/use-ticket-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle,
  MessageSquare,
  Paperclip,
  Edit,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from 'date-fns';

interface TicketTimelineProps {
  ticketId: string;
  comments?: any[];
  attachments?: any[];
}

// Helper function to get icon for activity type
function getActivityIcon(activity: TimelineActivity) {
  if (activity.type === 'comment') {
    return <MessageSquare className="h-4 w-4" />;
  }
  
  if (activity.type === 'attachment') {
    return <Paperclip className="h-4 w-4" />;
  }
  
  // History actions
  const action = activity.data.action?.toLowerCase() || '';
  
  if (action.includes('status')) {
    if (activity.data.newValue === 'CLOSED' || activity.data.newValue === 'RESOLVED') {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  }
  
  if (action.includes('assign')) {
    return <UserPlus className="h-4 w-4" />;
  }
  
  if (action.includes('priority')) {
    if (activity.data.newValue === 'URGENT' || activity.data.newValue === 'HIGH') {
      return <ArrowUpCircle className="h-4 w-4" />;
    }
    return <ArrowDownCircle className="h-4 w-4" />;
  }
  
  if (action.includes('create')) {
    return <FileText className="h-4 w-4" />;
  }
  
  return <Edit className="h-4 w-4" />;
}

// Helper function to get activity description
function getActivityDescription(activity: TimelineActivity): string {
  if (activity.type === 'comment') {
    const comment = activity.data;
    const preview = comment.content.substring(0, 100);
    return comment.isInternal 
      ? `Added internal note: ${preview}${comment.content.length > 100 ? '...' : ''}`
      : `Added comment: ${preview}${comment.content.length > 100 ? '...' : ''}`;
  }
  
  if (activity.type === 'attachment') {
    const attachment = activity.data;
    return `Uploaded file: ${attachment.fileName}`;
  }
  
  // History actions
  const action = activity.data.action;
  const fieldName = activity.data.fieldName;
  const oldValue = activity.data.oldValue;
  const newValue = activity.data.newValue;
  
  if (action === 'created') {
    return 'Created the ticket';
  }
  
  if (action === 'status_changed' && fieldName === 'status') {
    return `Changed status from ${oldValue || 'none'} to ${newValue}`;
  }
  
  if (action === 'priority_changed' && fieldName === 'priority') {
    return `Changed priority from ${oldValue || 'none'} to ${newValue}`;
  }
  
  if (action === 'assigned' || action === 'reassigned') {
    return `Assigned ticket to ${newValue || 'unassigned'}`;
  }
  
  if (action === 'updated' && fieldName) {
    return `Updated ${fieldName} from "${oldValue || 'none'}" to "${newValue}"`;
  }
  
  return action;
}

// Helper function to get user info from activity
function getUserInfo(activity: TimelineActivity) {
  if (activity.type === 'comment') {
    return activity.data.author;
  }
  
  if (activity.type === 'attachment') {
    return activity.data.uploader;
  }
  
  return activity.data.user;
}

// Helper function to format date header
function getDateHeader(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  return format(date, 'MMMM d, yyyy');
}

// Group activities by date
function groupActivitiesByDate(activities: TimelineActivity[]): Map<string, TimelineActivity[]> {
  const grouped = new Map<string, TimelineActivity[]>();
  
  activities.forEach(activity => {
    const date = new Date(activity.data.createdAt);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    
    grouped.get(dateKey)!.push(activity);
  });
  
  return grouped;
}

export function TicketTimeline({ ticketId, comments, attachments }: TicketTimelineProps) {
  const { activities, isLoading, isError, error } = useTicketHistory(
    ticketId,
    comments,
    attachments
  );

  // Group activities by date
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(activities);
  }, [activities]);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || 'Failed to load activity timeline'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from(groupedActivities.entries()).map(([dateKey, dateActivities]) => {
            const date = new Date(dateKey);
            
            return (
              <div key={dateKey} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {getDateHeader(date)}
                  </h3>
                  <Separator className="flex-1" />
                </div>

                {/* Activities for this date */}
                <div className="relative space-y-4 pl-6">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-border" />

                  {dateActivities.map((activity, index) => {
                    const user = getUserInfo(activity);
                    const icon = getActivityIcon(activity);
                    const description = getActivityDescription(activity);
                    const timestamp = new Date(activity.data.createdAt);

                    return (
                      <div key={activity.data.id} className="relative flex gap-4">
                        {/* Activity icon with background */}
                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted">
                          {icon}
                        </div>

                        {/* Activity content */}
                        <div className="flex-1 space-y-1 pt-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{user.name || user.email}</span>
                            </div>
                            <span 
                              className="text-xs text-muted-foreground whitespace-nowrap"
                              title={format(timestamp, 'PPpp')}
                            >
                              {formatDistanceToNow(timestamp, { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
