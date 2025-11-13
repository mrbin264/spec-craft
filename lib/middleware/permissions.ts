// Permission enforcement middleware
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './auth';
import { hasPermission, hasAllPermissions } from '@/lib/permissions';
import { Permission } from '@/types/permissions';

/**
 * Middleware to check if user has required permission(s)
 */
export function withPermission(
  permission: Permission | Permission[],
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
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

    // Check permissions
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasRequiredPermissions = hasAllPermissions(session.role, permissions);

    if (!hasRequiredPermissions) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      );
    }

    return handler(request);
  };
}

/**
 * Middleware to check if user has at least one of the required permissions
 */
export function withAnyPermission(
  permissions: Permission[],
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
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

    // Check if user has at least one permission
    const hasAnyPerm = permissions.some((perm) =>
      hasPermission(session.role, perm)
    );

    if (!hasAnyPerm) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      );
    }

    return handler(request);
  };
}
