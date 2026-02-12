# User Bulk Import - Complete Guide

This guide explains how to import multiple users at once using an Excel file.

## Quick Start

1. Navigate to the **User Management** page
2. Click the **"Bulk Import"** button
3. Download the Excel template
4. Fill in your user data
5. Upload the completed file

## Excel Template Format

### Required Columns

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| Name | Text | Full name of the user (required) | "John Doe" |
| Email | Email | Email address (required, must be unique) | "john.doe@company.com" |
| Password | Text | User password (required, min 6 chars) | "password123" |

### Optional Columns

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| Role Name | Text | Name of the role to assign | "Agent" |
| Team Name | Text | Name of the team to assign | "Support Team" |
| Is Active | Text | Whether user can log in | "YES" or "NO" |

## Valid Values

### Is Active (Optional)
- `YES` (default if not specified)
- `NO`
- `TRUE`
- `FALSE`
- `1` (treated as YES)
- `0` (treated as NO)

Any value other than NO/FALSE/0 is treated as YES.

## Important Notes

### Email Addresses
- Must be unique across the entire system
- Must be unique within the import file
- Email addresses are case-insensitive
- Format must be valid (user@domain.com)

### Passwords
- Minimum 6 characters required
- Passwords are securely hashed before storage
- Plain text passwords are never stored
- Users should change password after first login

### Role Names
- Must match an existing role name exactly (case-insensitive)
- If role doesn't exist, that row will fail to import
- Leave blank if no role assignment needed
- Common roles: Admin, Manager, Agent, Customer

### Team Names
- Must match an existing team name exactly (case-insensitive)
- If team doesn't exist, that row will fail to import
- Leave blank if no team assignment needed

### Validation Rules
- Maximum 500 users per import
- Maximum file size: 10MB
- Email must be unique (no duplicates)
- Password must be at least 6 characters
- Name cannot be empty
- Email must be valid format

## Example Excel File

Here's an example of a properly formatted Excel file:

| Name | Email | Password | Role Name | Team Name | Is Active |
|------|-------|----------|-----------|-----------|-----------|
| John Doe | john.doe@company.com | SecurePass123 | Agent | Support Team | YES |
| Jane Smith | jane.smith@company.com | MyPassword456 | Manager | Support Team | YES |
| Bob Wilson | bob.wilson@company.com | TempPass789 | Agent | Sales Team | NO |
| Alice Brown | alice.brown@company.com | Pass123456 | Customer | | YES |
| Charlie Davis | charlie@company.com | Welcome2024 | | Development Team | YES |

## Import Process

1. **File Upload**: Select your Excel file (.xlsx or .xls)
2. **Validation**: The system validates each row:
   - Checks for required fields
   - Validates email format and uniqueness
   - Validates password length
   - Checks if roles and teams exist
3. **Processing**: Valid users are created in the database
4. **Results**: You'll see a summary showing:
   - Number of successful imports
   - Number of failed imports
   - List of successfully created users
   - Detailed error messages for failed rows

## Error Handling

If a row fails to import, you'll see:
- The row number in the Excel file
- The specific error message
- The user's name and email (if available)

### Common Errors

**"User with email xxx already exists"**
- Solution: Check if the email is already in the database or appears multiple times in your file

**"Password must be at least 6 characters long"**
- Solution: Use passwords with 6 or more characters

**"Invalid email format: xxx"**
- Solution: Ensure email follows the format user@domain.com

**"Role not found: xxx"**
- Solution: Verify the role name exists in your system (check spelling and case)

**"Team not found: xxx"**
- Solution: Verify the team name exists in your system (check spelling and case)

**"Name is required"**
- Solution: Ensure the Name column is not empty

**"Email is required"**
- Solution: Ensure the Email column is not empty

**"Duplicate email in this import file: xxx"**
- Solution: Remove duplicate emails from your file

## Tips for Success

1. **Download the Template**: Always start with the provided template to ensure correct formatting

2. **Test with Small Batches**: Try importing 5-10 users first to verify your data format

