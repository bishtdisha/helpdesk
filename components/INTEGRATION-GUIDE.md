# Ticket Detail Component - Integration Guide

## Quick Start

### 1. Basic Usage in a Page

```tsx
// app/tickets/[id]/page.tsx
import { TicketDetail } from '@/components/ticket-detail';

export default function TicketPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <TicketDetail ticketId={params.id} />
    </div>
  );
}
```

### 2. Usage in a Dialog/Modal

```tsx
import { TicketDetail } from '@/components/ticket-detail';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function TicketModal({ ticketId, open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <TicketDetail ticketId={ticketId} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Integration with Ticket List

```tsx
// In your ticket list component
import { useState } from 'react';
import { TicketDetail } from '@/components/ticket-detail';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function TicketList() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  return (
    <>
      {/* Your ticket list */}
      <table>
        {tickets.map(ticket => (
          <tr key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)}>
            {/* ticket row */}
          </tr>
        ))}
      </table>
      
      {/* Ticket detail modal */}
      {selectedTicketId && (
        <Dialog 
          open={!!selectedTicketId} 
          onOpenChange={(open) => !open && setSelectedTicketId(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <TicketDetail 
              ticketId={selectedTicketId} 
              onClose={() => setSelectedTicketId(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
```

## Prerequisites

### 1. Required Dependencies

Ensure these packages are installed:

```bash
npm install swr date-fns sonner lucide-react
# or
pnpm add swr date-fns sonner lucide-react
```

### 2. Required Context Providers

Wrap your app with necessary providers:

```tsx
// app/layout.tsx or app/providers.tsx
import { AuthProvider } from '@/lib/contexts/auth-context';
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3. API Endpoints Required

The component expects these API endpoints to be available:

- `GET /api/tickets/:id` - Fetch ticket details
- `PUT /api/tickets/:id` - Update ticket (status, priority)
- `GET /api/auth/me` - Get current user info

## Component Props

### TicketDetail

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| ticketId | string | Yes | The ID of the ticket to display |
| onClose | () => void | No | Callback when close button is clicked |

### TicketStatusBadge

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| status | TicketStatus | Yes | The ticket status to display |
| className | string | No | Additional CSS classes |

### PriorityBadge

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| priority | TicketPriority | Yes | The ticket priority to display |
| className | string | No | Additional CSS classes |
| showIcon | boolean | No | Whether to show the priority icon (default: true) |

### SLACountdownTimer

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| slaDueAt | Date \| string \| null | Yes | The SLA due date |
| status | TicketStatus | Yes | The ticket status |
| className | string | No | Additional CSS classes |
| detailed | boolean | No | Show detailed format (default: false) |

## Customization

### Styling

All components use Tailwind CSS and can be customized via className prop:

```tsx
<TicketDetail ticketId="123" />

// Custom styling for badges
<TicketStatusBadge status="OPEN" className="text-lg" />
<PriorityBadge priority="HIGH" className="font-bold" />
```

### Extending Functionality

To add custom actions or sections:

```tsx
// Create a wrapper component
function CustomTicketDetail({ ticketId }) {
  return (
    <div>
      <TicketDetail ticketId={ticketId} />
      
      {/* Add custom sections */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Custom Section</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Your custom content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"

**Solution**: Wrap your app with AuthProvider:

```tsx
import { AuthProvider } from '@/lib/contexts/auth-context';

<AuthProvider>
  <YourApp />
</AuthProvider>
```

### Issue: Toast notifications not showing

**Solution**: Add Toaster component to your layout:

```tsx
import { Toaster } from '@/components/ui/sonner';

<body>
  {children}
  <Toaster />
</body>
```

### Issue: SLA timer not updating

**Solution**: Ensure the component is client-side rendered:

```tsx
'use client'; // Add this at the top of your file
```

### Issue: Permission checks not working

**Solution**: Verify user role is correctly set in AuthContext:

```tsx
// Check in browser console
const { user, role } = useAuth();
console.log('User:', user, 'Role:', role);
```

## Performance Optimization

### 1. Disable Polling When Not Needed

```tsx
// In useTicket hook call
const { ticket } = useTicket(ticketId, {
  enablePolling: false, // Disable if real-time updates not needed
});
```

### 2. Lazy Load in Modals

```tsx
import dynamic from 'next/dynamic';

const TicketDetail = dynamic(() => 
  import('@/components/ticket-detail').then(mod => mod.TicketDetail),
  { loading: () => <Skeleton /> }
);
```

### 3. Memoize Callbacks

```tsx
const handleClose = useCallback(() => {
  setSelectedTicketId(null);
}, []);
```

## Testing

### Unit Testing Example

```tsx
import { render, screen } from '@testing-library/react';
import { TicketDetail } from '@/components/ticket-detail';

// Mock the hooks
jest.mock('@/lib/hooks/use-ticket');
jest.mock('@/lib/hooks/use-permissions');

test('renders ticket details', () => {
  render(<TicketDetail ticketId="123" />);
  expect(screen.getByText(/Ticket Information/i)).toBeInTheDocument();
});
```

### Integration Testing

```tsx
// Test with real API calls
test('updates ticket status', async () => {
  const { user } = render(<TicketDetail ticketId="123" />);
  
  // Wait for data to load
  await screen.findByText(/Ticket Information/i);
  
  // Click status dropdown
  await user.click(screen.getByRole('combobox', { name: /status/i }));
  
  // Select new status
  await user.click(screen.getByText('In Progress'));
  
  // Verify toast notification
  expect(await screen.findByText(/updated successfully/i)).toBeInTheDocument();
});
```

## Best Practices

1. **Always handle loading states**: The component provides built-in loading skeletons
2. **Use error boundaries**: Wrap in error boundary for production
3. **Respect RBAC**: The component handles permissions, but verify backend enforcement
4. **Monitor performance**: Use React DevTools to check re-renders
5. **Test with different roles**: Verify behavior for all user roles

## Support

For issues or questions:
1. Check the README: `components/ticket-detail-README.md`
2. Review examples: `components/ticket-detail-example.tsx`
3. Check implementation summary: `components/TASK-5-IMPLEMENTATION-SUMMARY.md`

## Related Components

- `TicketList` - Display list of tickets (Task 4)
- `TicketCreateForm` - Create new tickets (Task 6)
- `CommentList` - Display ticket comments (Task 8)
- `AttachmentList` - Manage ticket attachments (Task 7)
- `FollowerManager` - Manage ticket followers (Task 9)
