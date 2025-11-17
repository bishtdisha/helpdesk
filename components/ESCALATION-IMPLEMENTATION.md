# Escalation Management Implementation

This document describes the implementation of the escalation management feature for the ticket system frontend.

## Overview

The escalation management feature allows Admin_Manager users to create, edit, and manage automated escalation rules that trigger actions based on ticket conditions. It also provides manual escalation evaluation and displays escalation history.

## Components

### 1. EscalationRuleManager
**File:** `components/escalation-rule-manager.tsx`

Main component for displaying and managing escalation rules.

**Features:**
- Fetches escalation rules from GET /api/escalation/rules
- Displays rules in a table with condition type, action type, and status
- Provides create, edit, and delete functionality
- Permission guard for Admin_Manager only

**Props:**
```typescript
interface EscalationRuleManagerProps {
  onCreateClick?: () => void;
  onEditClick?: (rule: EscalationRule) => void;
}
```

**Usage:**
```tsx
<EscalationRuleManager
  onCreateClick={() => setIsFormOpen(true)}
  onEditClick={(rule) => handleEdit(rule)}
/>
```

### 2. EscalationRuleForm
**File:** `components/escalation-rule-form.tsx`

Form component for creating and editing escalation rules.

**Features:**
- React Hook Form with Zod validation
- Dropdowns for condition and action types
- JSON input fields with examples for condition values and action configs
- Validates JSON format before submission
- Verifies API response confirms storage with JSON configuration

**Props:**
```typescript
interface EscalationRuleFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rule?: EscalationRule | null;
}
```

**Condition Types:**
- `sla_breach`: Trigger when SLA is breached or about to breach
- `time_in_status`: Trigger after ticket is in a status for X hours
- `priority_level`: Trigger for specific priority levels
- `no_response`: Trigger when no activity for X hours
- `customer_rating`: Trigger based on customer feedback rating

**Action Types:**
- `notify_manager`: Send notification to team leaders or admins
- `reassign_ticket`: Reassign ticket to a user or team
- `increase_priority`: Automatically increase ticket priority
- `add_follower`: Add users as followers to the ticket
- `send_email`: Send email notification to specified recipients

**Example Condition Values:**
```json
// SLA Breach
{"thresholdHours": 2}

// Time in Status
{"status": "OPEN", "hours": 24}

// Priority Level
{"priorities": ["URGENT", "HIGH"]}

// No Response
{"hours": 48}

// Customer Rating
{"rating": 3, "operator": "less_than"}
```

**Example Action Configs:**
```json
// Notify Manager
{"message": "Ticket requires attention"}

// Reassign Ticket
{"userId": "user-id-here"}

// Increase Priority
{}

// Add Follower
{"userIds": ["user-id-1", "user-id-2"]}

// Send Email
{"recipients": ["user-id-1"], "subject": "Escalation", "message": "Ticket escalated"}
```

**Usage:**
```tsx
<EscalationRuleForm
  open={isFormOpen}
  onClose={() => setIsFormOpen(false)}
  onSuccess={() => refreshRules()}
  rule={selectedRule}
/>
```

### 3. EscalationEvaluateButton
**File:** `components/escalation-evaluate-button.tsx`

Button component for manually evaluating escalation rules on a ticket.

**Features:**
- Sends POST request to /api/escalation/evaluate/:ticketId
- Displays evaluation results in a dialog
- Shows which rules were triggered and their results
- Only visible to Admin_Manager users

**Props:**
```typescript
interface EscalationEvaluateButtonProps {
  ticketId: string;
  onEvaluationComplete?: () => void;
}
```

**Usage:**
```tsx
// Add to ticket detail page
<EscalationEvaluateButton
  ticketId={ticket.id}
  onEvaluationComplete={() => refreshTicket()}
/>
```

### 4. EscalationHistory
**File:** `components/escalation-history.tsx`

Component for displaying escalation history in the ticket activity timeline.

**Features:**
- Fetches ticket history from GET /api/tickets/:id/history
- Filters for escalation-related entries
- Displays rule name, action taken, and timestamp
- Shows success/failure status with visual indicators
- Verifies API response includes escalation actions

**Props:**
```typescript
interface EscalationHistoryProps {
  ticketId: string;
}
```

**Usage:**
```tsx
// Add to ticket detail page
<EscalationHistory ticketId={ticket.id} />
```

### 5. EscalationManagement
**File:** `components/escalation-management.tsx`

