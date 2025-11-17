# Ticket Management Components

This directory contains the core ticket list components for the ticket management system with full RBAC support.

## Components

### TicketsPage
Main wrapper component that combines filters and ticket list.

```tsx
import { TicketsPage } from '@/components/ticket-management/tickets-page';

<TicketsPage onCreateTicket={() => router.push('/tickets/new')} />
```

### TicketList
Core ticket list component with table/card views, pagination, and RBAC filtering.

```tsx
import { TicketList } from '@/components/ticket-management';

<TicketList 
  filters={{ status: 'OPEN', priority: 'HIGH' }}
  onTicketClick={(id) => router.push(`/tickets/${id}`)}
  onCreateTicket={() => router.push('/tickets/new')}
/>
```

### TicketFilters
Search and filter UI with debounced search and URL query param management.

```tsx
import { TicketFilters } from '@/components/ticket-management';

<TicketFilters />
```

### Visual Indicator Components

#### TicketStatusBadge
Color-coded status badge.

```tsx
import { TicketStatusBadge } from '@/components/ticket-management';

<TicketStatusBadge status="OPEN" />
```

#### TicketPriorityBadge
Color-coded priority badge with icons.

```tsx
import { TicketPriorityBadge } from '@/components/ticket-management';

<TicketPriorityBadge priority="URGENT" showIcon={true} />
```

#### SLACountdownTimer
Real-time SLA countdown with color coding.

```tsx
import { SLACountdownTimer } from '@/components/ticket-management';

<SLACountdownTimer 
  slaDueAt={ticket.slaDueAt} 
  status={ticket.status} 
/>
```

## Features

### ✅ Implemented

1. **RBAC-Aware Display**
   - Admin_Manager: See all tickets with all columns
   - Team_Leader: See team tickets with team-specific columns
   - User_Employee: See own tickets and followed tickets

2. **Responsive Design**
   - Desktop: Table view with all columns
   - Mobile: Card view with essential information

3. **Pagination**
   - URL query param management
   - Previous/Next navigation
   - Page number buttons
   - Results count display

4. **Search & Filters**
   - Debounced search (300ms)
   - Status filter dropdown
   - Priority filter dropdown
   - Team filter (Admin_Manager & Team_Leader only)
   - Assignee filter (Admin_Manager & Team_Leader only)
   - URL query param persistence

5. **Loading States**
   - Skeleton loaders for table and cards
   - Loading spinner during fetch

6. **Empty States**
   - No tickets message
   - No results for filters message
   - Clear filters button
   - Create ticket button

7. **Error States**
   - Error message display
   - Retry button
   - User-friendly error messages

8. **Visual Indicators**
   - Color-coded status badges
   - Color-coded priority badges with icons
   - Real-time SLA countdown timers
   - Overdue ticket highlighting (red background)
   - SLA urgency levels (safe/warning/critical)

## Usage Example

Replace the existing tickets component:

```tsx
// app/tickets/page.tsx
'use client';

import { TicketsPage } from '@/components/ticket-management/tickets-page';
import { useRouter } from 'next/navigation';

export default function TicketsPageRoute() {
  const router = useRouter();

  return (
    <TicketsPage 
      onCreateTicket={() => router.push('/tickets/new')} 
    />
  );
}
```

## Requirements Covered

- ✅ 1.1, 1.2, 1.3, 1.4, 1.5: Role-based ticket display
- ✅ 2.1, 2.2, 2.3, 2.4, 2.5: API integration with loading/error states
- ✅ 7.1, 7.2, 7.3, 7.4, 7.5: Responsive design
- ✅ 18.1, 18.2, 18.3, 18.4, 18.5: Search and filters
- ✅ 22.1, 23.1, 24.2: Role-specific filters
- ✅ 31.1, 31.2, 31.3, 31.4, 31.5: SLA countdown timers
- ✅ 36.1, 36.2, 36.3, 36.4, 36.5: Visual indicators

## Dependencies

- `@/lib/hooks/use-tickets`: Ticket data fetching hook
- `@/lib/hooks/use-auth`: Authentication context
- `@/lib/hooks/use-permissions`: Permission checking
- `@/components/ui/*`: shadcn/ui components
- `date-fns`: Date formatting
- `lucide-react`: Icons

## Notes

- All filtering is done server-side via the API
- URL query params are used for filter persistence
- Real-time updates via 30-second polling (configured in useTickets hook)
- SLA timers update every second
- Overdue tickets are highlighted with red background
