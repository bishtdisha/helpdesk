import { Badge } from '@/components/ui/badge';
import { TicketPriority } from '@prisma/client';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  showIcon?: boolean;
  className?: string;
}

export function TicketPriorityBadge({ priority, showIcon = true, className }: TicketPriorityBadgeProps) {
  const getPriorityConfig = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.URGENT:
        return {
          label: 'Urgent',
          icon: AlertCircle,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800',
        };
      case TicketPriority.HIGH:
        return {
          label: 'High',
          icon: ArrowUp,
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800',
        };
      case TicketPriority.MEDIUM:
        return {
          label: 'Medium',
          icon: Minus,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
        };
      case TicketPriority.LOW:
        return {
          label: 'Low',
          icon: ArrowDown,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
        };
      default:
        return {
          label: priority,
          icon: Minus,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
        };
    }
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('flex items-center gap-1', config.className, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
