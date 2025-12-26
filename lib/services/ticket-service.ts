import { prisma } from '../db';
import { Ticket, TicketStatus, TicketPriority, Prisma } from '@prisma/client';
import { ticketAccessControl } from '../rbac/ticket-access-control';
import { PermissionError } from '../rbac/errors';

import { slaService } from './sla-service';
import { fileUploadService } from './file-upload-service';
import { EmailService } from './email-service';

// Types for ticket operations
export interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  category?: string;
  customerId?: string;
  teamId?: string;
  assignedTo: string;
  phone?: string;
  status?: TicketStatus;
  followerIds?: string[];
  customSlaDueAt?: string; // Custom SLA override
}

export interface CreateTicketWithAttachmentsAndCommentsData {
  title: string;
  description: string;
  priority: TicketPriority;
  category?: string;
  customerId?: string;
  teamId?: string;
  assignedTo: string;
  phone?: string;
  status?: TicketStatus;
  attachments?: File[];
  initialComment?: string;
  isCommentInternal?: boolean;
  followerIds?: string[];
  customSlaDueAt?: string; // Custom SLA override
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedTo?: string;
  teamId?: string;
  customerId?: string;
  phone?: string;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  teamId?: string;
  assignedTo?: string;
  createdBy?: string;
  customerId?: string;
  search?: string;
  month?: string; // Format: YYYY-MM
  page?: number;
  limit?: number;
}

export interface PaginatedTickets {
  data: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Custom errors
export class TicketNotFoundError extends PermissionError {
  constructor(ticketId: string) {
    super(
      `Ticket not found: ${ticketId}`,
      'TICKET_NOT_FOUND',
      'tickets:read',
      404
    );
  }
}

export class TicketAccessDeniedError extends PermissionError {
  constructor(ticketId: string, userId: string) {
    super(
      `Access denied to ticket ${ticketId} for user ${userId}`,
      'TICKET_ACCESS_DENIED',
      'tickets:read',
      403
    );
  }
}

export class TicketAssignmentDeniedError extends PermissionError {
  constructor(ticketId: string, reason: string) {
    super(
      `Cannot assign ticket ${ticketId}: ${reason}`,
      'TICKET_ASSIGNMENT_DENIED',
      'tickets:assign',
      403
    );
  }
}

export class InvalidTicketStatusTransitionError extends Error {
  public code = 'INVALID_STATUS_TRANSITION';
  public from: TicketStatus;
  public to: TicketStatus;
  public allowedTransitions: TicketStatus[];

  constructor(from: TicketStatus, to: TicketStatus, allowedTransitions: TicketStatus[]) {
    const fromFormatted = from.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    const toFormatted = to.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    const allowedFormatted = allowedTransitions
      .map(s => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()))
      .join(', ');
    
    super(
      `Cannot change status from "${fromFormatted}" to "${toFormatted}". ` +
      `Valid next statuses are: ${allowedFormatted}. ` +
      `Please update the status to one of these options first.`
    );
    this.name = 'InvalidTicketStatusTransitionError';
    this.from = from;
    this.to = to;
    this.allowedTransitions = allowedTransitions;
  }
}

/**
 * Ticket Service
 * Handles all ticket management operations with role-based access control
 */
