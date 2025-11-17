# Ticket Creation Form Implementation

## Overview

This document describes the implementation of Task 6: "Build ticket creation form" from the ticket system frontend integration spec.

## Components Implemented

### 1. TicketCreateForm (`components/ticket-create-form.tsx`)

A comprehensive form component for creating new support tickets with full validation and error handling.

**Features:**
- React Hook Form integration for form state management
- Zod schema validation for all fields
- Real-time validation with inline error messages
- Loading states during submission
- Success/error toast notifications
- Automatic redirect to ticket detail page after creation
- Verification of API response (ticket ID confirmation)

**Form Fields:**
- **Title** (required): Max 200 characters, trimmed
- **Description** (required): Multi-line text area, trimmed
- **Priority** (required): Dropdown with LOW, MEDIUM, HIGH, URGENT options
- **Category** (optional): Max 100 characters
- **Customer** (required): Searchable customer selector with UUID validation

**Validation Rules:**
- Title: Required, 1-200 characters
- Description: Required, minimum 1 character
- Priority: Required, must be valid enum value
- Category: Optional, max 100 characters
- Customer ID: Required, must be valid UUID

### 2. CustomerSelector (`components/customer-selector.tsx`)

A searchable dropdown component for selecting customers with autocomplete functionality.

**Features:**
- Real-time search with debouncing
- Displays customer name, email, and company
- Fetches customers from `/api/customers` endpoint
- Loads selected customer details on mount
- Handles "customer not found" scenarios
- Accessible keyboard navigation
- Loading states

**API Integration:**
- GET `/api/customers?search={query}&limit=20` - Search customers
- GET `/api/customers/{id}` - Get customer details

### 3. Customer API Endpoints

#### GET `/api/customers`
Lists customers with optional search functionality.

**Query Parameters:**
- `search`: Search by name, email, or company (case-insensitive)
- `limit`: Number of results (default: 10, max: 50)

**Response:**
```json
{
  "customers": [
    {
      "id": "uuid",
      "name": "Customer Name",
      "email": "customer@example.com",
      "company": "Company Name"
    }
  ],
  "count": 10
}
```

#### GET `/api/customers/:id`
Retrieves a single customer by ID.

**Response:**
```json
{
  "customer": {
    "id": "uuid",
    "name": "Customer Name",
    "email": "customer@example.com",
    "company": "Company Name"
  }
}
```

### 4. UI Components Created

#### Command Component (`components/ui/command.tsx`)
A command palette component built on top of `cmdk` for searchable lists.

**Exports:**
- `Command` - Main container
- `CommandInput` - Search input
- `CommandList` - Scrollable list container
- `CommandEmpty` - Empty state
- `CommandGroup` - Group of items
- `CommandItem` - Individual item
- `CommandSeparator` - Visual separator

#### Popover Component (`components/ui/popover.tsx`)
A popover component built on Radix UI for floating content.

**Exports:**
- `Popover` - Root component
- `PopoverTrigger` - Trigger button
- `PopoverContent` - Content container

## Requirements Fulfilled

### Requirement 3.1: Ticket Creation
✅ Form submits POST request to `/api/tickets`
✅ Validates form inputs before submission
✅ Displays success message on creation
✅ Refreshes ticket list after creation
✅ Displays RBAC error messages from API

### Requirement 3.2: Form Validation
✅ Title validation (required, max 200 characters)
✅ Description validation (required)
✅ Priority validation (required, valid enum)
✅ Customer ID validation (required, valid UUID)
✅ Inline validation error display

### Requirement 3.3: API Integration
✅ POST request to `/api/tickets` with proper data structure
✅ Handles authentication errors (401)
✅ Handles permission errors (403)
✅ Handles validation errors (400)
✅ Handles server errors (500)

### Requirement 3.4: Success Handling
✅ Displays success toast notification
✅ Redirects to ticket detail page
✅ Resets form after successful submission
✅ Triggers ticket list refresh via SWR cache invalidation

### Requirement 3.5: Error Handling
✅ Displays validation errors inline
✅ Shows error toast on submission failure
✅ Prevents UI updates until data is confirmed saved
✅ Handles network errors gracefully

### Requirement 46.1: Data Persistence Verification
✅ Verifies API response contains valid ticket ID
✅ Throws error if ticket ID not returned
✅ Only proceeds with success actions after confirmation

### Requirement 57.1: Customer Data Linking
✅ Validates customer ID before submission
✅ Verifies customer exists via search/select
✅ Displays customer information in selector

