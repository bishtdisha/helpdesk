import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/customers - List customers with search
 * 
 * Query parameters:
 * - search: Search by name or email
 * - limit: Items to return (default: 10, max: 50)
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
    const search = searchParams.get('search') || '';
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

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

    // Fetch customers
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      customers,
      count: customers.length,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
