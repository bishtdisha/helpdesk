# Kanban Board - No Tickets Showing Debug Guide

## Issue
Tickets are assigned to "Customer Care" team in the ticket list, but the Kanban board shows "0 tickets" for that team.

## Possible Causes

### 1. Team ID Mismatch
**Problem**: Tickets might have team names instead of team IDs
**Check**: Look at console logs for:
```
Tickets for this team (by name): X
Tickets for this team (by ID): 0
```
If name count > 0 but ID count = 0, this is the issue.

### 2. Team Field Not Populated
**Problem**: Tickets don't have `teamId` field set
**Check**: Console log shows:
```
Ticket teamIds: [{ id: "...", teamId: null, team: null }]
```

### 3. Permission/Filter Issue
**Problem**: API is filtering out tickets based on user permissions
**Check**: Console shows tickets in "ALL TICKETS" but not in filtered response

### 4. Wrong Team ID
**Problem**: Team ID in URL doesn't match actual team ID in database
**Check**: Compare team ID in URL with team ID in console logs

## Debug Steps

### Step 1: Open Browser Console
1. Navigate to Customer Care team board
2. Open DevTools (F12)
3. Go to Console tab

### Step 2: Check Console Logs
Look for these log sections:

#### Team Info:
```
=== FETCHING TEAM TICKETS ===
Team ID: clx123abc456
Team Name: Customer Care
API URL: /api/tickets?teamId=clx123abc456&limit=1000
```

#### API Response:
```
=== API RESPONSE ===
Total tickets received: 0
```

#### All Tickets Debug:
```
=== ALL TICKETS (for debugging) ===
Total tickets in system: 5
Tickets with team info: 2
Team names in system: ["Customer Care", "Development Team", "Project Time Square"]
Tickets for this team (by name): 2
Tickets for this team (by ID): 0
```

### Step 3: Identify the Issue

#### Scenario A: Name vs ID Mismatch
```
Tickets for this team (by name): 2  ← Has tickets by name
Tickets for this team (by ID): 0    ← No tickets by ID
```
**Solution**: Tickets have team names but not team IDs. Need to update tickets in database.

#### Scenario B: No Team Assignment
```
Total tickets in system: 5
Tickets with team info: 0
```
**Solution**: Tickets don't have team field populated at all.

#### Scenario C: Wrong Team ID
```
Team ID: clx123abc456
Tickets for this team (by ID): 0
Tickets for this team (by name): 0
```
**Solution**: Team ID might be wrong, or tickets are assigned to different team.

## Solutions

### Solution 1: Update Tickets with Team IDs

If tickets have team names but not IDs, run this SQL:

```sql
-- First, check current state
SELECT id, ticketNumber, title, teamId, 
  (SELECT name FROM Team WHERE id = Ticket.teamId) as teamName
FROM Ticket;

-- Update tickets to use team IDs
UPDATE Ticket 
SET teamId = (SELECT id FROM Team WHERE name = 'Customer Care')
WHERE teamId IS NULL 
  AND EXISTS (SELECT 1 FROM Team WHERE name = 'Customer Care');
```

### Solution 2: Check Team ID in Database

```sql
-- Get team ID for Customer Care
SELECT id, name FROM Team WHERE name = 'Customer Care';

-- Check tickets for that team
SELECT id, ticketNumber, title, teamId 
FROM Ticket 
WHERE teamId = '<team-id-from-above>';
```

### Solution 3: Temporary Client-Side Filter

If you need immediate fix, modify the Kanban board to filter by team name:

```typescript
// In fetchTeamTickets, after getting all tickets:
const filteredTickets = allTicketsData.tickets.filter(
  (t: any) => t.team?.name === team.name || t.teamId === team.id
);
setTickets(filteredTickets);
```

### Solution 4: Update Ticket Service

If the issue is in the API, check `lib/services/ticket-service.ts`:

```typescript
// Make sure teamId filter is applied correctly
if (filters.teamId) {
  where.AND!.push({ teamId: filters.teamId });
}
```

## Verification

After applying fix, verify:

1. **Console Logs Show Tickets**:
```
Total tickets received: 2
```

2. **Kanban Board Shows Tickets**:
- Tickets appear in correct status columns
- Ticket cards show all information

3. **Database Query Returns Tickets**:
```sql
SELECT COUNT(*) FROM Ticket WHERE teamId = '<team-id>';
-- Should return > 0
```

## Common Database Issues

### Issue: Team Names vs IDs
Many tickets might have been created with team names in a text field instead of proper foreign key relationships.

**Check**:
```sql
-- See if there's a team name field
DESCRIBE Ticket;

-- Check for any text-based team fields
SELECT * FROM Ticket LIMIT 1;
```

### Issue: Null Team IDs
Tickets exist but `teamId` is NULL.

**Fix**:
```sql
-- Count tickets without team
SELECT COUNT(*) FROM Ticket WHERE teamId IS NULL;

-- Assign to default team
UPDATE Ticket 
SET teamId = (SELECT id FROM Team WHERE name = 'Customer Care')
WHERE teamId IS NULL;
```

### Issue: Orphaned Tickets
Tickets reference team IDs that don't exist.

**Check**:
```sql
-- Find orphaned tickets
SELECT t.id, t.ticketNumber, t.teamId 
FROM Ticket t
LEFT JOIN Team tm ON t.teamId = tm.id
WHERE t.teamId IS NOT NULL AND tm.id IS NULL;
```

## Next Steps

1. **Check Console Logs**: Open browser console and look for debug output
2. **Identify Issue**: Use logs to determine which scenario applies
3. **Apply Solution**: Follow appropriate solution from above
4. **Verify Fix**: Confirm tickets appear in Kanban board
5. **Remove Debug Code**: Once fixed, remove console.log statements

## Remove Debug Code

After fixing, remove these debug logs from `team-kanban-board.tsx`:

```typescript
// Remove all console.log statements
// Remove the "ALL TICKETS" fetch
// Keep only essential error logging
```
