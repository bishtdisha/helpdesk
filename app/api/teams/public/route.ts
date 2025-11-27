import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/teams/public - Public endpoint to list teams for registration
 * 
 * This endpoint is accessible without authentication for the registration form.
 * Returns only basic team information (id and name).
 */
export async function GET(request: NextRequest) {
  try {
    // Get all teams (simple list for registration dropdown)
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      teams,
      total: teams.length,
    });
  } catch (error) {
    console.error('Error fetching public teams:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
