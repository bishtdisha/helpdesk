import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { knowledgeBaseService } from '@/lib/services/knowledge-base-service';

/**
 * GET /api/knowledge-base/suggest - Suggest articles based on ticket content
 * 
 * Query parameters:
 * - content: Ticket content to analyze (required)
 * - limit: Maximum number of suggestions (optional, default: 5)
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
    const content = searchParams.get('content');

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required for suggestions' },
        { status: 400 }
      );
    }

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(20, Math.max(1, parseInt(limitParam))) : 5;

    // Get article suggestions
    const suggestions = await knowledgeBaseService.suggestArticles(
      content,
      currentUser.id,
      limit
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting articles:', error);

    return NextResponse.json(
      { error: 'Failed to suggest articles' },
      { status: 500 }
    );
  }
}
