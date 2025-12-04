# User Management Visibility Fix for Admin

## Issue
User Management module was not appearing in the navigation menu for Admin/Manager users.

## Root Cause
The User Management menu item in `components/rbac/role-based-navigation.tsx` was missing the `action` and `resource` properties. 

When these properties are not provided, the `PermissionGate` component uses default values (`'read'` and `'default'`), which don't match the actual RBAC permissions defined in the system.

## Solution

### Updated Menu Item Configuration
**File:** `components/rbac/role-based-navigation.tsx`

**Before:**
```typescript
{
  id: "users", 
  label: "User Management", 
  icon: UserCog,
  requireRole: ROLE_TYPES.ADMIN_MANAGER
}
```

**After:**
```typescript
{
  id: "users", 
  label: "User Management", 
  icon: UserCog,
  action: PERMISSION_ACTIONS.READ,
  resource: RESOURCE_TYPES.USERS,
  requireRole: ROLE_TYPES.ADMIN_MANAGER
}
```

### Why This Works

1. **PermissionGate Validation**: The `PermissionGate` component checks if the user has the specified permission
2. **Matching Permissions**: Admin/Manager role has `users:read` permission defined in `lib/rbac/permissions.ts`
3. **Double Check**: Both `requireRole` and permission check must pass for the menu item to show

## Verification

### Admin/Manager Permissions
From `lib/rbac/permissions.ts`:
```typescript
'Admin/Manager': [
  { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.USERS, scope: PERMISSION_SCOPES.ORGANIZATION },
  // ... other permissions
]
```

### Menu Item Rendering Logic
1. Check if user is authenticated
2. Check if user role matches `requireRole` (Admin/Manager)
3. Check if user has `users:read` permission via `PermissionGate`
4. If all checks pass, show menu item

## Testing

### For Admin/Manager:
- ✅ "User Management" menu item should now be visible
- ✅ Clicking it should navigate to `/helpdesk/users`
- ✅ User Management page should load successfully

### For Team Leader:
- ❌ "User Management" menu item should NOT be visible
- ❌ Direct access to `/helpdesk/users` should be blocked

### For Employee:
- ❌ "User Management" menu item should NOT be visible
- ❌ Direct access to `/helpdesk/users` should be blocked

## Related Files

- `components/rbac/role-based-navigation.tsx` - Navigation menu configuration
- `lib/rbac/permissions.ts` - RBAC permission definitions
- `components/rbac/permission-gate.tsx` - Permission validation component
- `components/user-management/user-management-page.tsx` - User management page

## Notes

- This fix ensures proper permission checking at the UI level
- API-level permissions are still enforced separately
- The `requireRole` check is an additional layer of security
- Both checks (role and permission) must pass for access
