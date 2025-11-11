import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { knowledgeBaseService, KBFilters } from '@/lib/services/knowledge-base-service';
import { KnowledgeAccessLevel } from '@prisma/client';

/**
 * GET /api/knowledge-base/search - Search articles with role-based filtering
 * 
 * Query parameters:
 * - q: Search query (required)
 * - accessLevel: Filter by access level (optional)
 * - teamId: Filter by team ID (optional)
 * - categoryId: Filter by category ID (optional)
 * - isPublished: Filter by published status (optional)
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
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const accessLevelParam = searchParams.get('accessLevel');
    const accessLevel = accessLevelParam && Object.values(KnowledgeAccessLevel).includes(accessLevelParam as KnowledgeAccessLevel)
      ? (accessLevelParam as KnowledgeAccessLevel)
      : undefined;
    
    const teamId = searchParams.get('teamId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const isPublishedParam = searchParams.get('isPublished');
    const isPublished = isPublishedParam !== null ? isPublishedParam === 'true' : undefined;

    // Build filters
    const filters: KBFilters = {
      accessLevel,
      teamId,
      categoryId,
      isPublished,
    };

    // Search articles
    const articles = await knowledgeBaseService.searchArticles(query, currentUser.id, filters);

    return NextResponse.json({ articles, query });
  } catch (error) {
    console.error('Error searching articles:', error);

    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    );
  }
}
