# Ticket Detail Component

This directory contains the implementation of the Ticket Detail component and its supporting components.

## Components

### 1. TicketDetail (`ticket-detail.tsx`)
Main component that displays full ticket information with real-time updates.

**Features:**
- Fetches ticket data using `useTicket` hook with 30-second polling
- Displays ticket metadata (status, priority, assignee, team, SLA)
- Shows customer and creator information
- Provides action buttons based on user permissions
- Supports status and priority updates with optimistic UI
- Real-time SLA countdown timer
- Loading skeletons and error handling

**Props:**
- `ticketId: string` - The ID of the ticket to display
- `onClose?: () => void` - Optional callback when close button is clicked

**Usage:**
```tsx
import { TicketDetail } from '@/components/ticket-detail';

<TicketDetail ticketId="ticket-123" />
```

### 2. TicketStatusBadge (`ticket-status-badge.tsx`)
Displays ticket status with color-coded badges.

**Status Colors:**
- OPEN: Red (destructive)
- IN_PROGRESS: Blue (default)
- RESOLVED: Green (secondary)
- CLOSED: Gray (outline)

**Usage:**
```tsx
import { TicketStatusBadge } from '@/components/ticket-status-badge';

<TicketStatusBadge status="OPEN" />
```

### 3. PriorityBadge (`priority-badge.tsx`)
Displays ticket priority with color-coded badges and icons.

**Priority Colors:**
- URGENT: Red with AlertCircle icon
- HIGH: Orange with ArrowUp icon
- MEDIUM: Yellow with Minus icon
- LOW: Green with ArrowDown icon

**Usage:**
```tsx
import { PriorityBadge } from '@/components/priority-badge';

<PriorityBadge priority="HIGH" showIcon={true} />
```

### 4. SLACountdownTimer (`sla-countdown-timer.tsx`)
Real-time countdown timer for SLA deadlines with color-coded warnings.

**Features:**
- Updates every second
- Color-coded based on time remaining:
  - Green: > 2 hours remaining
  - Yellow: 30 minutes - 2 hours remaining
  - Red: < 30 minutes remaining or breached
- Shows "Overdue by X" when SLA is breached
- Hides for closed/resolved tickets

**Usage:**
```tsx
import { SLACountdownTimer } from '@/components/sla-countdown-timer';

<SLACountdownTimer 
  slaDueAt={ticket.slaDueAt} 
  status={ticket.status}
  detailed={true}
/>
```

## Permission-Based Features

The TicketDetail component respects RBAC permissions:

### Admin_Manager
- Can view all tickets
- Can edit any ticket (status, priority)
- Can assign tickets to anyone
- Can close tickets

### Team_Leader
- Can view team tickets
- Can edit team tickets
- Can assign tickets to team members
- Can close team tickets

### User_Employee
- Can view own tickets and followed tickets
- Can view ticket details (read-only for others' tickets)
- Can edit own tickets
- Cannot assign tickets
- Cannot close tickets (except own)

## Integration with Existing Code

The component integrates with:
- `useTicket` hook for data fetching
- `useTicketMutations` hook for updates
- `usePermissions` hook for RBAC checks
- `useAuth` hook for user context
- Sonner for toast notifications
- SWR for caching and real-time updates

## Requirements Satisfied

This implementation satisfies the following requirements:

- **4.1**: Displays full ticket information from API
- **4.2**: Shows ticket metadata
- **4.3**: Displays ticket details with proper formatting
- **4.4**: Handles loading and error states
- **4.5**: Shows visual indicators (badges, timers)
- **14.1**: Provides action buttons based on permissions
- **14.2**: Implements status updates
- **14.3**: Implements priority updates
- **14.4**: Updates UI after successful operations
- **14.5**: Validates status transitions
- **17.3**: Hides assignment controls for User_Employee
- **17.4**: Shows admin-only features appropriately
- **31.5**: Displays detailed SLA information
- **36.3**: Shows priority indicators in detail view

## Next Steps

To complete the ticket management feature, you should:

1. Implement the ticket assignment dialog (Task 5.3 enhancement)
2. Add comment system (Task 8)
3. Add attachment management (Task 7)
4. Add follower management (Task 9)
5. Add activity timeline (Task 22)

## Example Usage

See `ticket-detail-example.tsx` for complete usage examples including:
- Using in a dialog/modal
- Using in a full page
- Triggering from a ticket list
