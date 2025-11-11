import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { validateLoginData } from '@/lib/validation';

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
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: result.error || 'Invalid credentials',
        },
        { status: 401 }
      );
    }

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
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}