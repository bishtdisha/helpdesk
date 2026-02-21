import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { permissionEngine } from '@/lib/rbac/permission-engine';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '@/lib/rbac/permissions';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';

interface BulkImportRow {
  name: string;
  email: string;
  password: string;
  roleName?: string;
  teamName?: string;
  isActive?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  users: any[];
  failedRows?: any[]; // Original row data with error messages for export
}

/**
 * POST /api/users/bulk-import - Import users from Excel file
 * 
 * Accepts multipart/form-data with an Excel file
 * Expected columns:
 * - Name (required)
 * - Email (required)
 * - Password (required, min 8 characters)
 * - Role Name (optional, must match existing role name)
 * - Team Name (optional, must match existing team name)
 * - Is Active (optional: YES/NO, default: YES)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has permission to create users (Admin only)
    const hasPermission = await permissionEngine.checkPermission(
      currentUser.id,
      PERMISSION_ACTIONS.CREATE,
      RESOURCE_TYPES.USERS
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can import users',
          requiredPermission: 'users:create'
        },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)',
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Failed to parse Excel file. Please ensure the file is not corrupted.',
        },
        { status: 400 }
      );
    }

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Excel file is empty or has no sheets',
        },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Excel file has no data rows',
        },
        { status: 400 }
      );
    }

    // Validate maximum rows
    if (rows.length > 500) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Maximum 500 users can be imported at once',
        },
        { status: 400 }
      );
    }

    // Get all roles and teams for lookup
    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
    });
    const teams = await prisma.team.findMany({
      select: { id: true, name: true },
    });

    // Create lookup maps (case-insensitive)
    const roleByName = new Map(roles.map(r => [r.name.toLowerCase(), r]));
    const teamByName = new Map(teams.map(t => [t.name.toLowerCase(), t]));

    // Get existing users to check for duplicates
    const existingUsers = await prisma.user.findMany({
      select: { email: true },
    });
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    // Process rows
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      users: [],
      failedRows: [],
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and has header row

      try {
        // Map Excel columns to our format (case-insensitive)
        const data: BulkImportRow = {
          name: (row['Name'] || row['name'] || '').trim(),
          email: (row['Email'] || row['email'] || '').trim().toLowerCase(),
          password: (row['Password'] || row['password'] || '').trim(),
          roleName: (row['Role Name'] || row['role name'] || row['RoleName'] || '').trim(),
          teamName: (row['Team Name'] || row['team name'] || row['TeamName'] || '').trim(),
          isActive: (row['Is Active'] || row['is active'] || row['IsActive'] || 'YES').toString().toUpperCase(),
        };

        // Validate required fields
        if (!data.name) {
          const errorMsg = 'Name is required';
          result.errors.push({
            row: rowNumber,
            error: errorMsg,
            data: { email: data.email },
          });
          result.failedRows?.push({
            ...row,
            'Row Number': rowNumber,
            'Error Message': errorMsg,
          });
          result.failed++;
          continue;
        }

        if (!data.email) {
          const errorMsg = 'Email is required';
          result.errors.push({
            row: rowNumber,
            error: errorMsg,
            data: { name: data.name },
          });
          result.failedRows?.push({
            ...row,
            'Row Number': rowNumber,
            'Error Message': errorMsg,
          });
          result.failed++;
          continue;
        }

        // Validate email format
        if (!emailRegex.test(data.email)) {
          const errorMsg = `Invalid email format: ${data.email}`;
          result.errors.push({
            row: rowNumber,
            error: errorMsg,
            data: { name: data.name, email: data.email },
          });
          result.failedRows?.push({
            ...row,
            'Row Number': rowNumber,
            'Error Message': errorMsg,
          });
          result.failed++;
          continue;
        }

        // Check for duplicate email
        if (existingEmails.has(data.email)) {
          const errorMsg = `Email already exists: ${data.email}`;
          result.errors.push({
            row: rowNumber,
            error: errorMsg,
            data: { name: data.name, email: data.email },
          });
          result.failedRows?.push({
            ...row,
            'Row Number': rowNumber,
            'Error Message': errorMsg,
          });
          result.failed++;
          continue;
        }

        if (!data.password) {
          const errorMsg = 'Password is required';
          result.errors.push({
            row: rowNumber,
            error: errorMsg,
            data: { name: data.name, email: data.email },
          });
          result.failedRows?.push({
            ...row,
            'Row Number': rowNumber,
            'Error Message': errorMsg,
          });
          result.failed++;
          continue;
        }

        // Validate password length
        if (data.password.length < 8) {
          const errorMsg = 'Password must be at least 8 characters';
          result.errors.push({
            row: rowNumber,
            error: errorMsg,
            data: { name: data.name, email: data.email },
          });
          result.failedRows?.push({
            ...row,
            'Row Number': rowNumber,
            'Error Message': errorMsg,
          });
          result.failed++;
          continue;
        }

        // Lookup role if provided
        let roleId: string | undefined;
        if (data.roleName) {
          const role = roleByName.get(data.roleName.toLowerCase());
          if (!role) {
            const errorMsg = `Role not found: ${data.roleName}`;
            result.errors.push({
              row: rowNumber,
              error: errorMsg,
              data: { name: data.name, email: data.email, roleName: data.roleName },
            });
            result.failedRows?.push({
              ...row,
              'Row Number': rowNumber,
              'Error Message': errorMsg,
            });
            result.failed++;
            continue;
          }
          roleId = role.id;
        }

        // Lookup team if provided
        let teamId: string | undefined;
        if (data.teamName) {
          const team = teamByName.get(data.teamName.toLowerCase());
          if (!team) {
            const errorMsg = `Team not found: ${data.teamName}`;
            result.errors.push({
              row: rowNumber,
              error: errorMsg,
              data: { name: data.name, email: data.email, teamName: data.teamName },
            });
            result.failedRows?.push({
              ...row,
              'Row Number': rowNumber,
              'Error Message': errorMsg,
            });
            result.failed++;
            continue;
          }
          teamId = team.id;
        }

        // Parse isActive
        const isActive = data.isActive === 'YES' || data.isActive === 'TRUE' || data.isActive === '1';

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create user
        const newUser = await prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            roleId,
            teamId,
            isActive,
          },
          include: {
            role: true,
            team: true,
          },
        });

        // Add to existing emails set to prevent duplicates within the same import
        existingEmails.add(data.email);

        result.users.push({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role?.name || 'No role',
          team: newUser.team?.name || 'No team',
        });
        result.success++;
      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        result.errors.push({
          row: rowNumber,
          error: errorMsg,
          data: { name: row['Name'] || row['name'], email: row['Email'] || row['email'] },
        });
        result.failedRows?.push({
          ...row,
          'Row Number': rowNumber,
          'Error Message': errorMsg,
        });
        result.failed++;
      }
    }

    return NextResponse.json({
      message: `Import completed: ${result.success} succeeded, ${result.failed} failed`,
      result,
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/bulk-import - Download Excel template
 */
export async function GET() {
  try {
    // Create sample data with instructions
    const sampleData = [
      {
        'Name': 'John Doe',
        'Email': 'john.doe@example.com',
        'Password': 'SecurePass123',
        'Role Name': 'Admin/Manager',
        'Team Name': 'Support Team',
        'Is Active': 'YES',
      },
      {
        'Name': 'Jane Smith',
        'Email': 'jane.smith@example.com',
        'Password': 'SecurePass456',
        'Role Name': 'Team Leader',
        'Team Name': 'Technical Team',
        'Is Active': 'YES',
      },
      {
        'Name': 'Bob Johnson',
        'Email': 'bob.johnson@example.com',
        'Password': 'SecurePass789',
        'Role Name': 'User/Employee',
        'Team Name': '',
        'Is Active': 'NO',
      },
    ];

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 35 }, // Email
      { wch: 20 }, // Password
      { wch: 20 }, // Role Name
      { wch: 25 }, // Team Name
      { wch: 12 }, // Is Active
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="user-import-template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
