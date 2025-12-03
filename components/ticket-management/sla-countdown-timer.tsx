'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TicketStatus } from '@prisma/client';

interface SLACountdownTimerProps {
  slaDueAt: Date | string | null;
  createdAt: Date | string;
  status: TicketStatus;
  className?: string;
}

export function SLACountdownTimer({ slaDueAt, createdAt, status, className }: SLACountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<'safe' | 'warning' | 'critical'>('safe');

  useEffect(() => {
    // For closed or resolved tickets, show total resolution time
    if (status === TicketStatus.CLOSED || status === TicketStatus.RESOLVED) {
      const now = new Date();
      const ticketCreated = new Date(createdAt);
      const totalDiff = now.getTime() - ticketCreated.getTime();
      
      const days = Math.floor(totalDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((totalDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((totalDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
      
      setIsOverdue(false);
      setUrgencyLevel('safe');
      return;
    }

    if (!slaDueAt) {
      setTimeRemaining('No SLA');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const ticketCreated = new Date(createdAt);
      const dueDate = new Date(slaDueAt);
      
      // Calculate ELAPSED time (counting UP from ticket creation)
      const elapsedDiff = now.getTime() - ticketCreated.getTime();
      
      // Calculate remaining time to check if breached
      const remainingDiff = dueDate.getTime() - now.getTime();
      
      // Check if SLA is breached
      if (remainingDiff <= 0) {
        setIsOverdue(true);
        setUrgencyLevel('critical');
      } else {
        setIsOverdue(false);
        
        // Determine urgency level based on remaining time
        const totalHours = remainingDiff / (1000 * 60 * 60);
        if (totalHours <= 2) {
          setUrgencyLevel('critical');
        } else if (totalHours <= 24) {
          setUrgencyLevel('warning');
        } else {
          setUrgencyLevel('safe');
        }
      }

      // Calculate elapsed time components
      const days = Math.floor(elapsedDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((elapsedDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedDiff % (1000 * 60 * 60)) / (1000 * 60));

      // Format elapsed time (counting UP)
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
  }, [slaDueAt, createdAt, status]);

  // For closed/resolved tickets, show resolution time in green with checkmark
  if (status === TicketStatus.CLOSED || status === TicketStatus.RESOLVED) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          'text-xs flex items-center gap-1',
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
          className
        )}
      >
        <CheckCircle className="h-3 w-3" />
        {timeRemaining}
      </Badge>
    );
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
