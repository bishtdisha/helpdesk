import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session-token')?.value;
    
    // Get client information for audit logging
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

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

    // Validate session to get user info for audit logging
    const sessionValidation = await AuthService.validateSession(sessionToken);
    const userId = sessionValidation.valid ? sessionValidation.user?.id : undefined;

    // Attempt to invalidate the session
    const logoutSuccess = await AuthService.logout(sessionToken);

    // Log the logout action (whether successful or not)
    await prisma.auditLog.create({
      data: {
        userId,
        action: logoutSuccess ? 'LOGOUT_SUCCESS' : 'LOGOUT_ATTEMPTED',
        resourceType: 'user',
        resourceId: userId,
        details: {
          sessionToken: sessionToken.substring(0, 8) + '...', // Log partial token for debugging
          success: logoutSuccess,
        },
        ipAddress,
        userAgent,
      },
    });

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
    
    // Log system error
    try {
      await prisma.auditLog.create({
        data: {
          action: 'LOGOUT_ERROR',
          resourceType: 'system',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }
    
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