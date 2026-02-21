# Excel Format Visual Guide

## 📋 Exact Excel Template Format

This guide shows the EXACT format of the Excel file you'll download and need to fill in.

## 🎯 Template Structure

### Row 1: Column Headers (DO NOT MODIFY)

```
┌─────────────────┬──────────────────────────┬──────────────┬──────────────┬──────────────┬───────────┐
│ Name            │ Email                    │ Password     │ Role Name    │ Team Name    │ Is Active │
└─────────────────┴──────────────────────────┴──────────────┴──────────────┴──────────────┴───────────┘
```

### Rows 2+: Your User Data

```
┌─────────────────┬──────────────────────────┬──────────────┬──────────────┬──────────────┬───────────┐
│ John Doe        │ john.doe@example.com     │ SecurePass123│ Admin/Manager│ Support Team │ YES       │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ Jane Smith      │ jane.smith@example.com   │ SecurePass456│ Team Leader  │ Technical    │ YES       │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ Bob Johnson     │ bob.johnson@example.com  │ SecurePass789│ User/Employee│              │ NO        │
└─────────────────┴──────────────────────────┴──────────────┴──────────────┴──────────────┴───────────┘
```

## 📊 Column-by-Column Breakdown

### Column A: Name
```
┌─────────────────┐
│ Name            │ ← Header (Row 1)
├─────────────────┤
│ John Doe        │ ← Your data starts here (Row 2)
│ Jane Smith      │
│ Bob Johnson     │
│ ...             │
└─────────────────┘
```
- **Required**: ✅ YES
- **Format**: Any text
- **Example**: "John Doe", "Jane Smith", "Dr. Robert Chen"

### Column B: Email
```
┌──────────────────────────┐
│ Email                    │ ← Header (Row 1)
├──────────────────────────┤
│ john.doe@example.com     │ ← Your data starts here (Row 2)
│ jane.smith@example.com   │
│ bob.johnson@example.com  │
│ ...                      │
└──────────────────────────┘
```
- **Required**: ✅ YES
- **Format**: user@domain.com
- **Must be unique**: Each email can only be used once
- **Example**: "john@company.com", "jane.smith@example.org"

### Column C: Password
```
┌──────────────┐
│ Password     │ ← Header (Row 1)
├──────────────┤
│ SecurePass123│ ← Your data starts here (Row 2)
│ SecurePass456│
│ SecurePass789│
│ ...          │
└──────────────┘
```
- **Required**: ✅ YES
- **Format**: Minimum 8 characters
- **Example**: "SecurePass123", "MyP@ssw0rd!", "Welcome2024#"

### Column D: Role Name
```
┌──────────────┐
│ Role Name    │ ← Header (Row 1)
├──────────────┤
│ Admin/Manager│ ← Your data starts here (Row 2)
│ Team Leader  │
│ User/Employee│
│              │ ← Can be empty
└──────────────┘
```
- **Required**: ❌ NO (optional)
- **Format**: Must match existing role name EXACTLY
- **Common values**:
  - "Admin/Manager"
  - "Team Leader"
  - "User/Employee"
- **If empty**: User will have no role

### Column E: Team Name
```
┌──────────────┐
│ Team Name    │ ← Header (Row 1)
├──────────────┤
│ Support Team │ ← Your data starts here (Row 2)
│ Technical    │
│              │ ← Can be empty
│ Sales        │
└──────────────┘
```
- **Required**: ❌ NO (optional)
- **Format**: Must match existing team name EXACTLY
- **Example**: "Support Team", "Engineering", "Sales Department"
- **If empty**: User will not be assigned to any team

### Column F: Is Active
```
┌───────────┐
│ Is Active │ ← Header (Row 1)
├───────────┤
│ YES       │ ← Your data starts here (Row 2)
│ YES       │
│ NO        │
│           │ ← Can be empty (defaults to YES)
└───────────┘
```
- **Required**: ❌ NO (optional)
- **Format**: YES, NO, TRUE, FALSE, 1, or 0
- **Default**: YES (if empty)
- **Example**: "YES", "NO", "TRUE", "FALSE"

