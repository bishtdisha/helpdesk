import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/customers - List customers with search and pagination
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - search: Search by name, email, or company
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || '';

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get total count
    const total = await prisma.customer.count({ where });

    // Fetch customers with pagination
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
      },
      orderBy: {
        name: 'asc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      customers,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