Main page component that combines the rule manager and form.

**Features:**
- Manages state for form open/close
- Handles create and edit flows
- Refreshes rule list after changes

**Usage:**
```tsx
// In a page component
import { EscalationManagement } from '@/components/escalation-management';

export default function EscalationPage() {
  return (
    <div className="container mx-auto py-6">
      <EscalationManagement />
    </div>
  );
}
```

## API Integration

### Endpoints Used

1. **GET /api/escalation/rules**
   - Fetches all escalation rules
   - Returns: `{ rules: EscalationRule[] }`

2. **POST /api/escalation/rules**
   - Creates a new escalation rule
   - Body: `CreateEscalationRuleData`
   - Returns: `{ message: string, rule: EscalationRule }`

3. **PUT /api/escalation/rules/:id**
   - Updates an existing escalation rule
   - Body: `UpdateEscalationRuleData`
   - Returns: `{ message: string, rule: EscalationRule }`

4. **DELETE /api/escalation/rules/:id**
   - Deletes an escalation rule
   - Returns: `{ message: string }`

5. **POST /api/escalation/evaluate/:ticketId**
   - Manually evaluates escalation rules for a ticket
   - Returns: `{ message: string, escalationsExecuted: number, results: EscalationResult[] }`

6. **GET /api/tickets/:id/history**
   - Fetches ticket history including escalation events
   - Returns: `{ history: HistoryEntry[] }`

## RBAC Compliance

All escalation management features are restricted to Admin_Manager users only:

- Uses `canManageSLA()` permission check as a proxy for admin access
- Components display "Access Denied" message for non-admin users
- API endpoints enforce server-side RBAC
- Escalation evaluate button only visible to admins
- Escalation history visible to all users who can access the ticket

## Integration with Ticket Detail Page

To add escalation features to the ticket detail page:

```tsx
import { EscalationEvaluateButton } from '@/components/escalation-evaluate-button';
import { EscalationHistory } from '@/components/escalation-history';

export function TicketDetail({ ticketId }: { ticketId: string }) {
  // ... existing code ...

  return (
    <div>
      {/* Existing ticket detail content */}
      
      {/* Add evaluate button to action buttons section */}
      <div className="flex gap-2">
        {/* ... other action buttons ... */}
        <EscalationEvaluateButton
          ticketId={ticketId}
          onEvaluationComplete={() => refresh()}
        />
      </div>

      {/* Add escalation history to activity section */}
      <div className="mt-6">
        <EscalationHistory ticketId={ticketId} />
      </div>
    </div>
  );
}
```

## Testing

### Manual Testing Checklist

1. **Rule Management (Admin_Manager only)**
   - [ ] Create a new escalation rule
   - [ ] Edit an existing rule
   - [ ] Delete a rule
   - [ ] Verify non-admin users see "Access Denied"

2. **Rule Creation Form**
   - [ ] Test all condition types with valid JSON
   - [ ] Test all action types with valid JSON
   - [ ] Verify JSON validation errors for invalid input
   - [ ] Verify API response confirmation

3. **Manual Evaluation**
   - [ ] Evaluate escalation on a ticket
   - [ ] Verify results dialog shows triggered rules
   - [ ] Verify actions are executed
   - [ ] Verify ticket is refreshed after evaluation

4. **Escalation History**
   - [ ] View escalation history on a ticket
   - [ ] Verify successful escalations show green
   - [ ] Verify failed escalations show red
   - [ ] Verify rule names and actions are displayed

## Requirements Satisfied

This implementation satisfies the following requirements:

- **13.1**: Admin_Manager can view escalation rules
- **13.2**: Admin_Manager can create escalation rules with JSON configuration
- **13.3**: Admin_Manager can edit escalation rules
- **13.4**: Users can manually evaluate escalation rules on tickets
- **13.5**: Escalation management is restricted to Admin_Manager only
- **59.1**: API response confirms storage with proper JSON configuration
- **59.2**: Escalation rules are fetched from the API
- **59.3**: Escalation history is displayed from API response
- **59.4**: API response confirms escalation rule conditions reference database fields
- **59.5**: Escalation rule execution results are displayed from API response

## Future Enhancements

- Add rule testing/preview functionality
- Add rule activation/deactivation toggle
- Add rule execution logs and analytics
- Add visual rule builder instead of JSON input
- Add rule templates for common scenarios
- Add bulk rule operations
