import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/knowledge-base/categories - List all categories
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

    // Get all categories with their parent-child relationships
    const categories = await prisma.kBCategory.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            articleCategories: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);

    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-base/categories - Create a new category (Admin only)
 * 
 * Request body:
 * - name: Category name (required)
 * - description: Category description (optional)
 * - parentId: Parent category ID (optional)
 * - accessLevel: Access level (optional, default: PUBLIC)
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

    // Check if user is Admin (simplified check - should use proper RBAC)
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { role: true },
    });

    if (!user?.role || user.role.name !== 'Admin/Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create categories' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Create the category
    const category = await prisma.kBCategory.create({
      data: {
        name: body.name,
        description: body.description,
        parentId: body.parentId,
        accessLevel: body.accessLevel || 'PUBLIC',
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);

    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
