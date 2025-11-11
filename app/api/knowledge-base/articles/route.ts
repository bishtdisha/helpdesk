import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { 
  knowledgeBaseService, 
  CreateArticleData,
  KBFilters,
} from '@/lib/services/knowledge-base-service';
import { KnowledgeAccessLevel } from '@prisma/client';
import {
  ArticleNotFoundError,
  ArticleAccessDeniedError,
  ArticleCreationDeniedError,
} from '@/lib/services/knowledge-base-service';

/**
 * GET /api/knowledge-base/articles - List articles with role-based filtering
 * 
 * Query parameters:
 * - accessLevel: Filter by access level (PUBLIC, INTERNAL, RESTRICTED)
 * - teamId: Filter by team ID
 * - categoryId: Filter by category ID
 * - isPublished: Filter by published status (true/false)
 * - search: Search by title, content, or summary
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const accessLevelParam = searchParams.get('accessLevel');
    const accessLevel = accessLevelParam && Object.values(KnowledgeAccessLevel).includes(accessLevelParam as KnowledgeAccessLevel)
      ? (accessLevelParam as KnowledgeAccessLevel)
      : undefined;
    
    const teamId = searchParams.get('teamId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const isPublishedParam = searchParams.get('isPublished');
    const isPublished = isPublishedParam !== null ? isPublishedParam === 'true' : undefined;
    const search = searchParams.get('search') || undefined;

    // Build filters
    const filters: KBFilters = {
      accessLevel,
      teamId,
      categoryId,
      isPublished,
      search,
    };

    // Get articles with role-based filtering
    const articles = await knowledgeBaseService.listArticles(currentUser.id, filters);

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    
    if (error instanceof ArticleAccessDeniedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-base/articles - Create a new article (Admin/Team Leader only)
 * 
 * Request body:
 * - title: Article title (required)
 * - content: Article content (required)
 * - summary: Article summary (optional)
 * - accessLevel: Access level (PUBLIC, INTERNAL, RESTRICTED) (required)
 * - teamId: Team ID for restricted articles (optional)
 * - categoryIds: Array of category IDs (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.content || !body.accessLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, accessLevel' },
        { status: 400 }
      );
    }

    // Validate access level
    if (!Object.values(KnowledgeAccessLevel).includes(body.accessLevel)) {
      return NextResponse.json(
        { error: 'Invalid access level' },
        { status: 400 }
      );
    }

    // Create article data
    const articleData: CreateArticleData = {
      title: body.title,
      content: body.content,
      summary: body.summary,
      accessLevel: body.accessLevel,
      teamId: body.teamId,
      categoryIds: body.categoryIds,
    };

    // Create the article
    const article = await knowledgeBaseService.createArticle(articleData, currentUser.id);

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    
    if (error instanceof ArticleCreationDeniedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
