import { prisma } from '../db';
import { TicketAttachment } from '@prisma/client';
import { ticketAccessControl } from '../rbac/ticket-access-control';
import { PermissionError } from '../rbac/errors';
import { fileUploadService, FileUploadError } from './file-upload-service';

// Custom errors
export class AttachmentNotFoundError extends Error {
  constructor(attachmentId: string) {
    super(`Attachment not found: ${attachmentId}`);
    this.name = 'AttachmentNotFoundError';
  }
}

export class AttachmentPermissionDeniedError extends PermissionError {
  constructor(action: string, reason: string) {
    super(
      `Cannot ${action} attachment: ${reason}`,
      'ATTACHMENT_PERMISSION_DENIED',
      'tickets:attachments',
      403
    );
  }
}

// Types
export interface CreateAttachmentData {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
}

export interface UploadAttachmentData {
  file: File;
}

export interface AttachmentWithUploader extends TicketAttachment {
  uploader: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Attachment Service
 * Manages ticket attachments with role-based access control
 */
export class AttachmentService {
  /**
   * Upload and attach a file to a ticket
   * User must have access to the ticket to add attachments
   */
  async uploadAttachment(
    ticketId: string,
    file: File,
    userId: string
  ): Promise<AttachmentWithUploader> {
    // Check if user can access this ticket
    const canAccess = await ticketAccessControl.canAccessTicket(userId, ticketId);

    if (!canAccess) {
      throw new AttachmentPermissionDeniedError(
        'add',
        'You do not have permission to add attachments to this ticket'
      );
    }

    // Verify the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    try {
      // Upload the file
      const uploadedFile = await fileUploadService.uploadTicketAttachment(file, ticketId);

      // Create the attachment record
      const attachment = await prisma.ticketAttachment.create({
        data: {
          ticketId,
          uploadedBy: userId,
          fileName: uploadedFile.originalFileName,
          filePath: uploadedFile.filePath,
          fileSize: uploadedFile.fileSize,
          mimeType: uploadedFile.mimeType,
        },
      });
      
      // Fetch the uploader details separately to avoid relation issues
      const uploader = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      
      // Combine the data
      const attachmentWithUploader = {
        ...attachment,
        uploader: uploader!,
      };

      console.log('📝 Creating history entry...');
      // Create history entry
      await this.createAttachmentHistoryEntry(
        ticketId,
        userId,
        'attachment_added',
        attachment.fileName
      );
      console.log('✅ History entry created');

      return attachmentWithUploader as AttachmentWithUploader;
    } catch (error) {
      console.error('❌ Error in uploadAttachment:', error);
      if (error instanceof FileUploadError) {
        throw error;
      }
      throw new Error(`Failed to upload attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add an attachment to a ticket (legacy method for direct data)
   * User must have access to the ticket to add attachments
   */
  async addAttachment(
    ticketId: string,
    data: CreateAttachmentData,
    userId: string
  ): Promise<AttachmentWithUploader> {
    // Check if user can access this ticket
    const canAccess = await ticketAccessControl.canAccessTicket(userId, ticketId);

    if (!canAccess) {
      throw new AttachmentPermissionDeniedError(
        'add',
        'You do not have permission to add attachments to this ticket'
      );
    }

    // Verify the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Create the attachment record
    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId,
        uploadedBy: userId,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create history entry
    await this.createAttachmentHistoryEntry(
      ticketId,
      userId,
      'attachment_added',
      attachment.fileName
    );

    return attachment;
  }

  /**
   * Delete an attachment
   * Only the uploader or Admin can delete attachments
   */
  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    // Get the attachment
    const existingAttachment = await prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: true,
      },
    });

    if (!existingAttachment) {
      throw new AttachmentNotFoundError(attachmentId);
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    // Check if user is the uploader or an Admin
    const isUploader = existingAttachment.uploadedBy === userId;
    const isAdmin = user?.role?.name === 'Admin/Manager';

    if (!isUploader && !isAdmin) {
      throw new AttachmentPermissionDeniedError(
        'delete',
        'You can only delete your own attachments unless you are an Admin'
      );
    }

    // Create history entry before deletion
    await this.createAttachmentHistoryEntry(
      existingAttachment.ticketId,
      userId,
      'attachment_deleted',
      existingAttachment.fileName
    );

    // Delete the file from storage
    try {
      if (fileUploadService.fileExists(existingAttachment.filePath)) {
        await fileUploadService.deleteFile(existingAttachment.filePath);
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the attachment record
    await prisma.ticketAttachment.delete({
      where: { id: attachmentId },
    });
  }

  /**
   * Get all attachments for a ticket
   * User must have access to the ticket to view attachments
   */
  async getAttachments(
    ticketId: string,
    userId: string
  ): Promise<AttachmentWithUploader[]> {
    // Check if user can access this ticket
    const canAccess = await ticketAccessControl.canAccessTicket(userId, ticketId);

    if (!canAccess) {
      throw new AttachmentPermissionDeniedError(
        'view',
        'You do not have permission to view attachments on this ticket'
      );
    }

    const attachments = await prisma.ticketAttachment.findMany({
      where: { ticketId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return attachments;
  }

  /**
   * Get a single attachment
   */
  async getAttachment(
    attachmentId: string,
    userId: string
  ): Promise<AttachmentWithUploader> {
    const attachment = await prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticket: true,
      },
    });

    if (!attachment) {
      throw new AttachmentNotFoundError(attachmentId);
    }

    // Check if user can access the ticket
    const canAccess = await ticketAccessControl.canAccessTicket(userId, attachment.ticketId);

    if (!canAccess) {
      throw new AttachmentPermissionDeniedError(
        'view',
        'You do not have permission to view this attachment'
      );
    }

    return attachment;
  }

  /**
   * Create a history entry for attachment operations
   */
  private async createAttachmentHistoryEntry(
    ticketId: string,
    userId: string,
    action: string,
    fileName: string
  ): Promise<void> {
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        userId,
        action,
        fieldName: 'attachments',
        oldValue: null,
        newValue: fileName,
      },
    });
  }

  /**
   * Get attachment file path for download
   */
  getAttachmentFilePath(attachment: TicketAttachment): string {
    return fileUploadService.getFullPath(attachment.filePath);
  }

  /**
   * Check if attachment file exists
   */
  attachmentFileExists(attachment: TicketAttachment): boolean {
    return fileUploadService.fileExists(attachment.filePath);
  }
}

// Export singleton instance
export const attachmentService = new AttachmentService();
