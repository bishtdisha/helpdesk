import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightweight session validation in middleware
// This validates the session exists and is not expired
async function validateSessionToken(token: string): Promise<boolean> {
  try {
    // Call internal API to validate session (lightweight check)
    const response = await fetch(new URL('/api/auth/validate', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.valid === true;
    }
    return false;
  } catch (error) {
    console.error('Session validation error in middleware:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /login, /register)
  const { pathname } = request.nextUrl

  // Get the session token from cookies
  const sessionToken = request.cookies.get('session-token')?.value

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/welcome']
  const isPublicRoute = publicRoutes.includes(pathname)

  // If user is on a public route, let them through
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If user is not authenticated and trying to access a protected route
  if (!sessionToken) {
    // Redirect to login page
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Validate session token (full validation)
  const isValid = await validateSessionToken(sessionToken);
  
  if (!isValid) {
    // Session is invalid or expired - redirect to login
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    // Clear invalid session cookie
    response.cookies.delete('session-token')
    return response
  }

  // Session is valid - let them through
  return NextResponse.next()
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login, register (public pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
}