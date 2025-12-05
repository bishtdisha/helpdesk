# How to Use New User Form Features

## Where to Find the Features

### Step 1: Open User Management
- Navigate to **User Management** page
- You'll see the list of users

### Step 2: Click "Add User" Button
- Look for the **"Add User"** button (top right)
- Click it to open the user creation form

### Step 3: The Form Now Has These Features

```
┌─────────────────────────────────────────┐
│  Add New User                    [X]    │
├─────────────────────────────────────────┤
│                                         │
│  Full Name *                            │
│  ┌─────────────────────────────────┐   │
│  │ Ujjal Johnson                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Email *                                │
│  ┌─────────────────────────────────┐   │
│  │ ujjal.johnson@example.com       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Password *                             │
│  ┌─────────────────────────────┬───┐   │
│  │ ••••••••                    │👁️ │ ← Click to show/hide
│  └─────────────────────────────┴───┘   │
│  Password must be at least 8 characters │
│                                         │
│  Confirm Password *                     │
│  ┌─────────────────────────────┬───┐   │
│  │ ••••••••                    │👁️ │ ← Click to show/hide
│  └─────────────────────────────┴───┘   │
│                                         │
│  Role *                                 │
│  ┌─────────────────────────────────┐   │
│  │ Employee                    ▼   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Team                                   │
│  ┌─────────────────────────────────┐   │
│  │ Select a team (optional)    ▼   │ ← NEW! Team selection
│  └─────────────────────────────────┘   │
│                                         │
│  [✓] Active user                       │
│                                         │
│  ┌─────────┐  ┌──────────────────┐    │
│  │ Cancel  │  │  Create User     │    │
│  └─────────┘  └──────────────────┘    │
└─────────────────────────────────────────┘
```

## Feature Details

### 1. Password Visibility Toggle 👁️

**Location**: Right side of password field

**How to use:**
1. Type your password (shows as ••••••••)
2. Click the eye icon (👁️) on the right
3. Password becomes visible
4. Click again to hide it

**Benefits:**
- Verify you typed correctly
- Avoid typos
- See what you're entering

### 2. Confirm Password Field

**Location**: Below the password field

**How to use:**
1. Enter password in first field
2. Re-enter same password in confirm field
3. If they don't match, you'll see an error
4. Both must match to create user

**Validation:**
- Shows error if passwords don't match
- Required when creating new user
- Has its own show/hide toggle

### 3. Team Selection Dropdown

**Location**: Below the Role field

**How to use:**
1. Click the dropdown
2. See list of all teams
3. Select a team (or leave as "No team")
4. Team is assigned to the user

**Options:**
- No team (default)
- All available teams in your organization
- Optional field (not required)

## Testing the Features

### Test Password Visibility:
1. Click "Add User"
2. Type password in Password field
3. Click eye icon → See password
4. Click again → Hide password
5. Do the same for Confirm Password field

### Test Password Matching:
1. Enter password: "MyPassword123"
2. Enter confirm: "MyPassword456" (different)
3. See error: "Passwords do not match"
4. Fix confirm password to match
5. Error disappears

### Test Team Selection:
1. Click Team dropdown
2. See list of teams
3. Select "Project Time Square"
4. Create user
5. User is assigned to that team

## Common Scenarios

### Creating a New User:
1. Click "Add User"
2. Fill in name and email
3. Enter password (min 8 characters)
4. Click eye to verify password
5. Re-enter in confirm password
6. Select role
7. Select team (optional)
8. Click "Create User"

### Password Requirements:
- Minimum 8 characters
- Must match confirmation
- Can contain letters, numbers, symbols
- Case-sensitive

### Team Assignment:
- Optional (can be left empty)
- Can select any available team
- Can be changed later
- Admin/Team Leader can assign

## Troubleshooting

### "Passwords do not match" error:
- Check both fields carefully
- Use eye icon to see what you typed
- Make sure they're exactly the same
- Case-sensitive

### "Password must be at least 8 characters":
- Count the characters
- Add more characters
- Use eye icon to verify length

### Team dropdown is empty:
- No teams created yet
- Create teams first in Team Management
- Or leave as "No team"

## Summary

All features are **already working** in the User Management form:

✅ **Password visibility toggle** - Eye icon on password fields  
✅ **Confirm password** - Separate field with validation  
✅ **Team selection** - Dropdown to assign team  

Just click **"Add User"** button and you'll see all these features in the form!
