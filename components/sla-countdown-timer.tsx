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
  detailed?: boolean;
}

export function SLACountdownTimer({ 
  slaDueAt, 
  status, 
  className,
  detailed = false 
}: SLACountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [colorClass, setColorClass] = useState<string>('');
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    // Don't show timer for closed or resolved tickets
    if (status === 'CLOSED' || status === 'RESOLVED') {
      return;
    }

    if (!slaDueAt) {
      setTimeRemaining('No SLA');
      setColorClass('bg-gray-500 text-white');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const due = new Date(slaDueAt);
      const diff = due.getTime() - now.getTime();

      if (diff <= 0) {
        // SLA breached
        const overdue = Math.abs(diff);
        const hours = Math.floor(overdue / (1000 * 60 * 60));
        const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeRemaining(`Overdue by ${hours}h ${minutes}m`);
        setColorClass('bg-red-600 text-white');
        setIsBreached(true);
      } else {
        // Calculate time remaining
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let timeStr = '';
        if (days > 0) {
          timeStr = `${days}d ${hours}h`;
        } else if (hours > 0) {
          timeStr = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          timeStr = `${minutes}m ${seconds}s`;
        } else {
          timeStr = `${seconds}s`;
        }

        setTimeRemaining(timeStr);
        setIsBreached(false);

        // Color coding based on time remaining
        const totalMinutes = Math.floor(diff / (1000 * 60));
        if (totalMinutes <= 30) {
          // Critical: less than 30 minutes
          setColorClass('bg-red-500 text-white');
        } else if (totalMinutes <= 120) {
          // Warning: less than 2 hours
          setColorClass('bg-yellow-500 text-white');
        } else {
          // Safe: more than 2 hours
          setColorClass('bg-green-500 text-white');
        }
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [slaDueAt, status]);

  // Don't render for closed/resolved tickets
  if (status === 'CLOSED' || status === 'RESOLVED') {
    return null;
  }

  if (!slaDueAt) {
    return (
      <Badge variant="secondary" className={cn('gap-1', className)}>
        <Clock className="h-3 w-3" />
        No SLA
      </Badge>
    );
  }

  if (isBreached) {
    return (
      <Badge variant="destructive" className={cn(colorClass, 'gap-1', className)}>
        <AlertTriangle className="h-3 w-3" />
        {detailed ? 'SLA Breached: ' : ''}{timeRemaining}
      </Badge>
    );
  }

  return (
    <Badge className={cn(colorClass, 'gap-1', className)}>
      <Clock className="h-3 w-3" />
      {detailed ? 'SLA: ' : ''}{timeRemaining}
    </Badge>
  );
}
