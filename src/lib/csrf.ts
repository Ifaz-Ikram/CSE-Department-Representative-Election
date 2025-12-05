import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * CSRF Protection for API routes
 * Validates that state-changing requests come from the same origin
 */
export async function validateCSRF(request: NextRequest): Promise<boolean> {
  // Only check for state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return true;
  }

  // Get origin and referer
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Check if request comes from same origin
  const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${host}`;
  
  if (origin) {
    if (origin !== baseUrl.replace(/\/$/, '')) {
      return false;
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      const baseUrlObj = new URL(baseUrl);
      if (refererUrl.origin !== baseUrlObj.origin) {
        return false;
      }
    } catch {
      return false;
    }
  } else {
    // No origin or referer header - reject
    return false;
  }

  return true;
}

/**
 * CSRF Protection Middleware for API routes
 */
export async function csrfProtection(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const isValid = await validateCSRF(request);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid request origin - CSRF protection' },
      { status: 403 }
    );
  }

  return handler();
}

/**
 * Generate CSRF token for forms (optional additional layer)
 */
export async function generateCSRFToken(request: NextRequest): Promise<string> {
  const token = await getToken({ req: request });
  if (!token) {
    throw new Error('Unauthorized');
  }
  
  // Create a simple hash based on session
  const tokenString = JSON.stringify(token);
  const encoder = new TextEncoder();
  const data = encoder.encode(tokenString + process.env.NEXTAUTH_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex.substring(0, 32);
}

/**
 * Verify CSRF token from form submission
 */
export async function verifyCSRFToken(
  request: NextRequest,
  providedToken: string
): Promise<boolean> {
  try {
    const expectedToken = await generateCSRFToken(request);
    return expectedToken === providedToken;
  } catch {
    return false;
  }
}
