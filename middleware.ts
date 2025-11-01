import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth/register',
  '/api/auth/login',
];

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
];

// Define API routes that require authentication
const protectedApiRoutes = [
  '/api/auth/logout',
];

/**
 * Check if a path matches any of the given route patterns
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route === pathname) return true;
    if (route.endsWith('*')) {
      const baseRoute = route.slice(0, -1);
      return pathname.startsWith(baseRoute);
    }
    return false;
  });
}

/**
 * Basic session token format validation
 * This is a lightweight check - full validation happens in the actual pages/APIs
 */
function isValidTokenFormat(token: string): boolean {
  // Check if token exists and has the expected format (64 hex characters)
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') // Skip files with extensions (images, css, js, etc.)
  ) {
    return NextResponse.next();
  }

  // Get session token from cookies
  const sessionToken = request.cookies.get('session-token')?.value;

  // Check if the current route is public
  const isPublicRoute = matchesRoute(pathname, publicRoutes);
  const isProtectedRoute = matchesRoute(pathname, protectedRoutes);
  const isProtectedApiRoute = matchesRoute(pathname, protectedApiRoutes);

  // If it's a public route, allow access
  if (isPublicRoute) {
    // If user has a valid token format and trying to access login/register, redirect to dashboard
    // Full session validation will happen on the dashboard page
    if ((pathname === '/login' || pathname === '/register') && sessionToken && isValidTokenFormat(sessionToken)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // For protected routes, check authentication
  if (isProtectedRoute || isProtectedApiRoute) {
    // No session token found
    if (!sessionToken || !isValidTokenFormat(sessionToken)) {
      if (isProtectedApiRoute) {
        // Return 401 for API routes
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      } else {
        // Redirect to login for page routes
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Token format is valid, let the page/API handle full validation
    // This allows for proper error handling and user experience
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};