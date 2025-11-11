import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { attachmentService } from '@/lib/services/attachment-service';
import {
  AttachmentNotFoundError,
  AttachmentPermissionDeniedError,
} from '@/lib/services/attachment-service';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * GET /api/tickets/:id/attachments/:attachmentId - Download an attachment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const attachmentId = params.attachmentId;

    // Get attachment with access control
    const attachment = await attachmentService.getAttachment(
      attachmentId,
      currentUser.id
    );

    // Get the file path
    const filePath = attachmentService.getAttachmentFilePath(attachment);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        {
          error: 'File not found',
          code: 'FILE_NOT_FOUND',
          message: 'The attachment file could not be found on the server',
        },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Content-Length': attachment.fileSize.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error downloading attachment:', error);
    
    if (error instanceof AttachmentNotFoundError) {
      return NextResponse.json(
        {
          error: 'Attachment not found',
          code: 'ATTACHMENT_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tickets/:id/attachments/:attachmentId - Delete an attachment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const attachmentId = params.attachmentId;

    // Delete attachment (this also deletes the file from storage)
    await attachmentService.deleteAttachment(attachmentId, currentUser.id);

    return NextResponse.json({
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    
    if (error instanceof AttachmentNotFoundError) {
      return NextResponse.json(
        {
          error: 'Attachment not found',
          code: 'ATTACHMENT_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
