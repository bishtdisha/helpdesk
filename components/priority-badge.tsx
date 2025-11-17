'use client';

import { Badge } from '@/components/ui/badge';
import { TicketPriority } from '@prisma/client';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
  showIcon?: boolean;
}

export function PriorityBadge({ priority, className, showIcon = true }: PriorityBadgeProps) {
  const getPriorityConfig = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return {
          label: 'Urgent',
          variant: 'destructive' as const,
          className: 'bg-red-600 hover:bg-red-700 text-white',
          icon: AlertCircle,
        };
      case 'HIGH':
        return {
          label: 'High',
          variant: 'destructive' as const,
          className: 'bg-orange-500 hover:bg-orange-600 text-white',
          icon: ArrowUp,
        };
      case 'MEDIUM':
        return {
          label: 'Medium',
          variant: 'default' as const,
          className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          icon: Minus,
        };
      case 'LOW':
        return {
          label: 'Low',
          variant: 'secondary' as const,
          className: 'bg-green-500 hover:bg-green-600 text-white',
          icon: ArrowDown,
        };
      default:
        return {
          label: priority,
          variant: 'secondary' as const,
          className: '',
          icon: Minus,
        };
    }
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
