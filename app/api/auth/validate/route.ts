import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';

/**
 * Lightweight session validation endpoint
 * Used by middleware for fast authentication checks
 * Does NOT return full user data - only validates session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 400 }
      );
    }

    // Use lightweight validation (no user data fetch)
    const result = await AuthService.validateSessionLightweight(token);

    return NextResponse.json(
      { valid: result.valid },
      {
        headers: {
          // Cache for 30 seconds
          'Cache-Control': 'private, max-age=30',
        },
      }
    );
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