### Requirement 57.5: Customer Validation
✅ Validates customer existence before allowing ticket creation
✅ Handles "customer not found" scenarios
✅ Provides user-friendly error messages

## Usage

### Basic Usage

```tsx
import { TicketCreateForm } from '@/components/ticket-create-form';

export default function NewTicketPage() {
  return <TicketCreateForm />;
}
```

### With Callbacks

```tsx
import { TicketCreateForm } from '@/components/ticket-create-form';
import { useRouter } from 'next/navigation';

export default function NewTicketPage() {
  const router = useRouter();

  return (
    <TicketCreateForm
      onSuccess={(ticketId) => {
        console.log('Ticket created:', ticketId);
        router.push(`/tickets/${ticketId}`);
      }}
      onCancel={() => {
        router.back();
      }}
    />
  );
}
```

### Standalone Customer Selector

```tsx
import { CustomerSelector } from '@/components/customer-selector';
import { useState } from 'react';

export default function Example() {
  const [customerId, setCustomerId] = useState('');

  return (
    <CustomerSelector
      value={customerId}
      onValueChange={setCustomerId}
    />
  );
}
```

## Testing

### Manual Testing Checklist

- [ ] Form displays all required fields
- [ ] Validation errors show for empty required fields
- [ ] Title validation enforces 200 character limit
- [ ] Priority dropdown shows all options
- [ ] Customer selector searches and displays results
- [ ] Customer selector shows selected customer details
- [ ] Form submits successfully with valid data
- [ ] Success toast appears after submission
- [ ] Redirects to ticket detail page after creation
- [ ] Error toast appears on submission failure
- [ ] Form is disabled during submission
- [ ] Cancel button works (if provided)

### API Testing

Test the customer endpoints:

```bash
# Search customers
curl -X GET "http://localhost:3000/api/customers?search=john&limit=10" \
  -H "Cookie: session=your-session-token"

# Get customer by ID
curl -X GET "http://localhost:3000/api/customers/{customer-id}" \
  -H "Cookie: session=your-session-token"
```

Test ticket creation:

```bash
curl -X POST "http://localhost:3000/api/tickets" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your-session-token" \
  -d '{
    "title": "Test Ticket",
    "description": "This is a test ticket",
    "priority": "MEDIUM",
    "category": "Technical Support",
    "customerId": "customer-uuid-here"
  }'
```

## Dependencies

### Required Packages
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Zod resolver for React Hook Form
- `zod` - Schema validation
- `swr` - Data fetching and caching
- `cmdk` - Command palette component
- `@radix-ui/react-popover` - Popover component
- `@radix-ui/react-dialog` - Dialog component
- `sonner` - Toast notifications
- `lucide-react` - Icons

All dependencies are already installed in the project.

## File Structure

```
components/
├── ticket-create-form.tsx          # Main form component
├── customer-selector.tsx            # Customer search/select component
├── ui/
│   ├── command.tsx                  # Command palette component
│   ├── popover.tsx                  # Popover component
│   ├── form.tsx                     # Form components (existing)
│   ├── input.tsx                    # Input component (existing)
│   ├── textarea.tsx                 # Textarea component (existing)
│   ├── select.tsx                   # Select component (existing)
│   ├── button.tsx                   # Button component (existing)
│   └── card.tsx                     # Card component (existing)

app/
├── api/
│   └── customers/
│       ├── route.ts                 # List customers endpoint
│       └── [id]/
│           └── route.ts             # Get customer by ID endpoint
└── dashboard/
    └── tickets/
        └── new/
            └── page.tsx             # New ticket page

lib/
├── hooks/
│   ├── use-tickets.ts               # Tickets data fetching hook (existing)
│   └── use-ticket-mutations.ts     # Ticket mutations hook (existing)
├── api-client.ts                    # API client (existing)
└── types/
    ├── ticket.ts                    # Ticket types (existing)
    └── api.ts                       # API response types (existing)
```

## Next Steps

The ticket creation form is now complete and ready for integration. The next task in the implementation plan is:

**Task 7: Replace mock data in existing tickets.tsx**
- Remove mock ticket data
- Integrate TicketList component
- Connect to real API endpoints
- Test with different user roles
- Verify RBAC filtering works correctly

## Notes

- The form follows the RBAC principles by relying on backend validation
- All API errors are handled gracefully with user-friendly messages
- The form is fully accessible with keyboard navigation
- The customer selector provides a smooth UX with search functionality
- Form state is properly managed with React Hook Form
- Validation is performed both client-side (Zod) and server-side (API)
