# Kanban Board Data Fetching - Debugging Guide

## Issue
The Kanban board in Team Management is not fetching or displaying ticket data.

## Debugging Additions

### 1. Enhanced Console Logging
Added detailed console logs to track the data fetching process:

```typescript
console.log('Fetching tickets for team:', team.id, team.name);
console.log('Response status:', response.status);
console.log('Received data:', data);
console.log('Tickets count:', data.tickets?.length || 0);
```

### 2. Better Error Handling
Improved error messages to show more details:

```typescript
const errorData = await response.json().catch(() => ({}));
console.error('API error:', errorData);
throw new Error(errorData.message || `Failed to fetch team tickets (${response.status})`);
```

### 3. Empty State Messages
Added visual indicators when no tickets are found:
- "No tickets" message in each column
- Warning message in header when no tickets are loaded

## How to Debug

### Step 1: Open Browser Console
1. Open the Team Management page
2. Click on a team to open the Kanban board
3. Open browser DevTools (F12)
4. Go to Console tab

### Step 2: Check Console Logs
Look for these log messages:

```
Fetching tickets for team: <team-id> <team-name>
Response status: 200
Received data: { tickets: [...], total: X, page: 1, limit: 1000 }
Tickets count: X
```

### Step 3: Identify the Issue

#### Scenario 1: No Console Logs
**Problem**: Component not mounting or function not being called
**Solution**: Check if `useEffect` is running, verify team prop is passed correctly

#### Scenario 2: Response Status 401/403
**Problem**: Authentication or permission issue
**Solution**: 
- Check if user is logged in
- Verify user has permission to view tickets
- Check RBAC configuration

#### Scenario 3: Response Status 500
**Problem**: Server error
**Solution**:
- Check server logs
- Verify database connection
- Check ticket service implementation

#### Scenario 4: Response Status 200 but tickets: []
**Problem**: No tickets match the filter criteria
**Possible Causes**:
- Team has no tickets assigned
- `teamId` filter is not working correctly in API
- Tickets exist but don't have `teamId` set

#### Scenario 5: Data received but not displaying
**Problem**: UI rendering issue
**Solution**:
- Check if tickets are in correct format
- Verify status values match expected enum
- Check if `getTicketsByStatus` function works correctly

## API Endpoint Details

### Request
```
GET /api/tickets?teamId={team.id}&limit=1000
```

### Expected Response
```json
{
  "tickets": [
    {
      "id": "string",
      "ticketNumber": 123,
      "title": "string",
      "status": "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CUSTOMER" | "RESOLVED" | "CLOSED",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      "customer": { "name": "string" } | null,
      "assignedUser": { "name": "string" } | null,
      "createdAt": "date",
      "slaDueAt": "date" | null
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 1000
}
```

## Common Issues and Solutions

### Issue 1: teamId Filter Not Working
**Symptom**: API returns all tickets instead of team-specific tickets
**Solution**: Check if `ticketService.listTickets` properly handles `teamId` filter

**Verify in ticket service:**
```typescript
if (filters.teamId) {
  where.teamId = filters.teamId;
}
```

### Issue 2: Tickets Don't Have teamId
**Symptom**: Tickets exist but none are returned for the team
**Solution**: Check database - tickets might not have `teamId` field populated

**SQL Query to check:**
```sql
SELECT id, ticketNumber, title, teamId FROM Ticket WHERE teamId IS NOT NULL;
```

### Issue 3: Permission Denied
**Symptom**: 403 error in console
**Solution**: User doesn't have permission to view team tickets

**Check:**
- User's role and permissions
- Team membership
- RBAC configuration for ticket access

### Issue 4: Wrong Status Values
**Symptom**: Tickets load but don't appear in columns
**Solution**: Status values in database don't match enum values

**Verify status values:**
```typescript
const statusColumns = [
  { key: 'OPEN', label: 'New' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'WAITING_FOR_CUSTOMER', label: 'On Hold' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
];
```

## Testing Checklist

- [ ] Console shows "Fetching tickets for team" message
- [ ] Response status is 200
- [ ] Data object is logged with tickets array
- [ ] Tickets count matches expected number
- [ ] Tickets appear in correct status columns
- [ ] Ticket cards show all information (number, title, customer, priority, assignee)
- [ ] Clicking ticket card navigates to detail page
- [ ] Empty columns show "No tickets" message
- [ ] Error states display properly

## Next Steps

1. **Check Console Logs**: Open browser console and look for the debug messages
2. **Verify API Response**: Check Network tab to see actual API response
3. **Check Database**: Verify tickets have correct `teamId` values
4. **Test with Different Teams**: Try teams with known tickets
5. **Check Permissions**: Verify user has access to view team tickets

## Temporary Workaround

If teamId filtering doesn't work, you can temporarily show all tickets:
```typescript
const response = await fetch(`/api/tickets?limit=1000`, {
  credentials: 'include',
});
```

Then filter client-side:
```typescript
const teamTickets = data.tickets.filter(t => t.teamId === team.id);
setTickets(teamTickets);
```

## Remove Debug Logs

Once issue is resolved, remove console.log statements:
```typescript
// Remove these lines:
console.log('Fetching tickets for team:', team.id, team.name);
console.log('Response status:', response.status);
console.log('Received data:', data);
console.log('Tickets count:', data.tickets?.length || 0);
```
