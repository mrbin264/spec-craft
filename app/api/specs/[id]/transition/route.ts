// API route for workflow stage transitions
import { NextRequest, NextResponse } from 'next/server';
import { SpecRepository } from '@/lib/repositories/spec-repository';
import { verifyAuth } from '@/lib/middleware/auth';
import { canTransitionWorkflow, isValidTransition } from '@/lib/permissions';
import { WorkflowStage } from '@/types/spec';

interface TransitionRequest {
  toStage: WorkflowStage;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: TransitionRequest = await request.json();
    const { toStage } = body;

    // Validate input
    if (!toStage) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'toStage is required',
          },
        },
        { status: 400 }
      );
    }

    // Get spec from database
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

    const currentStage = spec.metadata.status;

    // Validate transition is valid in workflow
    if (!isValidTransition(currentStage, toStage)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TRANSITION',
            message: `Invalid transition from ${currentStage} to ${toStage}`,
          },
        },
        { status: 400 }
      );
    }

    // Check if user has permission for this transition
    if (!canTransitionWorkflow(authResult.user.role, currentStage, toStage)) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: `Role ${authResult.user.role} cannot transition from ${currentStage} to ${toStage}`,
          },
        },
        { status: 403 }
      );
    }

    // Perform transition
    const updatedSpec = await specRepo.transitionStage(
      id,
      toStage,
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
      spec: updatedSpec,
      message: `Transitioned from ${currentStage} to ${toStage}`,
    });
  } catch (error) {
    console.error('Error transitioning spec:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
