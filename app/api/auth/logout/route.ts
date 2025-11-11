import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session-token')?.value;

    // If no session token, consider it already logged out
    if (!sessionToken) {
      return NextResponse.json(
        {
          success: true,
          message: 'Already logged out',
        },
        { status: 200 }
      );
    }

    // Attempt to invalidate the session
    const logoutSuccess = await AuthService.logout(sessionToken);

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
      },
      { status: 200 }
    );

    // Clear the session cookie regardless of whether session existed in database
    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    
    // Even if there's an error, we should still clear the cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout completed',
      },
      { status: 200 }
    );

    // Clear the session cookie
    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}