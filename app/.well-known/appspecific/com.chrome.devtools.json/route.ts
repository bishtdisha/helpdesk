import { NextResponse } from 'next/server';

/**
 * Chrome DevTools configuration endpoint
 * This prevents 404 errors in Chrome DevTools console
 */
export async function GET() {
  return NextResponse.json({
    // Empty configuration - just prevents the 404 error
  });
}