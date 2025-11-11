# Notification UI Components

This directory contains the notification system UI components for the ticket management system.

## Components

### NotificationCenter
**File:** `notification-center.tsx`

A comprehensive notification center component that displays all user notifications with the following features:
- Lists all notifications with pagination
- Groups notifications by time (Today, Yesterday, This Week, Older)
- Filters for all/unread notifications
- Mark individual notifications as read
- Mark all notifications as read
- Click-through to related tickets
- Color-coded notification types with icons
- Displays notification timestamps using relative time

**Usage:**
```tsx
import { NotificationCenter } from '@/components/notifications/notification-center'

<NotificationCenter />
```

### NotificationPreferences
**File:** `notification-preferences.tsx`

A settings component for managing notification preferences with the following features:
- Toggle in-app notifications on/off
- Toggle email notifications on/off
- Event-specific notification settings:
  - Ticket Created
  - Ticket Assigned
  - Status Changed
  - New Comment
  - Ticket Resolved
  - SLA Breach Alert
- Real-time save with success feedback
- Disabled state for event settings when both channels are off

**Usage:**
```tsx
import { NotificationPreferences } from '@/components/notifications/notification-preferences'

<NotificationPreferences />
```

### NotificationBadge
**File:** `notification-badge.tsx`

A header notification badge with dropdown for quick access to recent notifications:
- Shows unread notification count badge
- Displays 5 most recent notifications in dropdown
- Auto-refreshes unread count every 30 seconds
- Mark notifications as read on click
- Quick navigation to ticket from notification
- "View All Notifications" link to full notification center
- Color-coded notification types with icons

**Usage:**
```tsx
import { NotificationBadge } from '@/components/notifications/notification-badge'

<NotificationBadge />
```

## Notification Types

The system supports the following notification types:

- `TICKET_CREATED` - When a new ticket is created
- `TICKET_ASSIGNED` - When a ticket is assigned to someone
- `TICKET_STATUS_CHANGED` - When a ticket status is updated
- `TICKET_COMMENT` - When someone comments on a ticket
- `TICKET_RESOLVED` - When a ticket is marked as resolved
- `SLA_BREACH` - When a ticket breaches its SLA
- `ESCALATION` - When a ticket is escalated

Each type has a unique icon and color scheme for easy identification.

## API Endpoints Used

- `GET /api/notifications` - List notifications with pagination
- `GET /api/notifications/unread-count` - Get unread notification count
- `PUT /api/notifications/:id/read` - Mark a notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `GET /api/notifications/preferences` - Get user notification preferences
- `PUT /api/notifications/preferences` - Update user notification preferences

## Integration

The notification badge has been integrated into the navigation header (`components/navigation-header.tsx`) and appears for all authenticated users.

A dedicated notifications page is available at `/dashboard/notifications` with tabs for:
1. Notifications - Full notification center
2. Preferences - Notification settings

## Dependencies

- `date-fns` - For relative time formatting
- `lucide-react` - For icons
- Radix UI components - For UI primitives (dropdown, switch, tabs, etc.)
