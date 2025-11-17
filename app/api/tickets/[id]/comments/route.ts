import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { commentService, CreateCommentData } from '@/lib/services/comment-service';
import {
  CommentPermissionDeniedError,
} from '@/lib/services/comment-service';

/**
 * GET /api/tickets/:id/comments - Get all comments for a ticket
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

    // Get comments
    const comments = await commentService.getComments(ticketId, currentUser.id);

    return NextResponse.json({
      comments,
      total: comments.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    
    if (error instanceof CommentPermissionDeniedError) {
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
 * POST /api/tickets/:id/comments - Add a comment to a ticket
 * 
 * Request body:
 * - content: Comment content (required)
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

    // Parse request body
    const body = await request.json();
    const { content, isInternal } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'content is required',
        },
        { status: 400 }
      );
    }

    // Validate content is a string and not empty
    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Comment content cannot be empty',
        },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > 5000) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Comment content cannot exceed 5000 characters',
        },
        { status: 400 }
      );
    }

    const commentData: CreateCommentData = {
      content: content.trim(),
      isInternal: isInternal || false,
    };

    // Add comment
    const comment = await commentService.addComment(
      ticketId,
      commentData,
      currentUser.id
    );

    return NextResponse.json(
      {
        message: 'Comment added successfully',
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding comment:', error);
    
    if (error instanceof CommentPermissionDeniedError) {
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
