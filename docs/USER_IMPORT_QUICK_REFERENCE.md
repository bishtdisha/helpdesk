# User Import - Quick Reference

## Excel Column Format

### ✅ Required Columns
- **Name**: Full name (e.g., "John Doe")
- **Email**: Valid email address (e.g., "john@example.com")
- **Password**: Minimum 8 characters (e.g., "SecurePass123")

### ⚙️ Optional Columns
- **Role Name**: Exact role name (e.g., "Admin/Manager", "Team Leader", "User/Employee")
- **Team Name**: Exact team name (e.g., "Support Team")
- **Is Active**: YES or NO (default: YES)

## Example Excel Format

| Name | Email | Password | Role Name | Team Name | Is Active |
|------|-------|----------|-----------|-----------|-----------|
| John Doe | john@example.com | Pass1234! | Admin/Manager | Support Team | YES |
| Jane Smith | jane@example.com | Secure99# | Team Leader | Tech Team | YES |
| Bob Lee | bob@example.com | MyPass88@ | User/Employee | | NO |

## Quick Validation Checklist

- [ ] All emails are unique and valid format
- [ ] All passwords are at least 8 characters
- [ ] Role names match existing roles exactly
- [ ] Team names match existing teams exactly
- [ ] Maximum 500 users per file
- [ ] File format is .xlsx or .xls

## Common Role Names
- Admin/Manager
- Team Leader
- User/Employee

## Tips
1. Download the template first
2. Test with 5-10 users before bulk import
3. Keep a backup of your Excel file
4. Review import results for errors
5. Users should change passwords on first login
