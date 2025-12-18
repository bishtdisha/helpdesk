import { Badge } from '@/components/ui/badge';
import { TicketStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const getStatusConfig = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return {
          label: 'New',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800',
        };
      case TicketStatus.IN_PROGRESS:
        return {
          label: 'In Progress',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
        };
      case TicketStatus.PENDING:
        return {
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
        };
      case TicketStatus.WAITING_FOR_CUSTOMER:
        return {
          label: 'On Hold',
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800',
        };
      case TicketStatus.RESOLVED:
        return {
          label: 'Resolved',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
        };
      case TicketStatus.CLOSED:
        return {
          label: 'Cancelled',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
