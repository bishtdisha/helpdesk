import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { attachmentService, CreateAttachmentData } from '@/lib/services/attachment-service';
import {
  AttachmentPermissionDeniedError,
} from '@/lib/services/attachment-service';

// Configure route to handle file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/tickets/:id/attachments - Get all attachments for a ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const ticketId = params.id;

    // Get attachments
    const attachments = await attachmentService.getAttachments(ticketId, currentUser.id);

    return NextResponse.json({
      attachments,
      total: attachments.length,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    
    if (error instanceof AttachmentPermissionDeniedError) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: error.code,
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('Ticket not found')) {
      return NextResponse.json(
        {
          error: 'Ticket not found',
          code: 'TICKET_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets/:id/attachments - Upload one or multiple attachments to a ticket
 * 
 * Request body (multipart/form-data):
 * - files: File(s) to upload (required, can be multiple)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 POST /api/tickets/[id]/attachments called');
    console.log('   Ticket ID:', params.id);
    
    const currentUser = await getCurrentUser();
    console.log('   Current user:', currentUser?.id, currentUser?.name);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const ticketId = params.id;

    // Parse multipart form data
    console.log('📦 Parsing form data...');
    const formData = await request.formData();
    console.log('   Form data parsed');
    
    // Get all files from the form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      console.log('   Form entry:', key, value instanceof File ? `File: ${value.name}` : value);
      if (value instanceof File) {
        files.push(value);
      }
    }
    console.log('   Total files found:', files.length);

    if (files.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'At least one file is required',
        },
        { status: 400 }
      );
    }

    // Validate total size (50MB limit for all files combined)
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: `Total file size ${Math.round(totalSize / 1024 / 1024)}MB exceeds maximum allowed size of 50MB`,
        },
        { status: 400 }
      );
    }

    // Upload all attachments
    console.log('📤 Starting upload process for', files.length, 'file(s)...');
    const uploadedAttachments = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n📎 Processing file ${i + 1}/${files.length}: ${file.name}`);
      try {
        const attachment = await attachmentService.uploadAttachment(
          ticketId,
          file,
          currentUser.id
        );
        console.log(`✅ File ${i + 1} uploaded successfully`);
        uploadedAttachments.push(attachment);
      } catch (error) {
        console.error(`❌ File ${i + 1} upload failed:`, error);
        // Collect errors but continue processing other files
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    console.log('\n📊 Upload summary:');
    console.log('   Successful:', uploadedAttachments.length);
    console.log('   Failed:', errors.length);

    // If all files failed, return error
    if (uploadedAttachments.length === 0) {
      return NextResponse.json(
        {
          error: 'Upload failed',
          code: 'UPLOAD_FAILED',
          message: 'All file uploads failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Return success with any partial errors
    const response: any = {
      message: uploadedAttachments.length === files.length
        ? 'All attachments uploaded successfully'
        : 'Some attachments uploaded successfully',
      attachments: uploadedAttachments,
      total: uploadedAttachments.length,
    };

    if (errors.length > 0) {
      response.partialErrors = errors;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('❌ Error uploading attachments:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof AttachmentPermissionDeniedError) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: error.code,
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('Ticket not found')) {
      return NextResponse.json(
        {
          error: 'Ticket not found',
          code: 'TICKET_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

    // Handle file upload errors
    if (error instanceof Error && (
      error.message.includes('File size') ||
      error.message.includes('File type') ||
      error.message.includes('FILE_')
    )) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
