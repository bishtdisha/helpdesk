import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { ticketService } from '@/lib/services/ticket-service';
import { auditService } from '@/lib/services/audit-service';
import { TicketPriority, TicketStatus } from '@prisma/client';
import * as XLSX from 'xlsx';

interface BulkImportRow {
  title: string;
  description: string;
  priority: string;
  status?: string;
  category?: string;
  assignedToEmail: string;
  customerEmail?: string;
  teamName?: string;
  phone?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  tickets: any[];
}

/**
 * POST /api/tickets/bulk-import - Import tickets from Excel file
 * 
 * Accepts multipart/form-data with an Excel file
 * Expected columns:
 * - Title (required)
 * - Description (required)
 * - Priority (required: LOW, MEDIUM, HIGH, URGENT)
 * - Status (optional: OPEN, IN_PROGRESS, WAITING_FOR_CUSTOMER, RESOLVED, CLOSED)
 * - Category (optional)
 * - Assigned To Email (required)
 * - Customer Email (optional)
 * - Team Name (optional)
 * - Phone (optional)
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

    // Check if user has permission to create tickets (basic check)
    // You might want to add more specific permission checks here

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
    if (rows.length > 1000) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Maximum 1000 tickets can be imported at once',
        },
        { status: 400 }
      );
    }

    // Get all users and teams for lookup
    const { prisma } = await import('@/lib/db');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });
    const teams = await prisma.team.findMany({
      select: { id: true, name: true },
    });

    // Create lookup maps
    const userByEmail = new Map(users.map(u => [u.email.toLowerCase(), u]));
    const teamByName = new Map(teams.map(t => [t.name.toLowerCase(), t]));

    // Process rows
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      tickets: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and has header row

      try {
        // Map Excel columns to our format (case-insensitive)
        const data: BulkImportRow = {
          title: row['Title'] || row['title'] || '',
          description: row['Description'] || row['description'] || '',
          priority: (row['Priority'] || row['priority'] || '').toUpperCase(),
          status: row['Status'] || row['status'] || undefined,
          category: row['Category'] || row['category'] || undefined,
          assignedToEmail: (row['Assigned To Email'] || row['assigned to email'] || row['AssignedToEmail'] || '').toLowerCase(),
          customerEmail: (row['Customer Email'] || row['customer email'] || row['CustomerEmail'] || '').toLowerCase() || undefined,
          teamName: row['Team Name'] || row['team name'] || row['TeamName'] || undefined,
          phone: row['Phone'] || row['phone'] || undefined,
        };

        // Validate required fields
        if (!data.title || data.title.trim().length === 0) {
          result.errors.push({
            row: rowNumber,
            error: 'Title is required',
            data: { title: data.title },
          });
          result.failed++;
          continue;
        }

        if (!data.description || data.description.trim().length === 0) {
          result.errors.push({
            row: rowNumber,
            error: 'Description is required',
            data: { title: data.title },
          });
          result.failed++;
          continue;
        }

        if (!data.priority) {
          result.errors.push({
            row: rowNumber,
            error: 'Priority is required',
            data: { title: data.title },
          });
          result.failed++;
          continue;
        }

        if (!data.assignedToEmail) {
          result.errors.push({
            row: rowNumber,
            error: 'Assigned To Email is required',
            data: { title: data.title },
          });
          result.failed++;
          continue;
        }

        // Validate priority
        if (!Object.values(TicketPriority).includes(data.priority as TicketPriority)) {
          result.errors.push({
            row: rowNumber,
            error: `Invalid priority "${data.priority}". Must be one of: LOW, MEDIUM, HIGH, URGENT`,
            data: { title: data.title, priority: data.priority },
          });
          result.failed++;
          continue;
        }

        // Validate status if provided
        if (data.status) {
          const statusUpper = data.status.toUpperCase();
          if (!Object.values(TicketStatus).includes(statusUpper as TicketStatus)) {
            result.errors.push({
              row: rowNumber,
              error: `Invalid status "${data.status}". Must be one of: OPEN, IN_PROGRESS, WAITING_FOR_CUSTOMER, RESOLVED, CLOSED`,
              data: { title: data.title, status: data.status },
            });
            result.failed++;
            continue;
          }
          data.status = statusUpper;
        }

        // Lookup assigned user
        const assignedUser = userByEmail.get(data.assignedToEmail);
        if (!assignedUser) {
          result.errors.push({
            row: rowNumber,
            error: `Assigned user not found with email: ${data.assignedToEmail}`,
            data: { title: data.title, assignedToEmail: data.assignedToEmail },
          });
          result.failed++;
          continue;
        }

        // Lookup customer if provided
        let customerId: string | undefined;
        if (data.customerEmail) {
          const customer = userByEmail.get(data.customerEmail);
          if (!customer) {
            result.errors.push({
              row: rowNumber,
              error: `Customer not found with email: ${data.customerEmail}`,
              data: { title: data.title, customerEmail: data.customerEmail },
            });
            result.failed++;
            continue;
          }
          customerId = customer.id;
        }

        // Lookup team if provided
        let teamId: string | undefined;
        if (data.teamName) {
          const team = teamByName.get(data.teamName.toLowerCase());
          if (!team) {
            result.errors.push({
              row: rowNumber,
              error: `Team not found with name: ${data.teamName}`,
              data: { title: data.title, teamName: data.teamName },
            });
            result.failed++;
            continue;
          }
          teamId = team.id;
        }

        // Create ticket
        const ticket = await ticketService.createTicket(
          {
            title: data.title.trim(),
            description: data.description.trim(),
            priority: data.priority as TicketPriority,
            status: data.status as TicketStatus | undefined,
            category: data.category?.trim(),
            assignedTo: assignedUser.id,
            customerId,
            teamId,
            phone: data.phone?.trim(),
          },
          currentUser.id
        );

        result.tickets.push({
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          assignedTo: assignedUser.name,
        });
        result.success++;
      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: { title: row['Title'] || row['title'] },
        });
        result.failed++;
      }
    }

    // Log audit entry
    await auditService.logTicketOperation(
      currentUser.id,
      'tickets_bulk_imported',
      'bulk',
      { 
        fileName: file.name,
        totalRows: rows.length,
        success: result.success,
        failed: result.failed,
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

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
 * GET /api/tickets/bulk-import - Download Excel template
 */
export async function GET() {
  try {
    // Create sample data
    const sampleData = [
      {
        'Title': 'Sample Ticket 1',
        'Description': 'This is a sample ticket description',
        'Priority': 'HIGH',
        'Status': 'OPEN',
        'Category': 'Technical Support',
        'Assigned To Email': 'agent@example.com',
        'Customer Email': 'customer@example.com',
        'Team Name': 'Support Team',
        'Phone': '+1234567890',
      },
      {
        'Title': 'Sample Ticket 2',
        'Description': 'Another sample ticket',
        'Priority': 'MEDIUM',
        'Status': 'IN_PROGRESS',
        'Category': 'Billing',
        'Assigned To Email': 'agent@example.com',
        'Customer Email': '',
        'Team Name': '',
        'Phone': '',
      },
    ];

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Title
      { wch: 50 }, // Description
      { wch: 12 }, // Priority
      { wch: 20 }, // Status
      { wch: 20 }, // Category
      { wch: 30 }, // Assigned To Email
      { wch: 30 }, // Customer Email
      { wch: 20 }, // Team Name
      { wch: 15 }, // Phone
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ticket-import-template.xlsx"',
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
