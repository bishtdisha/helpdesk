# Excel Template Visual Guide

## What Your Excel File Should Look Like

### Column Layout (Left to Right)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ A: Title          │ B: Description    │ C: Priority │ D: Status      │ E: Category        │ F: Assigned To Email │ G: Customer Email │ H: Team Name  │ I: Phone      │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Login issue       │ Users cannot...   │ HIGH        │ OPEN           │ Technical Support  │ agent@company.com    │ customer@ex.com   │ Support Team  │ +1234567890   │
│ Billing inquiry   │ Customer wants... │ MEDIUM      │ IN_PROGRESS    │ Billing            │ billing@company.com  │ customer2@ex.com  │ Billing Team  │ +0987654321   │
│ Feature request   │ Request for...    │ LOW         │ OPEN           │ Feature Request    │ dev@company.com      │                   │ Dev Team      │               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Visual Instructions

### Step 1: Open the Downloaded Template
When you download the template, you'll see:
- Row 1: Column headers (DO NOT CHANGE THESE)
- Row 2-3: Sample data (REPLACE with your data)

### Step 2: Fill in Required Fields (Columns A-D, F)

#### Column A: Title ✅ REQUIRED
```
Example: "Cannot access dashboard"
Rules:
- Cannot be empty
- Maximum 200 characters
- Be descriptive but concise
```

#### Column B: Description ✅ REQUIRED
```
Example: "User reports that after logging in, the dashboard shows a blank screen. 
This happens on Chrome browser version 120. User has tried clearing cache."

Rules:
- Cannot be empty
- Provide detailed information
- Include steps to reproduce if applicable
```

#### Column C: Priority ✅ REQUIRED
```
Valid Values (UPPERCASE only):
┌──────────┐
│ LOW      │ - Minor issues, can wait
│ MEDIUM   │ - Normal priority (default)
│ HIGH     │ - Important, needs attention soon
│ URGENT   │ - Critical, immediate action needed
└──────────┘
```

#### Column D: Status (Optional)
```
Valid Values (UPPERCASE only):
┌──────────────────────────┐
│ OPEN                     │ - New ticket (default)
│ IN_PROGRESS              │ - Being worked on
│ WAITING_FOR_CUSTOMER     │ - Awaiting customer response
│ RESOLVED                 │ - Issue fixed
│ CLOSED                   │ - Ticket closed
└──────────────────────────┘

Leave blank to default to OPEN
```

#### Column F: Assigned To Email ✅ REQUIRED
```
Example: "john.doe@company.com"

Rules:
- Must be a valid email address
- Email must exist in your system
- Case-insensitive
- This person will receive the ticket
```

### Step 3: Fill in Optional Fields (Columns E, G, H, I)

#### Column E: Category (Optional)
```
Example: "Technical Support", "Billing", "Feature Request"

Rules:
- Maximum 100 characters
- Use consistent naming for better organization
- Leave blank if not applicable
```

#### Column G: Customer Email (Optional)
```
Example: "customer@example.com"

Rules:
- Must exist in your system if provided
- Case-insensitive
- Leave blank if ticket is not customer-specific
```

#### Column H: Team Name (Optional)
```
Example: "Support Team", "Engineering Team"

Rules:
- Must match existing team name in system
- Case-insensitive
- Leave blank if no team assignment needed
```

#### Column I: Phone (Optional)
```
Example: "+1 (555) 123-4567" or "+15551234567"

Rules:
- Maximum 50 characters
- Can include: digits, spaces, hyphens, parentheses, plus signs
- Leave blank if not applicable
```

## Color-Coded Priority Guide

When viewing in Excel, you might want to color-code priorities:

```
🔴 URGENT   - Red background
🟠 HIGH     - Orange background
🟡 MEDIUM   - Yellow background
🟢 LOW      - Green background
```

## Common Mistakes to Avoid

### ❌ Wrong Format
```
Title: [Empty]
Priority: high (lowercase)
Status: Open (mixed case)
Assigned To Email: john.doe (not an email)
```

### ✅ Correct Format
```
Title: Login issue on mobile app
Priority: HIGH
Status: OPEN
Assigned To Email: john.doe@company.com
```

## Sample Data for Testing

Copy this into your Excel file to test the import:

| Title | Description | Priority | Status | Category | Assigned To Email | Customer Email | Team Name | Phone |
|-------|-------------|----------|--------|----------|-------------------|----------------|-----------|-------|
| Test Ticket 1 | This is a test ticket for import validation | MEDIUM | OPEN | Testing | your-email@company.com | | | |
| Test Ticket 2 | Another test ticket | LOW | OPEN | Testing | your-email@company.com | | | |

Replace `your-email@company.com` with an actual email from your system.

## Validation Checklist

Before uploading, verify:

- [ ] All required columns have data (Title, Description, Priority, Assigned To Email)
- [ ] Priority values are UPPERCASE (LOW, MEDIUM, HIGH, URGENT)
- [ ] Status values are UPPERCASE (if provided)
- [ ] All email addresses exist in your system
- [ ] Team names match existing teams (if provided)
- [ ] Phone numbers only contain valid characters
- [ ] File is saved as .xlsx or .xls (not .csv)
- [ ] File size is under 10MB
- [ ] Maximum 1000 rows of data

## After Upload

You'll see a results screen showing:

```
┌─────────────────────────────┐
│ ✅ Success: 45              │
│ ❌ Failed: 5                │
└─────────────────────────────┘

Successfully Imported Tickets:
#1001 - Login issue (Assigned to: John Doe)
#1002 - Billing inquiry (Assigned to: Jane Smith)
...

Import Errors:
Row 10: Assigned user not found with email: invalid@email.com
Row 15: Invalid priority "medium". Must be one of: LOW, MEDIUM, HIGH, URGENT
...
```

## Tips for Large Imports

1. **Start Small**: Test with 5-10 tickets first
2. **Batch Processing**: Import 200-300 tickets at a time
3. **Verify Data**: Check all emails and team names exist before importing
4. **Keep Backup**: Save a copy of your Excel file before uploading
5. **Review Errors**: Fix failed rows and re-import them separately

## Need More Help?

- Full documentation: [docs/BULK_TICKET_IMPORT.md](BULK_TICKET_IMPORT.md)
- Quick reference: [EXCEL_IMPORT_FORMAT.md](../EXCEL_IMPORT_FORMAT.md)
