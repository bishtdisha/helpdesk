'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, UserPlus, XCircle } from 'lucide-react';
import { TicketStatus } from '@/lib/types/ticket';

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusUpdate: (status: TicketStatus) => void;
  onBulkAssign: () => void;
  onBulkClose: () => void;
  canAssign: boolean;
}

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkAssign,
  onBulkClose,
  canAssign,
}: BulkActionToolbarProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (status) {
      onBulkStatusUpdate(status as TicketStatus);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 shadow-lg border-2">
      <div className="flex items-center gap-4 p-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} {selectedCount === 1 ? 'ticket' : 'tickets'} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear selection</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Status Update */}
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Assign Button */}
          {canAssign && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkAssign}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Assign
            </Button>
          )}

          {/* Close Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkClose}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Close
          </Button>
        </div>
      </div>
    </Card>
  );
}
