# User Bulk Import Guide

This guide explains how to import multiple users into the system using an Excel file.

## Overview

The bulk import feature allows administrators to create multiple user accounts at once by uploading an Excel file. This is useful for:
- Onboarding new teams
- Migrating from legacy systems
- Setting up initial user accounts

## Access Requirements

- Only users with **Administrator** role can import users
- You must have the `users:create` permission

## Excel File Format

### Required Columns

| Column Name | Required | Description | Example |
|------------|----------|-------------|---------|
| **Name** | ✅ Yes | Full name of the user | John Doe |
| **Email** | ✅ Yes | Valid email address (must be unique) | john.doe@example.com |
| **Password** | ✅ Yes | Password (minimum 8 characters) | SecurePass123 |

### Optional Columns

| Column Name | Required | Description | Example | Notes |
|------------|----------|-------------|---------|-------|
| **Role Name** | ❌ No | Name of the role to assign | Admin/Manager | Must match existing role name exactly (case-insensitive) |
| **Team Name** | ❌ No | Name of the team to assign | Support Team | Must match existing team name exactly (case-insensitive) |
| **Is Active** | ❌ No | Whether the user account is active | YES | Accepts: YES, NO, TRUE, FALSE, 1, 0 (default: YES) |

## Step-by-Step Instructions

### 1. Download the Template

1. Navigate to **User Management** page
2. Click the **Import Users** button
3. Click **Download Template** in the dialog
4. Open the downloaded `user-import-template.xlsx` file

### 2. Fill in User Data

1. Open the template in Excel, Google Sheets, or any spreadsheet application
2. Fill in the user information row by row
3. **Do not modify the column headers**
4. Remove the sample data rows before uploading

#### Example Data:

```
Name            | Email                    | Password       | Role Name      | Team Name      | Is Active
----------------|--------------------------|----------------|----------------|----------------|----------
John Doe        | john.doe@example.com     | SecurePass123  | Admin/Manager  | Support Team   | YES
Jane Smith      | jane.smith@example.com   | SecurePass456  | Team Leader    | Technical Team | YES
Bob Johnson     | bob.johnson@example.com  | SecurePass789  | User/Employee  |                | NO
Alice Williams  | alice@example.com        | MyPass2024!    |                | Support Team   | YES
```

### 3. Validate Your Data

Before uploading, ensure:

✅ All required fields (Name, Email, Password) are filled
✅ Email addresses are valid and unique
✅ Passwords are at least 8 characters long
✅ Role names match existing roles exactly
✅ Team names match existing teams exactly
✅ No duplicate email addresses in the file

### 4. Upload the File

1. Click **Import Users** button
2. Click the upload area or drag and drop your Excel file
3. Click **Import Users** to start the import process
4. Wait for the import to complete

### 5. Review Results

After import completes, you'll see:
- **Success count**: Number of users successfully created
- **Failed count**: Number of users that failed to import
- **Success list**: Details of successfully imported users
- **Error list**: Detailed error messages for failed imports

## Validation Rules

### Email Validation
- Must be a valid email format (e.g., user@domain.com)
- Must be unique (not already in the system)
- Case-insensitive (john@example.com = JOHN@example.com)

### Password Validation
- Minimum 8 characters
- No maximum length
- Can contain letters, numbers, and special characters

### Role Name Validation
- Must match an existing role name exactly (case-insensitive)
- If left empty, user will have no role assigned
- Common roles: Admin/Manager, Team Leader, User/Employee

### Team Name Validation
- Must match an existing team name exactly (case-insensitive)
- If left empty, user will not be assigned to any team

### Is Active Validation
- Accepts: YES, NO, TRUE, FALSE, 1, 0
- Case-insensitive
- Default: YES (if left empty)

## Limitations

- **Maximum 500 users** per import
- File must be in Excel format (.xlsx or .xls)
- Import is processed synchronously (may take time for large files)

## Common Errors and Solutions

### Error: "User with email already exists"
**Solution**: Check if the email is already registered in the system. Each email must be unique.

### Error: "Role not found: [Role Name]"
**Solution**: Verify the role name matches exactly with an existing role. Check the Roles page for available roles.

### Error: "Team not found: [Team Name]"
**Solution**: Verify the team name matches exactly with an existing team. Check the Teams page for available teams.

### Error: "Password must be at least 8 characters"
**Solution**: Ensure all passwords are at least 8 characters long.

### Error: "Invalid email format"
**Solution**: Check that the email follows the format: username@domain.com

### Error: "Name is required"
**Solution**: Ensure the Name column is filled for all rows.

## Best Practices

1. **Start Small**: Test with 5-10 users first before importing hundreds
2. **Backup Data**: Keep a copy of your Excel file for reference
3. **Verify Roles and Teams**: Ensure all roles and teams exist before importing
4. **Use Strong Passwords**: Generate secure passwords for all users
5. **Review Results**: Always check the import results for any errors
6. **Notify Users**: Inform users of their credentials after import

## Security Considerations

- Passwords are hashed using bcrypt before storage
- Only administrators can perform bulk imports
- All imports are logged for audit purposes
- Users should change their passwords on first login

## Troubleshooting

### Import is taking too long
- Reduce the number of users per import (try 100-200 at a time)
- Check your internet connection
- Ensure the Excel file is not corrupted

### Some users imported, others failed
- Review the error list for specific issues
- Fix the errors in your Excel file
- Re-import only the failed users

### Cannot download template
- Check your browser's download settings
- Try a different browser
- Contact your system administrator

## API Endpoints

For developers integrating with the API:

### Download Template
```
GET /api/users/bulk-import
```
Returns an Excel template file.

### Upload Users
```
POST /api/users/bulk-import
Content-Type: multipart/form-data

Body: { file: <Excel file> }
```

Response:
```json
{
  "message": "Import completed: 10 succeeded, 2 failed",
  "result": {
    "success": 10,
    "failed": 2,
    "errors": [
      {
        "row": 5,
        "error": "User with email already exists",
        "data": { "name": "John Doe", "email": "john@example.com" }
      }
    ],
    "users": [
      {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "Admin/Manager",
        "team": "Support Team"
      }
    ]
  }
}
```

## Support

If you encounter issues not covered in this guide:
1. Check the error messages carefully
2. Verify your Excel file format
3. Contact your system administrator
4. Review the application logs for detailed error information
