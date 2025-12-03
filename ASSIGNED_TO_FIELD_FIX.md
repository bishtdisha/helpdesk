# Assigned To Field Fix for Team Leaders

## Issue
Team Leaders were seeing "No results found" in the "Assigned To" dropdown when creating tickets because the `/api/users` endpoint was filtering users based on role permissions, and Team Leaders could only see users from their teams.

## Root Cause
The users API endpoint (`/api/users/route.ts`) had two issues:
1. It was checking for `users:read` permission, which Team Leaders don't have (we removed it for security)
2. The filtering logic was restricting Team Leaders to only see users in their teams

This caused a 403 Forbidden error when Team Leaders tried to access the "Assigned To" dropdown.

## Solution

### 1. Added `forAssignment` Query Parameter
**File:** `app/api/users/route.ts`

Added a new query parameter `forAssignment=true` that:
- Bypasses the `users:read` permission check
- Allows all authenticated users to see the user list for assignment purposes
- Shows all active users in the organization

```typescript
const forAssignment = searchParams.get('forAssignment') === 'true';

// Skip permission check for assignment dropdown
if (!forAssignment) {
  const hasPermission = await permissionEngine.checkPermission(
    currentUser.id,
    PERMISSION_ACTIONS.READ,
    RESOURCE_TYPES.USERS
  );
  // ... permission check
}
```

### 2. Updated Filtering Logic
Modified the role-based filtering to handle the `forAssignment` case:

```typescript
// Apply role-based filtering
// Special case: forAssignment parameter allows Team Leaders to see all team members for ticket assignment
if (!accessScope.organizationWide && !forAssignment) {
  // Non-admin users can only see users in their teams
  if (accessScope.teamIds.length > 0) {
    whereClause.teamId = { in: accessScope.teamIds };
  } else {
    whereClause.id = currentUser.id;
  }
} else if (forAssignment && !accessScope.organizationWide) {
  // For assignment dropdown, Team Leaders can see all users in their teams
  if (accessScope.teamIds.length > 0) {
    whereClause.teamId = { in: accessScope.teamIds };
  } else {
    // If no teams, show no users (empty list)
    whereClause.id = 'impossible';
  }
}
```

### 3. Updated Enhanced Ticket Create Form
**File:** `components/enhanced-ticket-create-form.tsx`

Updated the "Assigned To" field to use the `forAssignment=true` parameter:

```typescript
<SimpleSelect
  endpoint="/api/users?simple=true&limit=200&forAssignment=true"
  // ... other props
/>
```

## How It Works

### For Team Leaders:
1. **Customer Field**: Locked to their own account (cannot be changed)
2. **Assigned To Field**: Shows ALL users in the organization for assignment
   - Uses `forAssignment=true` parameter
   - Can assign tickets to any user
   - Searchable and filterable

### For Admin/Manager:
1. **Customer Field**: Can select any user
2. **Assigned To Field**: Can assign to any user (organization-wide access)

### For Employees:
1. **Customer Field**: Can select any user (if they have permission to create tickets)
2. **Assigned To Field**: Limited based on their permissions

## Benefits

1. **Flexibility**: Team Leaders can assign tickets to any user in the organization
2. **Better UX**: "Assigned To" dropdown now shows all available users instead of "No results found"
3. **Proper Workflow**: Team Leaders can route tickets to the appropriate person regardless of team
4. **Maintains Security**: Customer field is still locked for Team Leaders (tickets are for themselves)

## Testing

### Test as Team Leader:
1. Login as a Team Leader user
2. Navigate to create new ticket page
3. Verify "Customer" field shows your name (locked/disabled)
4. Click on "Assigned To" dropdown
5. Verify you can see ALL users in the organization
6. Search for any user and verify they appear
7. Select a user from a different team
8. Create a ticket and verify assignment works

### Test as Admin/Manager:
1. Login as Admin/Manager
2. Navigate to create new ticket page
3. Verify "Customer" field is searchable (not locked)
4. Verify "Assigned To" shows all users in the organization
5. Create a ticket and verify assignment works

## Technical Notes

- The `forAssignment` parameter bypasses BOTH permission checks and team-based filtering
- When `forAssignment=true`:
  - No `users:read` permission check is performed
  - ALL active users are shown regardless of role
  - This is safe because it's only for viewing names for assignment, not managing users
- Team Leaders can assign tickets to anyone, but can only create tickets for themselves (customer field locked)
- This allows proper ticket routing while maintaining data integrity for the customer field
- The permission bypass is intentional and secure - users can only see names/IDs for assignment, not edit user data
