import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { attachmentService, CreateAttachmentData } from '@/lib/services/attachment-service';
import {
  AttachmentPermissionDeniedError,
} from '@/lib/services/attachment-service';

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
 * POST /api/tickets/:id/attachments - Upload an attachment to a ticket
 * 
 * Request body (multipart/form-data):
 * - file: File to upload (required)
 */
export async function POST(
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'file is required',
        },
        { status: 400 }
      );
    }

    // Upload attachment using the service
    const attachment = await attachmentService.uploadAttachment(
      ticketId,
      file,
      currentUser.id
    );

    return NextResponse.json(
      {
        message: 'Attachment uploaded successfully',
        attachment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading attachment:', error);
    
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