## 🎨 Visual Example: Complete Row

```
Row 2 Example:
┌─────────────────┬──────────────────────────┬──────────────┬──────────────┬──────────────┬───────────┐
│ A               │ B                        │ C            │ D            │ E            │ F         │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ John Doe        │ john.doe@example.com     │ SecurePass123│ Admin/Manager│ Support Team │ YES       │
└─────────────────┴──────────────────────────┴──────────────┴──────────────┴──────────────┴───────────┘
     ↓                      ↓                      ↓               ↓               ↓            ↓
   Name                  Email                 Password        Role Name       Team Name    Is Active
(Required)            (Required)             (Required)       (Optional)      (Optional)   (Optional)
```

## 📝 Step-by-Step Fill Instructions

### Step 1: Open the Template
```
After downloading, you'll see:
┌─────────────────┬──────────────────────────┬──────────────┬──────────────┬──────────────┬───────────┐
│ Name            │ Email                    │ Password     │ Role Name    │ Team Name    │ Is Active │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ John Doe        │ john.doe@example.com     │ SecurePass123│ Admin/Manager│ Support Team │ YES       │
│ Jane Smith      │ jane.smith@example.com   │ SecurePass456│ Team Leader  │ Technical    │ YES       │
│ Bob Johnson     │ bob.johnson@example.com  │ SecurePass789│ User/Employee│              │ NO        │
└─────────────────┴──────────────────────────┴──────────────┴──────────────┴──────────────┴───────────┘
```

### Step 2: Delete Sample Data
```
Delete rows 2, 3, and 4 (the sample data):
┌─────────────────┬──────────────────────────┬──────────────┬──────────────┬──────────────┬───────────┐
│ Name            │ Email                    │ Password     │ Role Name    │ Team Name    │ Is Active │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│                 │                          │              │              │              │           │ ← Empty, ready for your data
└─────────────────┴──────────────────────────┴──────────────┴──────────────┴──────────────┴───────────┘
```

### Step 3: Add Your Users
```
Fill in your user data starting from row 2:
┌─────────────────┬──────────────────────────┬──────────────┬──────────────┬──────────────┬───────────┐
│ Name            │ Email                    │ Password     │ Role Name    │ Team Name    │ Is Active │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ Sarah Connor    │ sarah@company.com        │ Welcome2024! │ Admin/Manager│ Engineering  │ YES       │
│ Kyle Reese      │ kyle@company.com         │ Secure123#   │ User/Employee│ Engineering  │ YES       │
│ John Connor     │ john@company.com         │ Future2024@  │ Team Leader  │ Engineering  │ YES       │
└─────────────────┴──────────────────────────┴──────────────┴──────────────┴──────────────┴───────────┘
```

## ✅ Validation Checklist

Before uploading, verify each row:

```
Row 2: Sarah Connor
├─ ✅ Name: "Sarah Connor" (not empty)
├─ ✅ Email: "sarah@company.com" (valid format, unique)
├─ ✅ Password: "Welcome2024!" (8+ characters)
├─ ✅ Role Name: "Admin/Manager" (matches existing role)
├─ ✅ Team Name: "Engineering" (matches existing team)
└─ ✅ Is Active: "YES" (valid value)

Row 3: Kyle Reese
├─ ✅ Name: "Kyle Reese" (not empty)
├─ ✅ Email: "kyle@company.com" (valid format, unique)
├─ ✅ Password: "Secure123#" (8+ characters)
├─ ✅ Role Name: "User/Employee" (matches existing role)
├─ ✅ Team Name: "Engineering" (matches existing team)
└─ ✅ Is Active: "YES" (valid value)
```

## ❌ Common Mistakes

