# Session Management Guide

## Problem
Users were experiencing session persistence issues where logging out and logging in as a different user would still show the previous user's data.

## Solution Implemented

### 1. Enhanced Logout Process
The logout function now:
- Calls the logout API endpoint
- Clears user state in React context
- Clears localStorage cache
- Clears sessionStorage
- Forces redirect to login page
- Forces page reload to ensure clean state

### 2. Enhanced Login Process
The login function now:
- Clears any existing cached session data BEFORE attempting login
- Resets user state
- Fetches fresh user data after successful login

### 3. Session Cookie Management
- Session cookies are httpOnly and secure
- Cookies are properly cleared on logout
- Middleware validates session tokens on protected routes

## Best Practices for Users

### When Switching Accounts:
1. **Always use the Logout button** - Don't just close the browser
2. **Wait for redirect** - Let the logout complete before logging in again
3. **Use different browsers/profiles** - For testing multiple accounts simultaneously

### For Development/Testing:
1. **Use Incognito/Private Windows** - Each window has isolated sessions
2. **Use Browser Profiles** - Chrome/Edge allow multiple profiles
3. **Clear Site Data** - DevTools → Application → Clear Storage (if issues persist)

## Technical Details

### Session Flow:
```
Login → Create Session Cookie → Cache User Data → Use Application
Logout → Clear Cookie → Clear Cache → Clear State → Redirect → Reload
```

### Cache Strategy:
- User data cached for 5 minutes in localStorage
- Cache validated in background after 30 seconds
- Cache cleared on logout and before new login

### Cookie Settings:
- httpOnly: true (prevents JavaScript access)
- secure: true (in production)
- sameSite: 'lax'
- maxAge: 24 hours
- path: '/'

## Troubleshooting

### If you still see wrong user after logout:

**Option 1: Hard Refresh**
- Windows/Linux: Ctrl + Shift + R
- Mac: Cmd + Shift + R

**Option 2: Clear Browser Data**
1. Open DevTools (F12)
2. Application tab → Storage
3. Click "Clear site data"
4. Refresh page

**Option 3: Use Incognito Mode**
- Chrome: Ctrl + Shift + N
- Firefox: Ctrl + Shift + P
- Edge: Ctrl + Shift + N

### For Developers:

**Check Session Cookie:**
```javascript
// In browser console
document.cookie
```

**Check Cached User:**
```javascript
// In browser console
localStorage.getItem('cached_user_session')
```

**Force Clear Everything:**
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
window.location.href = '/login';
```

## API Endpoints

### Login: POST /api/auth/login
- Creates session cookie
- Returns user data

### Logout: POST /api/auth/logout
- Invalidates session in database
- Clears session cookie

### Get Current User: GET /api/auth/me
- Validates session cookie
- Returns current user data

## Security Considerations

1. **Session Tokens** - Stored in httpOnly cookies (not accessible via JavaScript)
2. **Session Expiry** - 24 hours by default
3. **Logout Invalidation** - Sessions are invalidated in database on logout
4. **CSRF Protection** - sameSite cookie attribute prevents CSRF attacks

## Future Improvements

1. **Session Refresh** - Implement automatic session refresh before expiry
2. **Multi-Device Logout** - Add ability to logout from all devices
3. **Session Activity Tracking** - Track last activity time
4. **Concurrent Session Limits** - Limit number of active sessions per user
