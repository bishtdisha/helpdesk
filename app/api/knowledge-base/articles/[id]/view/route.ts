import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { knowledgeBaseService } from '@/lib/services/knowledge-base-service';
import {
  ArticleNotFoundError,
  ArticleAccessDeniedError,
} from '@/lib/services/knowledge-base-service';

/**
 * POST /api/knowledge-base/articles/:id/view - Record a view for an article
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

    await knowledgeBaseService.recordView(params.id, currentUser.id);

    return NextResponse.json({ message: 'View recorded successfully' });
  } catch (error) {
    console.error('Error recording view:', error);
    
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
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
