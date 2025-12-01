import { prisma } from '../db';
import { Comment } from '@prisma/client';
import { ticketAccessControl } from '../rbac/ticket-access-control';
import { PermissionError } from '../rbac/errors';


// Custom errors
export class CommentNotFoundError extends Error {
  constructor(commentId: string) {
    super(`Comment not found: ${commentId}`);
    this.name = 'CommentNotFoundError';
  }
}

export class CommentPermissionDeniedError extends PermissionError {
  constructor(action: string, reason: string) {
    super(
      `Cannot ${action} comment: ${reason}`,
      'COMMENT_PERMISSION_DENIED',
      'tickets:comments',
      403
    );
  }
}

// Types
export interface CreateCommentData {
  content: string;
  isInternal?: boolean;
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Comment Service
 * Manages ticket comments with role-based access control
 */
export class CommentService {
  /**
   * Add a comment to a ticket
   * User must have access to the ticket to add comments
   */
  async addComment(
    ticketId: string,
    data: CreateCommentData,
    userId: string
  ): Promise<CommentWithAuthor> {
    // Check if user can access this ticket
    const canAccess = await ticketAccessControl.canAccessTicket(userId, ticketId);

    if (!canAccess) {
      throw new CommentPermissionDeniedError(
        'add',
        'You do not have permission to comment on this ticket'
      );
    }

    // Verify the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        ticketId,
        authorId: userId,
        isInternal: data.isInternal || false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create history entry
    await this.createCommentHistoryEntry(ticketId, userId, 'comment_added', comment.id);

    return comment;
  }

  /**
   * Update a comment
   * Only the comment author can update their own comments
   */
  async updateComment(
    commentId: string,
    data: UpdateCommentData,
    userId: string
  ): Promise<CommentWithAuthor> {
    // Get the comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        ticket: true,
      },
    });

    if (!existingComment) {
      throw new CommentNotFoundError(commentId);
    }

    // Check if user is the author
    if (existingComment.authorId !== userId) {
      throw new CommentPermissionDeniedError(
        'update',
        'You can only update your own comments'
      );
    }

    // Update the comment
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: data.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create history entry
    await this.createCommentHistoryEntry(
      existingComment.ticketId,
      userId,
      'comment_updated',
      commentId
    );

    return comment;
  }

  /**
   * Delete a comment
   * Only the comment author or Admin can delete comments
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    // Get the comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        ticket: true,
      },
    });

    if (!existingComment) {
      throw new CommentNotFoundError(commentId);
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    // Check if user is the author or an Admin
    const isAuthor = existingComment.authorId === userId;
    const isAdmin = user?.role?.name === 'Admin/Manager';

    if (!isAuthor && !isAdmin) {
      throw new CommentPermissionDeniedError(
        'delete',
        'You can only delete your own comments unless you are an Admin'
      );
    }

    // Create history entry before deletion
    await this.createCommentHistoryEntry(
      existingComment.ticketId,
      userId,
      'comment_deleted',
      commentId
    );

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    });
  }

  /**
   * Get all comments for a ticket
   * User must have access to the ticket to view comments
   */
  async getComments(ticketId: string, userId: string): Promise<CommentWithAuthor[]> {
    // Check if user can access this ticket
    const canAccess = await ticketAccessControl.canAccessTicket(userId, ticketId);

    if (!canAccess) {
      throw new CommentPermissionDeniedError(
        'view',
        'You do not have permission to view comments on this ticket'
      );
    }

    const comments = await prisma.comment.findMany({
      where: { ticketId },
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
    });

    return comments;
  }

  /**
   * Get a single comment
   */
  async getComment(commentId: string, userId: string): Promise<CommentWithAuthor> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticket: true,
      },
    });

    if (!comment) {
      throw new CommentNotFoundError(commentId);
    }

    // Check if user can access the ticket
    const canAccess = await ticketAccessControl.canAccessTicket(userId, comment.ticketId);

    if (!canAccess) {
      throw new CommentPermissionDeniedError(
        'view',
        'You do not have permission to view this comment'
      );
    }

    return comment;
  }

  /**
   * Create a history entry for comment operations
   */
  private async createCommentHistoryEntry(
    ticketId: string,
    userId: string,
    action: string,
    commentId: string
  ): Promise<void> {
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        userId,
        action,
        fieldName: 'comments',
        oldValue: null,
        newValue: commentId,
      },
    });
  }
}

// Export singleton instance
export const commentService = new CommentService();
