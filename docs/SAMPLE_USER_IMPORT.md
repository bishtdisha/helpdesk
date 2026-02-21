# Sample User Import Data

This document shows exactly what your Excel file should look like when importing users.

## Template Structure

When you download the template from the system, it will contain these exact columns and sample data:

### Column Headers (Row 1)
```
Name | Email | Password | Role Name | Team Name | Is Active
```

### Sample Data (Rows 2-4)

#### Row 2 - Admin User Example
```
Name:        John Doe
Email:       john.doe@example.com
Password:    SecurePass123
Role Name:   Admin/Manager
Team Name:   Support Team
Is Active:   YES
```

#### Row 3 - Team Leader Example
```
Name:        Jane Smith
Email:       jane.smith@example.com
Password:    SecurePass456
Role Name:   Team Leader
Team Name:   Technical Team
Is Active:   YES
```

#### Row 4 - Regular User Example (No Team, Inactive)
```
Name:        Bob Johnson
Email:       bob.johnson@example.com
Password:    SecurePass789
Role Name:   User/Employee
Team Name:   (empty)
Is Active:   NO
```

## How to Use the Template

1. **Download** the template from the Import Users dialog
2. **Delete** the sample data rows (rows 2-4)
3. **Keep** the header row (row 1) - DO NOT MODIFY
4. **Add** your user data starting from row 2
5. **Save** the file
6. **Upload** through the Import Users dialog

## Real-World Examples

### Example 1: New Employee Onboarding
```
Name              | Email                  | Password      | Role Name      | Team Name        | Is Active
------------------|------------------------|---------------|----------------|------------------|----------
Sarah Connor      | sarah.c@company.com    | Welcome2024!  | User/Employee  | Engineering      | YES
Kyle Reese        | kyle.r@company.com     | Secure123#    | User/Employee  | Engineering      | YES
John Connor       | john.c@company.com     | Future2024@   | Team Leader    | Engineering      | YES
```

### Example 2: Department Migration
```
Name              | Email                  | Password      | Role Name      | Team Name        | Is Active
------------------|------------------------|---------------|----------------|------------------|----------
Michael Scott     | michael@company.com    | Manager123!   | Admin/Manager  | Sales            | YES
Jim Halpert       | jim@company.com        | Sales2024#    | User/Employee  | Sales            | YES
Pam Beesly        | pam@company.com        | Reception99@  | User/Employee  | Sales            | YES
Dwight Schrute    | dwight@company.com     | BeetFarm88!   | Team Leader    | Sales            | YES
```

### Example 3: Mixed Roles and Teams
```
Name              | Email                  | Password      | Role Name      | Team Name        | Is Active
------------------|------------------------|---------------|----------------|------------------|----------
Tony Stark        | tony@company.com       | IronMan123!   | Admin/Manager  | Engineering      | YES
Steve Rogers      | steve@company.com      | Captain99@    | Team Leader    | Operations       | YES
Bruce Banner      | bruce@company.com      | Hulk2024#     | User/Employee  | Engineering      | YES
Natasha Romanoff  | natasha@company.com    | Widow123!     | User/Employee  | Operations       | YES
Thor Odinson      | thor@company.com       | Thunder88@    |                |                  | YES
```
*Note: Thor has no role or team assigned*

### Example 4: Inactive Users (For Testing)
```
Name              | Email                  | Password      | Role Name      | Team Name        | Is Active
------------------|------------------------|---------------|----------------|------------------|----------
Test User 1       | test1@company.com      | TestPass1!    | User/Employee  | QA Team          | NO
Test User 2       | test2@company.com      | TestPass2!    | User/Employee  | QA Team          | NO
Demo Account      | demo@company.com       | DemoPass3!    | User/Employee  |                  | NO
```

## Column-by-Column Explanation

### Name Column
- **Purpose**: User's full name as it will appear in the system
- **Format**: Any text
- **Examples**: 
  - "John Doe"
  - "Jane Smith-Johnson"
  - "Dr. Robert Chen"
  - "María García"
- **Required**: YES
- **Validation**: Cannot be empty

### Email Column
- **Purpose**: User's email address for login and notifications
- **Format**: standard email format (user@domain.com)
- **Examples**:
  - "john.doe@company.com"
  - "jane.smith@example.org"
  - "user123@domain.co.uk"
- **Required**: YES
- **Validation**: 
  - Must be valid email format
  - Must be unique (not already in system)
  - Case-insensitive

### Password Column
- **Purpose**: Initial password for the user account
- **Format**: Minimum 8 characters, any combination
- **Examples**:
  - "SecurePass123"
  - "MyP@ssw0rd!"
  - "Welcome2024#"
- **Required**: YES
- **Validation**: Minimum 8 characters
- **Security**: Passwords are hashed before storage
- **Best Practice**: Users should change on first login

### Role Name Column
- **Purpose**: Assigns permission level to the user
- **Format**: Exact role name (case-insensitive)
- **Examples**:
  - "Admin/Manager"
  - "Team Leader"
  - "User/Employee"
- **Required**: NO
- **Validation**: Must match existing role name exactly
- **If Empty**: User will have no role assigned

### Team Name Column
- **Purpose**: Assigns user to a team/department
- **Format**: Exact team name (case-insensitive)
- **Examples**:
  - "Support Team"
  - "Engineering"
  - "Sales Department"
  - "Technical Team"
- **Required**: NO
- **Validation**: Must match existing team name exactly
- **If Empty**: User will not be assigned to any team

### Is Active Column
- **Purpose**: Controls whether user can log in
- **Format**: YES/NO, TRUE/FALSE, 1/0
- **Examples**:
  - "YES" - User can log in
  - "NO" - User cannot log in
  - "TRUE" - User can log in
  - "FALSE" - User cannot log in
  - "1" - User can log in
  - "0" - User cannot log in
- **Required**: NO
- **Default**: YES (if left empty)
- **Case-Insensitive**: yes, YES, Yes all work

## Tips for Large Imports

### Organizing Your Data
1. Sort by team for easier review
2. Group by role for permission verification
3. Use consistent naming conventions
4. Add comments in a separate column (will be ignored)

### Testing Strategy
1. Import 5 test users first
2. Verify they appear correctly
3. Test login with one account
4. Then import the full list

### Error Prevention
1. Use Excel's data validation for email format
2. Use dropdown lists for Role Name and Team Name
3. Use formula to check password length: `=LEN(C2)>=8`
4. Highlight duplicates: Conditional formatting on Email column

## Troubleshooting Import Errors

### If you see: "Row 5: User with email already exists"
- **Problem**: Email in row 5 is already registered
- **Solution**: Remove that row or change the email address

### If you see: "Row 8: Role not found: Manager"
- **Problem**: "Manager" doesn't match any existing role
- **Solution**: Change to exact role name like "Admin/Manager"

### If you see: "Row 12: Password must be at least 8 characters"
- **Problem**: Password in row 12 is too short
- **Solution**: Use a password with 8+ characters

### If you see: "Row 15: Invalid email format"
- **Problem**: Email format is incorrect
- **Solution**: Use format like user@domain.com

## After Import

### Successful Import
- Users receive their credentials (if email notifications are enabled)
- Users can log in immediately (if Is Active = YES)
- Users appear in the User Management page
- Audit log records the import

### Partial Success
- Successfully imported users are created
- Failed users are listed with specific errors
- You can fix errors and re-import failed users
- No duplicate users will be created

### Next Steps
1. Review the import results
2. Verify users in User Management page
3. Notify users of their credentials
4. Instruct users to change passwords on first login
5. Assign additional permissions if needed
