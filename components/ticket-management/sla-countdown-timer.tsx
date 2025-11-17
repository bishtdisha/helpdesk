'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TicketStatus } from '@prisma/client';

interface SLACountdownTimerProps {
  slaDueAt: Date | string | null;
  status: TicketStatus;
  className?: string;
}

export function SLACountdownTimer({ slaDueAt, status, className }: SLACountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<'safe' | 'warning' | 'critical'>('safe');

  useEffect(() => {
    // Don't show timer for closed or resolved tickets
    if (status === TicketStatus.CLOSED || status === TicketStatus.RESOLVED) {
      return;
    }

    if (!slaDueAt) {
      setTimeRemaining('No SLA');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const dueDate = new Date(slaDueAt);
      const diff = dueDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsOverdue(true);
        setUrgencyLevel('critical');
        const overdueDiff = Math.abs(diff);
        const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
        const minutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m overdue`);
        return;
      }

      // Calculate time remaining
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Determine urgency level
      const totalHours = diff / (1000 * 60 * 60);
      if (totalHours <= 2) {
        setUrgencyLevel('critical');
      } else if (totalHours <= 24) {
        setUrgencyLevel('warning');
      } else {
        setUrgencyLevel('safe');
      }

      // Format time remaining
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [slaDueAt, status]);

  // Don't render for closed/resolved tickets
  if (status === TicketStatus.CLOSED || status === TicketStatus.RESOLVED) {
    return null;
  }

  if (!slaDueAt) {
    return (
      <Badge variant="outline" className={cn('text-xs', className)}>
        <Clock className="h-3 w-3 mr-1" />
        No SLA
      </Badge>
    );
  }

  const getColorClass = () => {
    if (isOverdue) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800';
    }
    switch (urgencyLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <Badge variant="outline" className={cn('text-xs flex items-center gap-1', getColorClass(), className)}>
      {isOverdue ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {timeRemaining}
    </Badge>
  );
}
