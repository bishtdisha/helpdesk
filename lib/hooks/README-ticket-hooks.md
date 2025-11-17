# Ticket Data Fetching Hooks

This document describes the API client and custom hooks for ticket data fetching and mutations.

## API Client (`lib/api-client.ts`)

A centralized HTTP client that provides:

- **Type-safe HTTP methods**: `get()`, `post()`, `put()`, `delete()`, `patch()`
- **Automatic error handling**: Handles 401, 403, 404, 500 status codes with appropriate actions
- **Authentication**: Includes credentials (cookies) for session management
- **Query parameter building**: Automatically constructs URLs with query parameters
- **Error parsing**: Transforms API errors into user-friendly messages

### Usage Example

```typescript
import { apiClient } from '@/lib/api-client';

// GET request with query params
const tickets = await apiClient.get('/tickets', { status: 'OPEN', page: 1 });

// POST request
const newTicket = await apiClient.post('/tickets', { title: 'New Ticket', ... });
```

## Hooks

### `useTickets` - Ticket List Hook

Fetches and manages ticket list data with filtering and pagination.

**Features:**
- SWR caching and revalidation
- 30-second polling for real-time updates
- Support for filters (status, priority, team, assignee, search)
- Pagination support
- Manual refresh function

**Usage:**

```typescript
import { useTickets } from '@/lib/hooks';

function TicketList() {
  const { tickets, pagination, isLoading, error, refresh } = useTickets({
    status: ['OPEN', 'IN_PROGRESS'],
    priority: ['HIGH', 'URGENT'],
    page: 1,
    limit: 20,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {tickets.map(ticket => (
        <div key={ticket.id}>{ticket.title}</div>
      ))}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### `useTicket` - Single Ticket Hook

Fetches detailed information for a single ticket.

**Features:**
- SWR caching and revalidation
- 30-second polling for real-time updates
- Full ticket details with relationships (comments, attachments, followers, history)
- Manual refresh function

**Usage:**

```typescript
import { useTicket } from '@/lib/hooks';

function TicketDetail({ ticketId }: { ticketId: string }) {
  const { ticket, isLoading, error, refresh } = useTicket(ticketId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div>
      <h1>{ticket.title}</h1>
      <p>{ticket.description}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### `useTicketMutations` - Ticket Mutation Hook

Provides functions for creating, updating, assigning, and closing tickets.

**Features:**
- Type-safe mutation functions
- Automatic cache invalidation after mutations
- Optimistic updates support
- Error handling

**Usage:**

```typescript
import { useTicketMutations } from '@/lib/hooks';

function CreateTicketForm() {
  const { createTicket } = useTicketMutations();

  const handleSubmit = async (data) => {
    try {
      const newTicket = await createTicket({
        title: data.title,
        description: data.description,
        priority: 'HIGH',
        customerId: data.customerId,
      });
      console.log('Ticket created:', newTicket);
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Available Mutations:**

- `createTicket(data)` - Create a new ticket
- `updateTicket(id, data)` - Update ticket fields
- `assignTicket(id, { assignedTo, teamId })` - Assign ticket to user/team
- `closeTicket(id)` - Close a ticket (sets status to CLOSED)

## Error Handling

All hooks and the API client handle errors consistently:

- **401 Unauthorized**: Automatically redirects to `/login`
- **403 Forbidden**: Throws error with "Access denied" message
- **404 Not Found**: Throws error with "Resource not found" message
- **500 Server Error**: Throws error with "Internal server error" message
- **Network Errors**: Throws error with "Network error" message

## Caching Strategy

- **Ticket List**: Cached with 30-second refresh interval
- **Single Ticket**: Cached with 30-second refresh interval
- **Deduplication**: Prevents duplicate requests within 5 seconds
- **Revalidation**: Automatically revalidates on focus and reconnect
- **Cache Invalidation**: Mutations automatically invalidate relevant caches

## Requirements Satisfied

This implementation satisfies the following requirements:

- **2.1**: Fetch ticket data from GET /api/tickets with automatic role-based filtering
- **2.2**: Display loading states while fetching ticket data
- **2.3**: Handle API errors with user-friendly error messages
- **2.4**: Support pagination using API's page and limit parameters
- **3.1**: Send POST request to /api/tickets for ticket creation
- **4.1**: Fetch ticket details from GET /api/tickets/:id
- **4.3**: Display ticket metadata based on user permissions
- **5.4**: Send POST request to /api/tickets/:id/assign for assignment
- **14.2**: Send PUT request to /api/tickets/:id for status updates
- **14.3**: Send PUT request to /api/tickets/:id for priority updates
- **16.1-16.5**: Proper error handling for different HTTP status codes
- **25.1**: Poll Backend_API every 30 seconds for ticket list updates
- **25.4**: Automatically refresh ticket details when changes detected
