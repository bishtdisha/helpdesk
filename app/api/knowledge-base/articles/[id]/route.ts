import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { 
  knowledgeBaseService,
  UpdateArticleData,
} from '@/lib/services/knowledge-base-service';
import { KnowledgeAccessLevel } from '@prisma/client';
import {
  ArticleNotFoundError,
  ArticleAccessDeniedError,
  ArticleCreationDeniedError,
} from '@/lib/services/knowledge-base-service';

/**
 * GET /api/knowledge-base/articles/:id - Get a single article
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

    const article = await knowledgeBaseService.getArticle(params.id, currentUser.id);

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    
    if (error instanceof ArticleNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ArticleAccessDeniedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/knowledge-base/articles/:id - Update an article
 * 
 * Request body:
 * - title: Article title (optional)
 * - content: Article content (optional)
 * - summary: Article summary (optional)
 * - accessLevel: Access level (optional)
 * - teamId: Team ID (optional)
 * - categoryIds: Array of category IDs (optional)
 * - isPublished: Published status (optional)
 */
export async function PUT(
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

    const body = await request.json();

    // Validate access level if provided
    if (body.accessLevel && !Object.values(KnowledgeAccessLevel).includes(body.accessLevel)) {
      return NextResponse.json(
        { error: 'Invalid access level' },
        { status: 400 }
      );
    }

    // Create update data
    const updateData: UpdateArticleData = {
      title: body.title,
      content: body.content,
      summary: body.summary,
      accessLevel: body.accessLevel,
      teamId: body.teamId,
      categoryIds: body.categoryIds,
      isPublished: body.isPublished,
    };

    // Update the article
    const article = await knowledgeBaseService.updateArticle(
      params.id,
      updateData,
      currentUser.id
    );

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error updating article:', error);
    
    if (error instanceof ArticleNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ArticleAccessDeniedError || error instanceof ArticleCreationDeniedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-base/articles/:id - Delete an article (Admin only)
 */
export async function DELETE(
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

    await knowledgeBaseService.deleteArticle(params.id, currentUser.id);

    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    
    if (error instanceof ArticleNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ArticleAccessDeniedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