3. **Check Roles and Teams**: Before importing, verify that all role and team names exist in your system

4. **Use Consistent Formatting**: Keep role and team names consistent with your system

5. **Leave Optional Fields Empty**: If you don't have data for optional fields, leave them blank (don't use "N/A" or "-")

6. **Prepare Strong Passwords**: Generate secure passwords for your users

7. **Review Before Upload**: Double-check your data for duplicates and errors

8. **Keep a Backup**: Save a copy of your Excel file before uploading

## Troubleshooting

### "Invalid file type" Error
- Ensure your file has a .xlsx or .xls extension
- Don't use CSV files - they must be converted to Excel format

### "Excel file has no data rows" Error
- Make sure you have data below the header row
- Check that the sheet isn't empty

### Multiple Rows Failing
- Verify that all email addresses are unique
- Check that all role and team names exist in the system
- Ensure passwords are at least 6 characters
- Verify required fields (Name, Email, Password) are filled

### Import Takes Too Long
- Break large imports into smaller batches (100-200 users at a time)
- Ensure your file doesn't exceed 500 rows

## Security & Permissions

- Only authenticated users with user creation permissions can import users
- All imported users are created by the current user
- Passwords are securely hashed using bcrypt (12 rounds)
- Audit logs are created for bulk import operations
- Inactive users (Is Active = NO) cannot log in until activated

## Audit Trail

Each bulk import operation is logged with:
- User who performed the import
- File name
- Total rows processed
- Number of successful imports
- Number of failed imports
- Timestamp and IP address

## After Import

Once users are imported:
- They appear in the user management list
- Active users can log in immediately
- Inactive users must be activated first
- Users have their assigned roles and teams
- Users can change their password after first login
- Email notifications are NOT sent (you may want to notify users manually)

## Best Practices

### Password Management
- Generate strong, unique passwords for each user
- Consider using a password generator
- Inform users to change their password after first login
- Don't reuse passwords across users

### Role Assignment
- Assign appropriate roles based on user responsibilities
- Review role permissions before assigning
- Use the least privilege principle

### Team Assignment
- Assign users to relevant teams
- Ensure team leaders are set up before assigning members
- Review team structure before importing

### Data Preparation
- Clean your data before importing
- Remove duplicates
- Verify email addresses are correct
- Standardize name formatting

## API Endpoints

For developers integrating with the bulk import feature:

### Upload File
```
POST /api/users/bulk-import
Content-Type: multipart/form-data

Body: FormData with 'file' field containing the Excel file

Response:
{
  "message": "Import completed: 45 succeeded, 5 failed",
  "result": {
    "success": 45,
    "failed": 5,
    "errors": [...],
    "users": [...]
  }
}
```

### Download Template
```
GET /api/users/bulk-import

Returns: Excel file with sample data
```

## Limitations

- Maximum 500 users per import
- Maximum file size: 10MB
- Only .xlsx and .xls formats supported
- No support for importing user avatars
- No support for importing custom fields
- No email notifications sent to imported users
- No support for importing user preferences

## Future Enhancements (Potential)

1. Support for importing user avatars
2. Support for importing custom user fields
3. Email notifications to imported users
4. Import user preferences and settings
5. CSV format support
6. Duplicate detection with merge options
7. Import preview before execution
8. Scheduled imports via API
9. Import history and logs page
10. Rollback failed imports

## Need Help?

For issues or questions:
1. Check `USER_BULK_IMPORT_FORMAT.md` for quick reference
2. Review this complete guide
3. Check browser console for detailed error messages
4. Verify all roles and teams exist in the system before importing
5. Test with a small batch first

## Success Criteria

The feature is working correctly when:
- ✅ Template downloads successfully
- ✅ Valid Excel files upload without errors
- ✅ Users appear in the user management list after import
- ✅ Error messages are clear and actionable
- ✅ Partial imports succeed (some rows pass, some fail)
- ✅ Audit logs show bulk import operations
- ✅ Passwords are securely hashed
- ✅ Users can log in with imported credentials
