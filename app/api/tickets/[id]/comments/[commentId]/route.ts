import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { commentService, UpdateCommentData } from '@/lib/services/comment-service';
import {
  CommentNotFoundError,
  CommentPermissionDeniedError,
} from '@/lib/services/comment-service';

/**
 * PUT /api/tickets/:id/comments/:commentId - Update a comment
 * 
 * Request body:
 * - content: Updated comment content (required)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const commentId = params.commentId;

    // Parse request body
    const body = await request.json();
    const { content } = body;

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

    const updateData: UpdateCommentData = {
      content: content.trim(),
    };

    // Update comment
    const comment = await commentService.updateComment(
      commentId,
      updateData,
      currentUser.id
    );

    return NextResponse.json({
      message: 'Comment updated successfully',
      comment,
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    
    if (error instanceof CommentNotFoundError) {
      return NextResponse.json(
        {
          error: 'Comment not found',
          code: 'COMMENT_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tickets/:id/comments/:commentId - Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const commentId = params.commentId;

    // Delete comment
    await commentService.deleteComment(commentId, currentUser.id);

    return NextResponse.json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    
    if (error instanceof CommentNotFoundError) {
      return NextResponse.json(
        {
          error: 'Comment not found',
          code: 'COMMENT_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
