import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

/**
 * POST /api/users/bulk-import/export-errors - Export failed rows to Excel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { failedRows } = body;

    if (!failedRows || !Array.isArray(failedRows) || failedRows.length === 0) {
      return NextResponse.json(
        { error: 'No failed rows provided' },
        { status: 400 }
      );
    }

    // Create workbook with failed rows
    const worksheet = XLSX.utils.json_to_sheet(failedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Rows');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 },  // Row Number
      { wch: 25 }, // Name
      { wch: 35 }, // Email
      { wch: 20 }, // Password
      { wch: 20 }, // Role Name
      { wch: 25 }, // Team Name
      { wch: 12 }, // Is Active
      { wch: 50 }, // Error Message
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="user-import-errors-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting failed rows:', error);
    return NextResponse.json(
      { error: 'Failed to export errors' },
      { status: 500 }
    );
  }
}
