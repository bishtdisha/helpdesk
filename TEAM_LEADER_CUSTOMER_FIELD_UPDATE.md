# Team Leader Customer Field Auto-Population

## Summary
Updated ticket creation forms to automatically populate the customer field with the logged-in user's name when a Team Leader creates a new ticket.

## Changes Made

### 1. Enhanced Ticket Create Form
**File:** `components/enhanced-ticket-create-form.tsx`

#### Changes:
- Added `useAuth` hook to get current user information
- Added logic to detect if user is a Team Leader (`user?.role?.name === 'Team Leader'`)
- Auto-populate `customerId` field with logged-in user's ID for Team Leaders
- Updated placeholder text to show Team Leader's name when applicable
- Added helper text below customer field for Team Leaders: "Defaulted to your account. You can change this if needed."

#### Code Changes:
```typescript
// Import useAuth hook
import { useAuth } from '@/lib/hooks/use-auth';

// Get current user
const { user } = useAuth();

// Determine if user is Team Leader
const isTeamLeader = user?.role?.name === 'Team Leader';

// Auto-populate customer field with logged-in user for Team Leaders
const defaultCustomerId = !isEditMode && isTeamLeader && user?.id ? user.id : '';

// Set default value in form
defaultValues: {
  // ... other fields
  customerId: defaultCustomerId,
}
```

### 2. Regular Ticket Create Form
**File:** `components/ticket-create-form.tsx`

#### Changes:
- Added `useAuth` hook to get current user information
- Added logic to detect if user is a Team Leader
- Auto-populate `customerId` field with logged-in user's ID for Team Leaders
- Updated help text to inform Team Leaders that the field is defaulted to their account

#### Code Changes:
```typescript
// Import useAuth hook
import { useAuth } from '@/lib/hooks/use-auth';

// Get current user
const { user } = useAuth();

// Determine if user is Team Leader
const isTeamLeader = user?.role?.name === 'Team Leader';

// Auto-populate customer field
const defaultCustomerId = isTeamLeader && user?.id ? user.id : '';

// Set default value in form
defaultValues: {
  // ... other fields
  customerId: defaultCustomerId,
}
```

## User Experience

### For Team Leaders:
1. When creating a new ticket, the **Customer** field is automatically filled with their own name
2. The field is **DISABLED** and cannot be changed (shown as read-only with gray background)
3. A helper text appears: "Tickets created by Team Leaders are automatically assigned to your account."
4. This ensures Team Leaders can only create tickets for themselves

### For Admin/Manager and Employees:
- No change in behavior
- Customer field remains empty by default
- They must manually select a customer
- Field is fully editable and searchable

## Benefits

1. **Faster Ticket Creation:** Team Leaders don't need to search for their own name
2. **Better UX:** Reduces friction when Team Leaders create tickets for themselves
3. **Data Integrity:** Prevents Team Leaders from creating tickets for other users
4. **Clear Communication:** Helper text informs users about the restriction
5. **Security:** Enforces role-based restrictions at the UI level

## Testing Recommendations

### Test as Team Leader:
1. Login as a Team Leader user
2. Navigate to create new ticket page
3. Verify the Customer field shows your name
4. Verify the field is DISABLED (gray background, not clickable)
5. Verify you CANNOT change the customer field
6. Verify helper text: "Tickets created by Team Leaders are automatically assigned to your account."
7. Create a ticket and verify it's assigned to your account

### Test as Admin/Manager:
1. Login as Admin/Manager
2. Navigate to create new ticket page
3. Verify the Customer field is empty by default
4. Verify normal customer selection works

### Test as Employee:
1. Login as Employee
2. Navigate to create new ticket page
3. Verify the Customer field is empty by default
4. Verify normal customer selection works

## Technical Notes

- The auto-population only happens for **new tickets**, not when editing existing tickets
- The logic checks for `user?.role?.name === 'Team Leader'` to identify Team Leaders
- For Team Leaders, the customer field is replaced with a disabled Input showing their name
- The field has `disabled={true}` and `className="bg-muted cursor-not-allowed"` for clear visual indication
- Both the enhanced and regular ticket creation forms have been updated for consistency
- The `customerId` is still set in the form data, ensuring the ticket is created with the correct customer
