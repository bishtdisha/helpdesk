# Ticket Management UI Components

This directory contains all the UI components for the ticket management system with role-based access control (RBAC).

## Components

### 1. TicketList
**File:** `ticket-list.tsx`

A comprehensive ticket list component with role-based filtering, search, and pagination.

**Features:**
- Role-based ticket visibility (Admin: all, Team Leader: team, User: own+following)
- Search functionality across title, description, and customer
- Filters for status, priority, team, and assignee
- Pagination controls
- Ticket statistics dashboard
- SLA status indicators
- Responsive design

**Props:**
- `onCreateTicket?: () => void` - Callback when create ticket button is clicked
- `onViewTicket?: (ticketId: string) => void` - Callback when viewing a ticket

**Usage:**
```tsx
<TicketList
  onCreateTicket={() => setShowCreateForm(true)}
  onViewTicket={(id) => navigateToTicket(id)}
/>
```

### 2. TicketDetail
**File:** `ticket-detail.tsx`

Detailed ticket view with comments, attachments, history, and role-based actions.

**Features:**
- Full ticket information display
- Ticket metadata (status, priority, assignee, SLA)
- Comments section with add comment functionality
- Attachments list with download capability
- Ticket history timeline
- Follower list
- Customer information
- Role-based action buttons (assign, close, edit)
- SLA breach indicators

**Props:**
- `ticketId: string` - The ticket ID to display
- `onBack?: () => void` - Callback for back navigation
- `onAssign?: (ticketId: string) => void` - Callback to open assignment dialog
- `onManageFollowers?: (ticketId: string) => void` - Callback to open follower management

**Usage:**
```tsx
<TicketDetail
  ticketId="ticket-123"
  onBack={() => setView('list')}
  onAssign={(id) => setAssignmentDialogOpen(true)}
  onManageFollowers={(id) => setFollowerDialogOpen(true)}
/>
```

### 3. CreateTicketForm
**File:** `create-ticket-form.tsx`

Form component for creating new tickets with KB article suggestions.

**Features:**
- Form validation
- Customer selection
- Priority and category selection
- File attachment support with drag-and-drop
- Real-time KB article suggestions based on content
- Character count for title
- Responsive layout with sidebar

**Props:**
- `onSuccess?: (ticketId: string) => void` - Callback when ticket is created successfully
- `onCancel?: () => void` - Callback when form is cancelled

**Usage:**
```tsx
<CreateTicketForm
  onSuccess={(id) => navigateToTicket(id)}
  onCancel={() => setShowForm(false)}
/>
```

### 4. TicketAssignmentDialog
**File:** `ticket-assignment-dialog.tsx`

Modal dialog for assigning tickets to team members.

**Features:**
- Team selection (Admin only)
- User selection with filtering
- Shows current assignment
- Unassign functionality
- Role-based user filtering (Team Leaders see only their team)
- Loading states

**Props:**
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - Callback for dialog state changes
- `ticketId: string` - The ticket to assign
- `currentAssigneeId?: string | null` - Current assignee ID
- `currentTeamId?: string | null` - Current team ID
- `onSuccess?: () => void` - Callback when assignment succeeds

**Usage:**
```tsx
<TicketAssignmentDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  ticketId="ticket-123"
  currentAssigneeId={ticket.assignedTo}
  currentTeamId={ticket.teamId}
  onSuccess={() => refreshTicket()}
/>
```

### 5. FollowerManagementDialog
**File:** `follower-management-dialog.tsx`

Modal dialog for managing ticket followers.

**Features:**
- Display current followers
- Search and add new followers
- Remove followers (with permission checks)
- Role-based permissions (Admin/Team Leader can add, Users can remove self)
- Real-time follower list updates

**Props:**
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - Callback for dialog state changes
- `ticketId: string` - The ticket to manage followers for
- `onSuccess?: () => void` - Callback when follower operation succeeds

**Usage:**
```tsx
<FollowerManagementDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  ticketId="ticket-123"
  onSuccess={() => refreshTicket()}
/>
```

### 6. TicketManagementPage
**File:** `ticket-management-page.tsx`

Main page component that integrates all ticket management components.

**Features:**
- View switching (list, detail, create)
- State management for dialogs
- Integrated navigation between views
- Handles all component interactions

**Usage:**
```tsx
// In your page component
import { TicketManagementPage } from '@/components/ticket-management/ticket-management-page'

export default function TicketsPage() {
  return <TicketManagementPage />
}
```

## Role-Based Access Control

The components implement the following RBAC rules:

### Admin/Manager
- View all tickets across all teams
- Create, edit, and delete any ticket
- Assign tickets to any user or team
- Close any ticket
- Add/remove any follower
- Access all analytics

### Team Leader
- View tickets assigned to their team
- Create and edit team tickets
- Assign tickets to team members
- Close team tickets
- Add/remove followers on team tickets
- Access team analytics

### User/Employee
- View tickets they created or are following
- Create new tickets
- Edit their own tickets (before assignment)
- Add comments to tickets they can access
- Remove themselves as followers
- No analytics access

## API Integration

All components integrate with the following API endpoints:

- `GET /api/tickets` - List tickets with filters
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/assign` - Assign ticket
- `POST /api/tickets/:id/close` - Close ticket
- `POST /api/tickets/:id/comments` - Add comment
- `GET /api/tickets/:id/followers` - Get followers
- `POST /api/tickets/:id/followers` - Add follower
- `DELETE /api/tickets/:id/followers/:userId` - Remove follower
- `POST /api/tickets/:id/attachments` - Upload attachment
- `GET /api/customers` - Get customers list
- `GET /api/users` - Get users list
- `GET /api/teams` - Get teams list
- `POST /api/knowledge-base/suggest` - Get KB suggestions

## Dependencies

- `@radix-ui/react-*` - UI primitives
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `@prisma/client` - Database types
- Custom hooks: `useAuth` from `@/lib/hooks/use-auth`

## Styling

Components use Tailwind CSS with the project's design system:
- Card components for containers
- Badge components for status/priority
- Button components with variants
- Form components (Input, Select, Textarea)
- Dialog components for modals
- Responsive grid layouts

## Type Safety

All components are fully typed with TypeScript using types from:
- `@/lib/types/ticket` - Ticket-specific types
- `@prisma/client` - Database types
- `@/lib/types/rbac` - RBAC types

## Testing

Components should be tested for:
- Role-based visibility
- Permission checks
- API integration
- Form validation
- Error handling
- Loading states
