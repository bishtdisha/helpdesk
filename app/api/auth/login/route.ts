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

    // Set secure httpOnly cookies with both session token and JWT
    // For HTTP servers (development/staging), secure must be false
    // For HTTPS servers (production), secure should be true
    const isProduction = process.env.NODE_ENV === 'production';
    const useSecureCookies = process.env.USE_SECURE_COOKIES === 'true' || (isProduction && process.env.USE_SECURE_COOKIES !== 'false');
    
    console.log('🍪 Cookie settings:', { 
      isProduction, 
      useSecureCookies, 
      NODE_ENV: process.env.NODE_ENV,
      USE_SECURE_COOKIES: process.env.USE_SECURE_COOKIES 
    });
    
    if (result.session) {
      // Legacy session token (for backward compatibility)
      response.cookies.set('session-token', result.session.token, {
        httpOnly: true,
        secure: useSecureCookies, // false for HTTP, true for HTTPS
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/',
      });
      console.log('✅ Set session-token cookie');

      // JWT token for fast validation (primary method)
      if ((result.session as any).jwtToken) {
        response.cookies.set('auth-token', (result.session as any).jwtToken, {
          httpOnly: true,
          secure: useSecureCookies, // false for HTTP, true for HTTPS
          sameSite: 'lax',
          maxAge: 24 * 60 * 60, // 24 hours in seconds
          path: '/',
        });
        console.log('✅ Set auth-token cookie');
      } else {
        console.warn('⚠️ No JWT token in session');
      }
    } else {
      console.error('❌ No session in result');
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