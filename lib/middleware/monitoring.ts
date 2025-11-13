/**
 * Monitoring middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackApiRequest, trackError } from '../monitoring';

/**
 * Wrap an API route handler with monitoring
 */
export function withMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const path = request.nextUrl.pathname;

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;
      const statusCode = response.status;

      // Track successful request
      trackApiRequest(method, path, statusCode, duration);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Track failed request
      trackApiRequest(method, path, 500, duration);
      trackError('API request failed', error, { method, path });

      throw error;
    }
  };
}

/**
 * Extract user ID from request for monitoring context
 */
export function getUserIdFromRequest(request: NextRequest): string | undefined {
  try {
    // Try to get user ID from auth header or session
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // Parse JWT token to get user ID (simplified)
      const token = authHeader.replace('Bearer ', '');
      // In production, properly decode and verify the JWT
      // For now, return undefined
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
  return undefined;
}
