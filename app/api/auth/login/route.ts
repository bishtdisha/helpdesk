import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { validateLoginData } from '@/lib/validation';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validate input data
    const validation = validateLoginData({ email, password });
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please check your input data',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Get client information for session
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Attempt login
    const result = await AuthService.login(
      {
        email: email.toLowerCase().trim(),
        password,
      },
      {
        ipAddress,
        userAgent,
      }
    );

    if (!result.success) {
      // Log failed login attempt
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          resourceType: 'user',
          details: {
            email: email.toLowerCase().trim(),
            reason: result.error,
          },
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: result.error || 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: result.user?.id,
        action: 'LOGIN_SUCCESS',
        resourceType: 'user',
        resourceId: result.user?.id,
        details: {
          email: result.user?.email,
          sessionId: result.session?.id,
        },
        ipAddress,
        userAgent,
      },
    });

    // Create response with secure cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: result.user?.id,
          email: result.user?.email,
          name: result.user?.name,
        },
      },
      { status: 200 }
    );

    // Set secure httpOnly cookie with session token
    if (result.session) {
      response.cookies.set('session-token', result.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    
    // Log system error
    try {
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_ERROR',
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
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}