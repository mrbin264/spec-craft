// Authentication middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { SessionPayload } from '@/types/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: SessionPayload;
}

/**
 * Middleware to authenticate requests using JWT tokens
 * Extracts and verifies the token from the Authorization header
 */
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        },
        { status: 401 }
      );
    }

    // Attach user info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = payload;

    return handler(authenticatedRequest);
  };
}

/**
 * Extract user session from request
 * Returns null if not authenticated
 */
export function getSession(request: NextRequest): SessionPayload | null {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Verify authentication and return user info
 * Returns authentication status and user payload
 */
export async function verifyAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  user: SessionPayload | null;
}> {
  const session = getSession(request);
  
  if (!session) {
    return { authenticated: false, user: null };
  }
  
  return { authenticated: true, user: session };
}

/**
 * Verify authentication and return user session or error response
 * Returns NextResponse with error if not authenticated, otherwise returns SessionPayload
 */
export async function requireAuth(request: NextRequest): Promise<SessionPayload | NextResponse> {
  const session = getSession(request);
  
  if (!session) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    );
  }
  
  return session;
}