### Mistake 1: Modified Headers
```
❌ WRONG:
┌─────────────────┬──────────────────────────┬──────────────┬──────────────┐
│ Full Name       │ Email Address            │ Pass         │ Role         │
└─────────────────┴──────────────────────────┴──────────────┴──────────────┘

✅ CORRECT:
┌─────────────────┬──────────────────────────┬──────────────┬──────────────┐
│ Name            │ Email                    │ Password     │ Role Name    │
└─────────────────┴──────────────────────────┴──────────────┴──────────────┘
```

### Mistake 2: Invalid Email Format
```
❌ WRONG:
┌──────────────────────────┐
│ Email                    │
├──────────────────────────┤
│ john.doe                 │ ← Missing @domain.com
│ jane@                    │ ← Incomplete
│ @company.com             │ ← Missing username
└──────────────────────────┘

✅ CORRECT:
┌──────────────────────────┐
│ Email                    │
├──────────────────────────┤
│ john.doe@company.com     │
│ jane@company.com         │
│ bob@company.com          │
└──────────────────────────┘
```

### Mistake 3: Short Password
```
❌ WRONG:
┌──────────────┐
│ Password     │
├──────────────┤
│ Pass123      │ ← Only 7 characters
│ 1234567      │ ← Only 7 characters
└──────────────┘

✅ CORRECT:
┌──────────────┐
│ Password     │
├──────────────┤
│ Pass1234     │ ← 8 characters
│ SecurePass1! │ ← 12 characters
└──────────────┘
```

### Mistake 4: Wrong Role Name
```
❌ WRONG:
┌──────────────┐
│ Role Name    │
├──────────────┤
│ Manager      │ ← Should be "Admin/Manager"
│ Leader       │ ← Should be "Team Leader"
│ Employee     │ ← Should be "User/Employee"
└──────────────┘

✅ CORRECT:
┌──────────────┐
│ Role Name    │
├──────────────┤
│ Admin/Manager│
│ Team Leader  │
│ User/Employee│
└──────────────┘
```

## 🎯 Real-World Example

### Scenario: Onboarding 5 New Employees

```
┌─────────────────┬──────────────────────────┬──────────────┬──────────────┬──────────────┬───────────┐
│ Name            │ Email                    │ Password     │ Role Name    │ Team Name    │ Is Active │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ Alice Johnson   │ alice.j@company.com      │ Welcome2024! │ User/Employee│ Engineering  │ YES       │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ Bob Smith       │ bob.s@company.com        │ Secure123#   │ User/Employee│ Engineering  │ YES       │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ Carol White     │ carol.w@company.com      │ MyPass456@   │ Team Leader  │ Engineering  │ YES       │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ David Brown     │ david.b@company.com      │ Strong789!   │ User/Employee│ Sales        │ YES       │
├─────────────────┼──────────────────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ Eve Davis       │ eve.d@company.com        │ Pass2024#    │ Admin/Manager│ Operations   │ YES       │
└─────────────────┴──────────────────────────┴──────────────┴──────────────┴──────────────┴───────────┘
```

## 💡 Pro Tips

### Tip 1: Use Excel Formulas for Validation
```
In cell G2, add this formula to check password length:
=IF(LEN(C2)>=8,"✓","✗ Too short")

Drag down to check all passwords.
```

### Tip 2: Use Data Validation for Roles
```
1. Select column D (Role Name)
2. Data → Data Validation
3. List: Admin/Manager,Team Leader,User/Employee
4. This creates a dropdown for easy selection
```

### Tip 3: Highlight Duplicates
```
1. Select column B (Email)
2. Conditional Formatting → Highlight Duplicates
3. Duplicates will be highlighted in red
```

## 📤 Ready to Upload

Once your file looks like this, you're ready to upload:

```
✅ Headers unchanged
✅ All required fields filled
✅ Emails are valid and unique
✅ Passwords are 8+ characters
✅ Role names match exactly
✅ Team names match exactly
✅ Is Active is YES or NO
✅ No duplicate emails
✅ Maximum 500 rows

→ Click "Import Users" and upload your file!
```
