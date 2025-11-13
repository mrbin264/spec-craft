// API route for creating and deleting traceability links
import { NextRequest, NextResponse } from 'next/server';
import { TraceabilityRepository, SpecRepository } from '@/lib/repositories';
import { verifyAuth } from '@/lib/middleware/auth';

const traceabilityRepo = new TraceabilityRepository();
const specRepo = new SpecRepository();

/**
 * POST /api/traceability/link
 * Create a new traceability link between two specs
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { parentId, childId } = body;

    // Validate input
    if (!parentId || !childId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'parentId and childId are required' } },
        { status: 400 }
      );
    }

    if (parentId === childId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Cannot link a spec to itself' } },
        { status: 400 }
      );
    }

    // Verify both specs exist
    const [parentSpec, childSpec] = await Promise.all([
      specRepo.findById(parentId),
      specRepo.findById(childId)
    ]);

    if (!parentSpec) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Parent spec not found' } },
        { status: 404 }
      );
    }

    if (!childSpec) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Child spec not found' } },
        { status: 404 }
      );
    }

    // Check if link already exists
    const existingLink = await traceabilityRepo.findLink(parentId, childId);
    if (existingLink) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Link already exists' } },
        { status: 400 }
      );
    }

    // Create the link (repository will check for circular dependencies)
    try {
      const link = await traceabilityRepo.createLink(
        parentId,
        childId,
        authResult.user.email
      );

      return NextResponse.json({ link }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message.includes('circular dependency')) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Cannot create link: would create circular dependency' } },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating traceability link:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create traceability link' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/traceability/link
 * Delete a traceability link between two specs
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const childId = searchParams.get('childId');

    // Validate input
    if (!parentId || !childId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'parentId and childId are required' } },
        { status: 400 }
      );
    }

    // Delete the link
    const deleted = await traceabilityRepo.deleteLink(parentId, childId);

    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Link not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting traceability link:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete traceability link' } },
      { status: 500 }
    );
  }
}
