# Bulk Ticket Import Guide

This guide explains how to import multiple tickets at once using an Excel file.

## Quick Start

1. Navigate to the Tickets page
2. Click the "Bulk Import" button
3. Download the Excel template
4. Fill in your ticket data
5. Upload the completed file

## Excel Template Format

### Required Columns

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| Title | Text | Ticket title (required) | "Login issue on mobile app" |
| Description | Text | Detailed description (required) | "Users cannot log in using the mobile app on iOS devices" |
| Priority | Text | Ticket priority (required) | "HIGH" |
| Assigned To Email | Email | Email of the assigned agent (required) | "agent@company.com" |

### Optional Columns

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| Status | Text | Ticket status | "OPEN" |
| Category | Text | Ticket category | "Technical Support" |
| Customer Email | Email | Email of the customer | "customer@example.com" |
| Team Name | Text | Name of the assigned team | "Support Team" |
| Phone | Text | Contact phone number | "+1234567890" |

## Valid Values

### Priority (Required)
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

### Status (Optional)
- `OPEN` (default if not specified)
- `IN_PROGRESS`
- `WAITING_FOR_CUSTOMER`
- `RESOLVED`
- `CLOSED`

## Important Notes

### Email Addresses
- The "Assigned To Email" must match an existing user in the system
- The "Customer Email" (if provided) must match an existing user
- Email addresses are case-insensitive

### Team Names
- Team names must match exactly (case-insensitive)
- If a team name is provided but doesn't exist, that row will fail to import

### Validation Rules
- Maximum 1000 tickets per import
- Maximum file size: 10MB
- Title: Cannot be empty, max 200 characters
- Description: Cannot be empty
- Phone: Max 50 characters, only digits, spaces, hyphens, parentheses, and plus signs
- Category: Max 100 characters

## Example Excel File

Here's an example of a properly formatted Excel file:

| Title | Description | Priority | Status | Category | Assigned To Email | Customer Email | Team Name | Phone |
|-------|-------------|----------|--------|----------|-------------------|----------------|-----------|-------|
| Login issue on mobile app | Users cannot log in using the mobile app on iOS devices | HIGH | OPEN | Technical Support | agent@company.com | customer@example.com | Support Team | +1234567890 |
| Billing inquiry | Customer wants to upgrade their plan | MEDIUM | IN_PROGRESS | Billing | billing@company.com | customer2@example.com | Billing Team | +0987654321 |
| Feature request | Request for dark mode in the dashboard | LOW | OPEN | Feature Request | dev@company.com | | Development Team | |

## Import Process

1. **File Upload**: Select your Excel file (.xlsx or .xls)
2. **Validation**: The system validates each row
3. **Processing**: Valid tickets are created in the database
4. **Results**: You'll see a summary showing:
   - Number of successful imports
   - Number of failed imports
   - List of successfully created tickets
   - Detailed error messages for failed rows

## Error Handling

If a row fails to import, you'll see:
- The row number in the Excel file
- The specific error message
- The ticket title (if available)

Common errors:
- "Title is required" - The Title column is empty
- "Assigned user not found with email: xxx" - The email doesn't exist in the system
- "Invalid priority" - The priority value is not one of: LOW, MEDIUM, HIGH, URGENT
- "Team not found with name: xxx" - The team name doesn't exist

## Tips for Success

1. **Download the Template**: Always start with the provided template to ensure correct formatting
2. **Test with Small Batches**: Try importing 5-10 tickets first to verify your data format
3. **Check User Emails**: Verify that all assigned users and customers exist in the system before importing
4. **Use Consistent Formatting**: Keep priority and status values in UPPERCASE
5. **Leave Optional Fields Empty**: If you don't have data for optional fields, leave them blank (don't use "N/A" or "-")

## Troubleshooting

### "Invalid file type" Error
- Ensure your file has a .xlsx or .xls extension
- Don't use CSV files - they must be converted to Excel format

### "Excel file has no data rows" Error
- Make sure you have data below the header row
- Check that the sheet isn't empty

### Multiple Rows Failing
- Verify that all email addresses exist in the system
- Check that priority values are spelled correctly (UPPERCASE)
- Ensure required fields (Title, Description, Priority, Assigned To Email) are filled

### Import Takes Too Long
- Break large imports into smaller batches (200-300 tickets at a time)
- Ensure your file doesn't exceed 1000 rows

## API Endpoints

For developers integrating with the bulk import feature:

### Upload File
```
POST /api/tickets/bulk-import
Content-Type: multipart/form-data

Body: FormData with 'file' field containing the Excel file
```

### Download Template
```
GET /api/tickets/bulk-import

Returns: Excel file with sample data
```

## Security & Permissions

- Only authenticated users can import tickets
- All imported tickets are created by the current user
- Standard ticket creation permissions apply
- Audit logs are created for bulk import operations

## Audit Trail

Each bulk import operation is logged with:
- User who performed the import
- File name
- Total rows processed
- Number of successful imports
- Number of failed imports
- Timestamp and IP address