export class TicketService {
  /**
   * Validate foreign key references exist in the database
   * @throws Error if any foreign key reference is invalid
   */
  private async validateForeignKeys(data: CreateTicketData): Promise<void> {
    // Validate customer (user) exists if provided (and not empty string)
    if (data.customerId && data.customerId.trim() !== '') {
      const customer = await prisma.user.findUnique({
        where: { id: data.customerId },
      });
      if (!customer) {
        throw new Error(`User with ID ${data.customerId} does not exist`);
      }
    }

    // Validate team exists if provided (and not empty string)
    if (data.teamId && data.teamId.trim() !== '') {
      const team = await prisma.team.findUnique({
        where: { id: data.teamId },
      });
      if (!team) {
        throw new Error(`Team with ID ${data.teamId} does not exist`);
      }
    }

    // Validate assignedTo user exists if provided
    if (data.assignedTo) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assignedTo },
      });
      if (!assignee) {
        throw new Error(`Assigned user with ID ${data.assignedTo} does not exist`);
      }
    }
  }

  /**
   * Create a new ticket
   */
  async createTicket(data: CreateTicketData, userId: string): Promise<Ticket> {
    
    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Title is required and cannot be empty');
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Description is required and cannot be empty');
    }
    if (!data.priority) {
      throw new Error('Priority is required');
    }
    if (!data.assignedTo) {
      throw new Error('Assignee is required');
    }

    // Validate foreign key references
    await this.validateForeignKeys(data);

    // Calculate SLA due date based on priority
    const tempTicket = {
      priority: data.priority,
      createdAt: new Date(),
    } as Ticket;
    const slaDueAt = await slaService.calculateSLADueDate(tempTicket);

    // Parse custom SLA if provided
    const customSlaDueAt = data.customSlaDueAt ? new Date(data.customSlaDueAt) : null;

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        customerId: data.customerId || undefined, // Convert empty string to undefined
        createdBy: userId,
        teamId: data.teamId || undefined, // Convert empty string to undefined
        assignedTo: data.assignedTo,
        phone: data.phone,
        status: data.status || TicketStatus.OPEN,
        slaDueAt: slaDueAt,
        customSlaDueAt: customSlaDueAt,
      },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: true,
      },
    });

    // Add followers if provided
    if (data.followerIds && data.followerIds.length > 0) {
      await prisma.ticketFollower.createMany({
        data: data.followerIds.map(followerId => ({
          ticketId: ticket.id,
          userId: followerId,
        })),
        skipDuplicates: true,
      });

      // Create history entry for followers
      const followerUsers = await prisma.user.findMany({
        where: { id: { in: data.followerIds } },
        select: { name: true },
      });
      const followerNames = followerUsers.map(u => u.name).join(', ');
      await this.createHistoryEntry(
        ticket.id,
        userId,
        'followers_added',
        null,
        null,
        `Added followers: ${followerNames}`
      );
    }

    // Create history entry
    await this.createHistoryEntry(ticket.id, userId, 'created', null, null, null);

    // Send email notification to assigned user with followers in CC (async, non-blocking)
    this.sendTicketCreationEmail(ticket, data).catch(() => {});

    return ticket;
  }

  /**
   * Send ticket creation email notification (non-blocking)
   */
  private async sendTicketCreationEmail(ticket: any, data: CreateTicketData): Promise<void> {
    try {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assignedTo },
        select: { email: true, name: true },
      });

      if (assignee?.email) {
        let ccEmails: string[] = [];
        if (data.followerIds && data.followerIds.length > 0) {
          const followers = await prisma.user.findMany({
            where: { id: { in: data.followerIds } },
            select: { email: true },
          });
          ccEmails = followers
            .map(f => f.email)
            .filter((email): email is string => email !== null && email !== undefined);
        }

        await EmailService.sendTicketAssignmentEmail(
          assignee.email,
          assignee.name || 'User',
          {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            category: ticket.category || undefined,
            customerName: ticket.customer?.name || undefined,
            creatorName: ticket.creator?.name || undefined,
          },
          ccEmails.length > 0 ? ccEmails : undefined
        );
      }
    } catch {
      // Silently fail - email is not critical
    }
  }

  /**
   * Create a ticket with attachments and initial comment in an atomic transaction
   * This ensures that if any part fails, the entire operation is rolled back
   */
  async createTicketWithAttachmentsAndComments(
    data: CreateTicketWithAttachmentsAndCommentsData,
    userId: string
  ): Promise<Ticket> {
    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Title is required and cannot be empty');
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Description is required and cannot be empty');
    }
    if (!data.priority) {
      throw new Error('Priority is required');
    }
    if (!data.assignedTo) {
      throw new Error('Assignee is required');
    }

    // Validate foreign key references
    await this.validateForeignKeys(data);

    // Calculate SLA due date based on priority
    const tempTicket = {
      priority: data.priority,
      createdAt: new Date(),
    } as Ticket;
    const slaDueAt = await slaService.calculateSLADueDate(tempTicket);

    // Parse custom SLA if provided
    const customSlaDueAt = data.customSlaDueAt ? new Date(data.customSlaDueAt) : null;

    // Upload files first (outside transaction) to avoid long-running transactions
    const uploadedFiles: Array<{
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
    }> = [];

    let tempTicketId: string | null = null;

    try {
      // If there are attachments, we need to upload them
      if (data.attachments && data.attachments.length > 0) {
        // Generate a temporary ticket ID for file storage
        tempTicketId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        for (const file of data.attachments) {
          const uploadedFile = await fileUploadService.uploadTicketAttachment(file, tempTicketId);
          uploadedFiles.push({
            fileName: uploadedFile.originalFileName,
            filePath: uploadedFile.filePath,
            fileSize: uploadedFile.fileSize,
            mimeType: uploadedFile.mimeType,
          });
        }
      }

      // Execute the entire ticket creation in a transaction
      const ticket = await prisma.$transaction(async (tx) => {
        // Create the ticket
        const newTicket = await tx.ticket.create({
          data: {
            title: data.title,
            description: data.description,
            priority: data.priority,
            category: data.category,
            customerId: data.customerId,
            createdBy: userId,
            teamId: data.teamId,
            assignedTo: data.assignedTo,
            phone: data.phone,
            status: data.status || TicketStatus.OPEN,
            slaDueAt: slaDueAt,
            customSlaDueAt: customSlaDueAt,
          },
          include: {
            customer: true,
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: true,
          },
        });

        // If we uploaded files, we need to move them to the correct location and create attachment records
        if (uploadedFiles.length > 0 && tempTicketId) {
          for (const uploadedFile of uploadedFiles) {
            // Update the file path to use the real ticket ID
            const oldPath = uploadedFile.filePath;
            const newPath = oldPath.replace(tempTicketId, newTicket.id);

            // Move the file to the correct location
            await fileUploadService.moveFile(oldPath, newPath);

            // Create attachment record
            await tx.ticketAttachment.create({
              data: {
                ticketId: newTicket.id,
                uploadedBy: userId,
                fileName: uploadedFile.fileName,
                filePath: newPath,
                fileSize: uploadedFile.fileSize,
                mimeType: uploadedFile.mimeType,
              },
            });

            // Create history entry for attachment
            await tx.ticketHistory.create({
              data: {
                ticketId: newTicket.id,
                userId,
                action: 'attachment_added',
                fieldName: 'attachments',
                oldValue: null,
                newValue: uploadedFile.fileName,
              },
            });
          }
        }

        // Create initial comment if provided
        if (data.initialComment && data.initialComment.trim().length > 0) {
          await tx.comment.create({
            data: {
              content: data.initialComment.trim(),
              ticketId: newTicket.id,
              authorId: userId,
              isInternal: data.isCommentInternal || false,
            },
          });

          // Create history entry for comment
          await tx.ticketHistory.create({
            data: {
              ticketId: newTicket.id,
              userId,
              action: 'comment_added',
              fieldName: 'comments',
              oldValue: null,
              newValue: 'Initial comment',
            },
          });
        }

        // Create history entry for ticket creation
        await tx.ticketHistory.create({
          data: {
            ticketId: newTicket.id,
            userId,
            action: 'created',
            fieldName: null,
            oldValue: null,
            newValue: null,
          },
        });

        return newTicket;
      });

      // Fetch the complete ticket with all relationships
      const completeTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          customer: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: true,
          attachments: {
            include: {
              uploader: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          comments: {
            include: {
              author: {
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
          },
        },
      });

      return completeTicket!;
    } catch (error) {
      // If transaction fails, clean up any uploaded files
      if (uploadedFiles.length > 0) {
        for (const uploadedFile of uploadedFiles) {
          try {
            if (fileUploadService.fileExists(uploadedFile.filePath)) {
              await fileUploadService.deleteFile(uploadedFile.filePath);
            }
          } catch (cleanupError) {
            console.error('Error cleaning up uploaded file:', cleanupError);
            // Continue cleanup even if one file fails
          }
        }
      }

      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Get a ticket by ID with access control
   */
  async getTicket(ticketId: string, userId: string): Promise<Ticket> {
    // Check if user can access this ticket
    const canAccess = await ticketAccessControl.canAccessTicket(userId, ticketId);
    
    if (!canAccess) {
      throw new TicketAccessDeniedError(ticketId, userId);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: true,
        comments: {
          include: {
            author: {
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
        },
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        followers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        history: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50, // Limit history to last 50 entries
        },
      },
    });

    if (!ticket) {
      throw new TicketNotFoundError(ticketId);
    }

    return ticket;
  }

  /**
   * Update a ticket with role-based restrictions
   */
  async updateTicket(
    ticketId: string,
    data: UpdateTicketData,
    userId: string
  ): Promise<Ticket> {
    // Check if user can update this ticket
    const canUpdate = await ticketAccessControl.canPerformAction(userId, ticketId, 'update');
    
    if (!canUpdate) {
      throw new TicketAccessDeniedError(ticketId, userId);
    }

    // Get current ticket for history tracking
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!currentTicket) {
      throw new TicketNotFoundError(ticketId);
    }

    // Validate status transition if status is being changed
    if (data.status && data.status !== currentTicket.status) {
      const isValidTransition = ticketAccessControl.validateStatusTransition(
        currentTicket.status,
        data.status
      );
      
      if (!isValidTransition) {
        const allowedTransitions = ticketAccessControl.getValidStatusTransitions(currentTicket.status);
        throw new InvalidTicketStatusTransitionError(currentTicket.status, data.status, allowedTransitions);
      }
    }

    // Track changes for history
    const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];
    
    if (data.title && data.title !== currentTicket.title) {
      changes.push({ field: 'title', oldValue: currentTicket.title, newValue: data.title });
    }
    if (data.description && data.description !== currentTicket.description) {
      changes.push({ field: 'description', oldValue: currentTicket.description, newValue: data.description });
    }
    if (data.status && data.status !== currentTicket.status) {
      changes.push({ field: 'status', oldValue: currentTicket.status, newValue: data.status });
    }
    if (data.priority && data.priority !== currentTicket.priority) {
      changes.push({ field: 'priority', oldValue: currentTicket.priority, newValue: data.priority });
    }
    if (data.category !== undefined && data.category !== currentTicket.category) {
      changes.push({ 
        field: 'category', 
        oldValue: currentTicket.category || '', 
        newValue: data.category || '' 
      });
    }
    if (data.customerId && data.customerId !== currentTicket.customerId) {
      changes.push({ field: 'customerId', oldValue: currentTicket.customerId, newValue: data.customerId });
    }
    if (data.phone !== undefined && data.phone !== currentTicket.phone) {
      changes.push({ 
        field: 'phone', 
        oldValue: currentTicket.phone || '', 
        newValue: data.phone || '' 
      });
    }
    if (data.assignedTo !== undefined && data.assignedTo !== currentTicket.assignedTo) {
      changes.push({ 
        field: 'assignedTo', 
        oldValue: currentTicket.assignedTo || 'Unassigned', 
        newValue: data.assignedTo || 'Unassigned' 
      });
    }
    if (data.teamId !== undefined && data.teamId !== currentTicket.teamId) {
      changes.push({ 
        field: 'teamId', 
        oldValue: currentTicket.teamId || 'No Team', 
        newValue: data.teamId || 'No Team' 
      });
    }

    // Update the ticket
    const updateData: Prisma.TicketUpdateInput = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      category: data.category,
      phone: data.phone,
    };

    // Handle customer change
    if (data.customerId) {
      updateData.customer = {
        connect: { id: data.customerId }
      };
    }

    // Handle assignee change
    if (data.assignedTo !== undefined) {
      if (data.assignedTo) {
        updateData.assignedUser = {
          connect: { id: data.assignedTo }
        };
      } else {
        updateData.assignedUser = {
          disconnect: true
        };
      }
    }

    // Handle team change
    if (data.teamId !== undefined) {
      if (data.teamId) {
        updateData.team = {
          connect: { id: data.teamId }
        };
      } else {
        updateData.team = {
          disconnect: true
        };
      }
    }

    // Handle status-specific timestamps
    if (data.status === TicketStatus.RESOLVED && currentTicket.status !== TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }
    if (data.status === TicketStatus.CLOSED && currentTicket.status !== TicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    // Recalculate SLA due date if priority changed
    if (data.priority && data.priority !== currentTicket.priority) {
      const updatedTicket = { ...currentTicket, priority: data.priority };
      const newSlaDueAt = await slaService.calculateSLADueDate(updatedTicket as Ticket);
      updateData.slaDueAt = newSlaDueAt;
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: true,
      },
    });

    // Create history entries for all changes
    for (const change of changes) {
      await this.createHistoryEntry(
        ticketId,
        userId,
        'updated',
        change.field,
        change.oldValue,
        change.newValue
      );
    }

    // Send email notification if assignee changed
    if (data.assignedTo && data.assignedTo !== currentTicket.assignedTo && ticket.assignedUser) {
      try {
        await EmailService.sendTicketAssignmentEmail(
          ticket.assignedUser.email,
          ticket.assignedUser.name || 'Team Member',
          {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            category: ticket.category || undefined,
            customerName: ticket.customer?.name || undefined,
            creatorName: ticket.creator?.name || undefined,
          }
        );
        // Email sent successfully
      } catch (emailError) {
        // Log error but don't fail the update
        console.error('Failed to send assignee change email:', emailError);
      }
    }

    return ticket;
  }

  /**
   * Delete a ticket (Admin only)
   */
  async deleteTicket(ticketId: string, userId: string): Promise<void> {
    // Check if user can delete this ticket
    const canDelete = await ticketAccessControl.canPerformAction(userId, ticketId, 'delete');
    
    if (!canDelete) {
      throw new TicketAccessDeniedError(ticketId, userId);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new TicketNotFoundError(ticketId);
    }

    // Create history entry before deletion
    await this.createHistoryEntry(ticketId, userId, 'deleted', null, null, null);

    // Delete the ticket (cascade will handle related records)
    await prisma.ticket.delete({
      where: { id: ticketId },
    });
  }

  /**
   * Close a ticket with permission validation
   */
  async closeTicket(ticketId: string, userId: string): Promise<Ticket> {
    // Check if user can close this ticket
    const canClose = await ticketAccessControl.canPerformAction(userId, ticketId, 'close');
    
    if (!canClose) {
      throw new TicketAccessDeniedError(ticketId, userId);
    }

    // Get current ticket
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!currentTicket) {
      throw new TicketNotFoundError(ticketId);
    }

    // Validate status transition to CLOSED
    const isValidTransition = ticketAccessControl.validateStatusTransition(
      currentTicket.status,
      TicketStatus.CLOSED
    );

    if (!isValidTransition) {
      const allowedTransitions = ticketAccessControl.getValidStatusTransitions(currentTicket.status);
      throw new InvalidTicketStatusTransitionError(currentTicket.status, TicketStatus.CLOSED, allowedTransitions);
    }

    // Update ticket to closed
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
      },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: true,
      },
    });

    // Create history entry
    await this.createHistoryEntry(
      ticketId,
      userId,
      'closed',
      'status',
      currentTicket.status,
      TicketStatus.CLOSED
    );

    // Send notification
    await notificationService.sendTicketStatusChangedNotification(ticket, currentTicket.status);

    return ticket;
  }

  /**
   * Update ticket status with validation
   */
  async updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus,
    userId: string
  ): Promise<Ticket> {
    // Check if user can update this ticket
    const canUpdate = await ticketAccessControl.canPerformAction(userId, ticketId, 'update');
    
    if (!canUpdate) {
      throw new TicketAccessDeniedError(ticketId, userId);
    }

    // Get current ticket
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!currentTicket) {
      throw new TicketNotFoundError(ticketId);
    }

    // Validate status transition
    const isValidTransition = ticketAccessControl.validateStatusTransition(
      currentTicket.status,
      newStatus
    );

    if (!isValidTransition) {
      const allowedTransitions = ticketAccessControl.getValidStatusTransitions(currentTicket.status);
      throw new InvalidTicketStatusTransitionError(currentTicket.status, newStatus, allowedTransitions);
    }

    // Prepare update data
    const updateData: Prisma.TicketUpdateInput = {
      status: newStatus,
    };

    // Set timestamps based on status
    if (newStatus === TicketStatus.RESOLVED && currentTicket.status !== TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }
    if (newStatus === TicketStatus.CLOSED && currentTicket.status !== TicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    // Update ticket
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: true,
      },
    });

    // Create history entry
    await this.createHistoryEntry(
      ticketId,
      userId,
      'status_changed',
      'status',
      currentTicket.status,
      newStatus
    );

    return ticket;
  }

  /**
   * Assign a ticket to a user
   */
  async assignTicket(
    ticketId: string,
    assigneeId: string,
    userId: string
  ): Promise<Ticket> {
    // Check if user can assign this ticket
    const canAssign = await ticketAccessControl.canPerformAction(userId, ticketId, 'assign');
    
    if (!canAssign) {
      throw new TicketAccessDeniedError(ticketId, userId);
    }

    // Check if user can assign to the specific assignee
    const canAssignToUser = await ticketAccessControl.canAssignToUser(
      userId,
      ticketId,
      assigneeId
    );

    if (!canAssignToUser) {
      throw new TicketAssignmentDeniedError(
        ticketId,
        'You do not have permission to assign this ticket to the specified user'
      );
    }

    // Get current ticket for history
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!currentTicket) {
      throw new TicketNotFoundError(ticketId);
    }

    // Verify assignee exists
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new TicketAssignmentDeniedError(ticketId, 'Assignee user not found');
    }

    // Update ticket assignment
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedTo: assigneeId,
        // If ticket is still OPEN, move it to IN_PROGRESS
        status: currentTicket.status === TicketStatus.OPEN 
          ? TicketStatus.IN_PROGRESS 
          : currentTicket.status,
      },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: true,
      },
    });

    // Create history entry
    await this.createHistoryEntry(
      ticketId,
      userId,
      'assigned',
      'assignedTo',
      currentTicket.assignedTo || 'unassigned',
      assigneeId
    );

    // If status changed, log that too
    if (currentTicket.status === TicketStatus.OPEN && ticket.status === TicketStatus.IN_PROGRESS) {
      await this.createHistoryEntry(
        ticketId,
        userId,
        'status_changed',
        'status',
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS
      );
    }

    // Send email notification to new assignee
    if (ticket.assignedUser && assigneeId !== currentTicket.assignedTo) {
      try {
        await EmailService.sendTicketAssignmentEmail(
          ticket.assignedUser.email,
          ticket.assignedUser.name || 'Team Member',
          {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            category: ticket.category || undefined,
            customerName: ticket.customer?.name || undefined,
            creatorName: ticket.creator?.name || undefined,
          }
        );
        // Email sent successfully
      } catch (emailError) {
        // Log error but don't fail the assignment
        console.error('Failed to send assignment email:', emailError);
      }
    }

    return ticket;
  }

  /**
   * List tickets with pagination and role-based filtering
   */
  async listTickets(filters: TicketFilters, userId: string): Promise<PaginatedTickets> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Get role-based filters
    const roleFilters = await ticketAccessControl.getTicketFilters(userId);

    // Role-based filtering applied

    // Build where clause
    const where: Prisma.TicketWhereInput = {
      AND: [
        roleFilters, // Apply role-based access control
      ],
    };

    // Apply additional filters
    if (filters.status && filters.status.length > 0) {
      where.AND!.push({ status: { in: filters.status } });
    }

    if (filters.priority && filters.priority.length > 0) {
      where.AND!.push({ priority: { in: filters.priority } });
    }

    if (filters.teamId) {
      where.AND!.push({ teamId: filters.teamId });
    }

    if (filters.assignedTo) {
      where.AND!.push({ assignedTo: filters.assignedTo });
    }

    if (filters.createdBy) {
      where.AND!.push({ createdBy: filters.createdBy });
    }

    if (filters.customerId) {
      where.AND!.push({ customerId: filters.customerId });
    }

    // Search across title and description
    if (filters.search) {
      where.AND!.push({
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }

    // Filter by month (format: YYYY-MM)
    if (filters.month) {
      const [year, month] = filters.month.split('-').map(Number);
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
        where.AND!.push({
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        });
      }
    }

    // Get total count and tickets in parallel for better performance
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
              followers: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Check SLA compliance for a ticket and send notifications if at risk
   */
  async checkSLACompliance(ticketId: string): Promise<void> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        creator: true,
        assignedUser: true,
        team: true,
      },
    });

    if (!ticket) {
      throw new TicketNotFoundError(ticketId);
    }

    // Check SLA compliance
    const compliance = await slaService.checkSLACompliance(ticket);
  }

  /**
   * Get ticket with SLA information
   */
  async getTicketWithSLA(ticketId: string, userId: string): Promise<Ticket & { slaCompliance?: any }> {
    const ticket = await this.getTicket(ticketId, userId);
    
    // Add SLA compliance information
    const slaCompliance = await slaService.checkSLACompliance(ticket);
    
    return {
      ...ticket,
      slaCompliance,
    };
  }

  /**
   * Find similar resolved tickets based on content
   */
  async findSimilarTickets(
    content: string,
    userId: string,
    limit: number = 5,
    excludeId?: string
  ): Promise<Array<{
    id: string;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: Date;
    resolvedAt: Date | null;
    resolutionTime: number | null;
    relevanceScore: number;
  }>> {
    // Get user's role and team information for RBAC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teams: true },
    });

    if (!user) {
      throw new TicketAccessDeniedError('unknown', userId);
    }

    // Build base query with RBAC filtering
    const whereClause: Prisma.TicketWhereInput = {
      status: { in: ['RESOLVED', 'CLOSED'] }, // Only resolved/closed tickets
    };

    // Exclude the current ticket if specified
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    // Apply RBAC filtering
    if (user.role?.name === 'Admin/Manager') {
      // Admin can see all tickets - no additional filtering needed
    } else if (user.role?.name === 'Team Leader') {
      // Team leaders can only see their team's tickets
      const teamIds = user.teams.map(team => team.id);
      whereClause.teamId = { in: teamIds };
    } else {
      // User_Employee can only see tickets they created or are following
      whereClause.OR = [
        { createdById: userId },
        { followers: { some: { userId } } },
      ];
    }

    // Search for tickets with similar content using full-text search
    // Split content into keywords for better matching
    const keywords = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 10); // Limit to first 10 keywords

    if (keywords.length === 0) {
      return [];
    }

    // Use PostgreSQL full-text search if available, otherwise use LIKE
    const searchConditions = keywords.map(keyword => ({
      OR: [
        { title: { contains: keyword, mode: 'insensitive' as const } },
        { description: { contains: keyword, mode: 'insensitive' as const } },
      ],
    }));

    whereClause.AND = searchConditions;

    // Fetch similar tickets
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
      },
      take: limit * 3, // Get more tickets to calculate relevance and filter
      orderBy: [
        { resolvedAt: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    // Calculate relevance scores and resolution times
    const ticketsWithScores = tickets.map(ticket => {
      // Calculate relevance score based on keyword matches
      const titleMatches = keywords.filter(keyword =>
        ticket.title.toLowerCase().includes(keyword)
      ).length;
      const descriptionMatches = keywords.filter(keyword =>
        ticket.description.toLowerCase().includes(keyword)
      ).length;

      // Weight title matches higher than description matches
      const relevanceScore = (titleMatches * 3) + descriptionMatches;

      // Calculate resolution time in hours
      let resolutionTime: number | null = null;
      if (ticket.resolvedAt) {
        resolutionTime = Math.round(
          (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60)
        );
      }

      return {
        ...ticket,
        relevanceScore,
        resolutionTime,
      };
    });

    // Sort by relevance score and return top results
    return ticketsWithScores
      .filter(ticket => ticket.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Create a history entry for ticket changes
   */
  private async createHistoryEntry(
    ticketId: string,
    userId: string,
    action: string,
    fieldName: string | null,
    oldValue: string | null,
    newValue: string | null
  ): Promise<void> {
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        userId,
        action,
        fieldName,
        oldValue,
        newValue,
      },
    });
  }
}

// Export singleton instance
export const ticketService = new TicketService();
