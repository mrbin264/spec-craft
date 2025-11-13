// API route for spec revision history
import { NextRequest, NextResponse } from 'next/server';
import { RevisionRepository } from '../../../../../lib/repositories/revision-repository';
import { SpecRepository } from '../../../../../lib/repositories/spec-repository';
import { verifyAuth } from '../../../../../lib/middleware/auth';
import { hasPermission } from '../../../../../lib/permissions';

/**
 * GET /api/specs/:id/revisions
 * Retrieve all revisions for a specific spec
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
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
    
    // Check read permission
    const canRead = hasPermission(authResult.user.role, 'spec:read');
    if (!canRead) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to read specs',
          },
        },
        { status: 403 }
      );
    }
    
    // Verify spec exists
    const specRepo = new SpecRepository();
    const spec = await specRepo.findById(id);
    
    if (!spec) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Spec not found',
          },
        },
        { status: 404 }
      );
    }
    
    // Fetch all revisions for the spec
    const revisionRepo = new RevisionRepository();
    const revisions = await revisionRepo.findBySpecId(id);
    
    return NextResponse.json({
      revisions: revisions.map(rev => ({
        id: rev._id,
        version: rev.version,
        author: rev.author,
        timestamp: rev.timestamp,
        content: rev.content,
        metadata: rev.metadata,
      })),
    });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch revisions',
        },
      },
      { status: 500 }
    );
  }
}
