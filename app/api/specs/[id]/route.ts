// API route for individual spec operations
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SpecRepository } from '../../../../lib/repositories/spec-repository';
import { RevisionRepository } from '../../../../lib/repositories/revision-repository';
import { parseFrontmatter, combineMarkdown, validateMetadata } from '../../../../lib/yaml-parser';
import { verifyAuth } from '../../../../lib/middleware/auth';
import { hasPermission } from '../../../../lib/permissions';

// Request validation schema for updates
const UpdateSpecSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  metadata: z.object({
    title: z.string().min(1, 'Title is required'),
    status: z.enum(['Idea', 'Draft', 'Review', 'Ready', 'InProgress', 'Done']),
    type: z.enum(['epic', 'user-story', 'technical-spec', 'test-case']),
    assignee: z.string().optional(),
    tags: z.array(z.string()).default([]),
    parentId: z.string().optional(),
  }),
});

/**
 * GET /api/specs/:id
 * Retrieve a specific spec with permission checking
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
    
    // Fetch spec
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
    
    // Determine user permissions for this spec
    const canEdit = hasPermission(authResult.user.role, 'spec:update');
    const canDelete = hasPermission(authResult.user.role, 'spec:delete');
    const canTransition = hasPermission(authResult.user.role, 'spec:transition');
    
    return NextResponse.json({
      spec: {
        id: spec._id,
        title: spec.title,
        content: spec.content,
        metadata: spec.metadata,
        createdBy: spec.createdBy,
        createdAt: spec.createdAt,
        updatedBy: spec.updatedBy,
        updatedAt: spec.updatedAt,
        currentVersion: spec.currentVersion,
      },
      permissions: {
        canEdit,
        canDelete,
        canTransition,
      },
    });
  } catch (error) {
    console.error('Error fetching spec:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch spec',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/specs/:id
 * Update a spec with validation and revision creation
 */
export async function PUT(
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
    
    // Check edit permission
    const canEdit = hasPermission(authResult.user.role, 'spec:update');
    if (!canEdit) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to edit specs',
          },
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validate request
    const validatedData = UpdateSpecSchema.parse(body);
    
    // Validate metadata
    const metadata = validateMetadata(validatedData.metadata);
    
    // Combine frontmatter and content
    const fullContent = combineMarkdown(metadata, validatedData.content);
    
    // Fetch existing spec to create revision
    const specRepo = new SpecRepository();
    const existingSpec = await specRepo.findById(id);
    
    if (!existingSpec) {
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
    
    // Create revision before updating
    const revisionRepo = new RevisionRepository();
    await revisionRepo.createRevision(
      existingSpec._id,
      existingSpec.currentVersion,
      existingSpec.content,
      existingSpec.metadata,
      authResult.user.userId
    );
    
    // Update spec
    const updatedSpec = await specRepo.updateSpec(
      id,
      fullContent,
      metadata,
      authResult.user.userId
    );
    
    if (!updatedSpec) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update spec',
          },
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      spec: {
        id: updatedSpec._id,
        title: updatedSpec.title,
        content: updatedSpec.content,
        metadata: updatedSpec.metadata,
        createdBy: updatedSpec.createdBy,
        createdAt: updatedSpec.createdAt,
        updatedBy: updatedSpec.updatedBy,
        updatedAt: updatedSpec.updatedAt,
        currentVersion: updatedSpec.currentVersion,
      },
    });
  } catch (error) {
    console.error('Error updating spec:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message,
          },
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update spec',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/specs/:id
 * Delete a spec (soft delete by marking as archived)
 */
export async function DELETE(
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
    
    // Check delete permission
    const canDelete = hasPermission(authResult.user.role, 'spec:delete');
    if (!canDelete) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to delete specs',
          },
        },
        { status: 403 }
      );
    }
    
    // Delete spec
    const specRepo = new SpecRepository();
    const deleted = await specRepo.deleteById(id);
    
    if (!deleted) {
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
    
    return NextResponse.json({
      success: true,
      message: 'Spec deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting spec:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete spec',
        },
      },
      { status: 500 }
    );
  }
}
