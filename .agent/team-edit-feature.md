# Team Name Edit Feature

## Overview
Added the ability for administrators to edit team names and descriptions directly from the team management interface.

## Changes Made

### 1. New Component: Edit Team Name Dialog
**File:** `components/team-management/edit-team-name-dialog.tsx`

A new dialog component that allows admins to:
- Edit team name (required field)
- Edit team description (optional field)
- Real-time validation
- Loading states during update
- Success/error notifications

**Features:**
- Form validation (team name required)
- Prevents empty team names
- Shows loading spinner during update
- Toast notifications for success/error
- Resets form on cancel
- Disabled inputs during submission

### 2. Updated Team List Component
**File:** `components/team-management/team-list.tsx`

**Changes:**
- Added Edit button in the Actions column
- Edit button only visible to admins (canEditTeams permission)
- Edit button styled with amber hover effect
- Positioned next to the View button
- Includes tooltip "Edit team"

**UI Layout:**
```
Actions Column:
[Edit Button] [View Button]
```

### 3. Updated Team Management Component
**File:** `components/team-management/team-management.tsx`

**Changes:**
- Added `editTeamName` dialog state
- Imported `EditTeamNameDialog` component
- Updated `handleEditTeam` to open edit dialog instead of full form
- Added dialog to the component tree
- Integrated with refresh mechanism

**Dialog State:**
```typescript
editTeamName: { isOpen: boolean; team?: TeamWithMembers | null }
```

## API Integration

The feature uses the existing API endpoint:
- **Endpoint:** `PUT /api/teams/[id]`
- **Permissions:** Admin only (teams:update)
- **Request Body:**
  ```json
  {
    "name": "Updated Team Name",
    "description": "Updated description"
  }
  ```

**Validation:**
- Team name cannot be empty
- Checks for duplicate team names
- Trims whitespace from inputs

## User Flow

1. Admin navigates to Team Management page
2. Clicks the Edit button (pencil icon) on any team row
3. Edit Team dialog opens with current team data
4. Admin modifies team name and/or description
5. Clicks "Update Team" button
6. System validates and updates the team
7. Success toast notification appears
8. Dialog closes automatically
9. Team list refreshes with updated data

## Permissions

- **Required Role:** Admin/Manager
- **Permission Check:** `canEditTeams` (based on user role)
- **API Permission:** `teams:update`

## UI/UX Features

- Clean, focused dialog for quick edits
- Required field indicator (red asterisk)
- Disabled state during submission
- Loading spinner on submit button
- Cancel button to discard changes
- Form resets on cancel
- Responsive design
- Dark mode support

## Error Handling

- Client-side validation for empty names
- Server-side validation for duplicates
- Toast notifications for errors
- Graceful error messages
- Form remains open on error for correction

## Benefits

1. **Quick Edits:** No need to open full team form
2. **Admin-Only:** Restricted to authorized users
3. **User-Friendly:** Simple, focused interface
4. **Real-Time:** Immediate feedback and updates
5. **Safe:** Validation prevents invalid data
6. **Accessible:** Proper labels and ARIA attributes

## Testing Recommendations

1. Test as Admin user:
   - Edit button should be visible
   - Can successfully update team name
   - Can successfully update description
   - Validation works for empty names
   - Duplicate name detection works

2. Test as non-Admin user:
   - Edit button should not be visible
   - API should reject unauthorized requests

3. Test edge cases:
   - Very long team names
   - Special characters in names
   - Empty description (should be allowed)
   - Concurrent edits by multiple admins

4. Test UI/UX:
   - Dialog opens/closes smoothly
   - Loading states display correctly
   - Toast notifications appear
   - Form resets on cancel
   - Dark mode styling
