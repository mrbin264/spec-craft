// API route for retrieving traceability graph
import { NextRequest, NextResponse } from 'next/server';
import { TraceabilityRepository, SpecRepository } from '@/lib/repositories';
import { verifyAuth } from '@/lib/middleware/auth';
import { Spec } from '@/types';

const traceabilityRepo = new TraceabilityRepository();
const specRepo = new SpecRepository();

interface TraceabilityNode {
  id: string;
  title: string;
  type: 'epic' | 'user-story' | 'technical-spec' | 'test-case';
  status: string;
  children: TraceabilityNode[];
}

/**
 * Build a traceability tree recursively
 */
async function buildTree(
  specId: string,
  visited: Set<string> = new Set()
): Promise<TraceabilityNode | null> {
  // Prevent infinite loops
  if (visited.has(specId)) {
    return null;
  }
  visited.add(specId);

  // Get the spec
  const spec = await specRepo.findById(specId);
  if (!spec) {
    return null;
  }

  // Get children
  const childLinks = await traceabilityRepo.findChildren(specId);
  const children: TraceabilityNode[] = [];

  for (const link of childLinks) {
    const childNode = await buildTree(link.childId, visited);
    if (childNode) {
      children.push(childNode);
    }
  }

  return {
    id: spec._id,
    title: spec.metadata.title,
    type: spec.metadata.type,
    status: spec.metadata.status,
    children
  };
}

/**
 * GET /api/traceability/graph/:specId
 * Get the traceability graph starting from a specific spec
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
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

    const { specId } = await params;

    // Verify spec exists
    const spec = await specRepo.findById(specId);
    if (!spec) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Spec not found' } },
        { status: 404 }
      );
    }

    // Build the tree
    const graph = await buildTree(specId);

    if (!graph) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to build traceability graph' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ graph }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving traceability graph:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve traceability graph' } },
      { status: 500 }
    );
  }
}
