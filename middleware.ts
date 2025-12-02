import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /login, /register)
  const { pathname } = request.nextUrl

  // Get the session token from cookies
  const sessionToken = request.cookies.get('session-token')?.value

  // Redirect old /dashboard routes to /helpdesk
  if (pathname.startsWith('/dashboard')) {
    const newPath = pathname.replace('/dashboard', '/helpdesk')
    return NextResponse.redirect(new URL(newPath, request.url))
  }

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/welcome', '/']
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

  // Session token exists - pass it to API routes via header
  // Validation will happen in API routes using optimized methods
  const response = NextResponse.next()
  response.headers.set('x-session-token', sessionToken)
  
  return response
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