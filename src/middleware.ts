import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CSRF Protection for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // Only check CSRF for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${host}`;
      
      let isValidOrigin = false;
      
      if (origin) {
        isValidOrigin = origin === baseUrl.replace(/\/$/, '');
      } else if (referer) {
        try {
          const refererUrl = new URL(referer);
          const baseUrlObj = new URL(baseUrl);
          isValidOrigin = refererUrl.origin === baseUrlObj.origin;
        } catch {
          isValidOrigin = false;
        }
      }

      if (!isValidOrigin) {
        return NextResponse.json(
          { error: 'Invalid request origin - CSRF protection' },
          { status: 403 }
        );
      }
    }
  }

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline' https://accounts.google.com;
    img-src 'self' blob: data: https://lh3.googleusercontent.com https://accounts.google.com;
    font-src 'self' data:;
    connect-src 'self' https://accounts.google.com https://*.sentry.io https://*.upstash.io https://*.supabase.co;
    frame-src 'self' https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // Security Headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - monitoring (Sentry tunnel)
     */
    '/((?!_next/static|_next/image|favicon.ico|monitoring).*)',
  ],
};
