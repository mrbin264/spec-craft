// API route for comparing spec revisions
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Diff from 'diff';
import { RevisionRepository } from '../../../../../../lib/repositories/revision-repository';
import { SpecRepository } from '../../../../../../lib/repositories/spec-repository';
import { verifyAuth } from '../../../../../../lib/middleware/auth';
import { hasPermission } from '../../../../../../lib/permissions';

// Request validation schema
const CompareQuerySchema = z.object({
  rev1: z.string().min(1, 'First revision version is required'),
  rev2: z.string().min(1, 'Second revision version is required'),
  format: z.enum(['inline', 'side-by-side']).optional().default('inline'),
});

export interface DiffBlock {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * GET /api/specs/:id/revisions/compare?rev1=1&rev2=2&format=inline
 * Compare two revisions and return differences
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
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
    
    // Validate query parameters
    const queryData = CompareQuerySchema.parse({
      rev1: searchParams.get('rev1'),
      rev2: searchParams.get('rev2'),
      format: searchParams.get('format') || 'inline',
    });
    
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
    
    // Fetch both revisions
    const revisionRepo = new RevisionRepository();
    const revision1 = await revisionRepo.findByVersion(id, parseInt(queryData.rev1));
    const revision2 = await revisionRepo.findByVersion(id, parseInt(queryData.rev2));
    
    if (!revision1 || !revision2) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'One or both revisions not found',
          },
        },
        { status: 404 }
      );
    }
    
    // Generate diff
    const diff = generateDiff(
      revision1.content,
      revision2.content,
      queryData.format
    );
    
    return NextResponse.json({
      revision1: {
        id: revision1._id,
        version: revision1.version,
        author: revision1.author,
        timestamp: revision1.timestamp,
      },
      revision2: {
        id: revision2._id,
        version: revision2.version,
        author: revision2.author,
        timestamp: revision2.timestamp,
      },
      format: queryData.format,
      diff,
    });
  } catch (error) {
    console.error('Error comparing revisions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to compare revisions',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Generate diff between two content strings
 */
function generateDiff(
  oldContent: string,
  newContent: string,
  format: 'inline' | 'side-by-side'
): DiffBlock[] {
  const changes = Diff.diffLines(oldContent, newContent);
  const diffBlocks: DiffBlock[] = [];
  
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let lineNumber = 1;
  
  for (const change of changes) {
    const lines = change.value.split('\n');
    // Remove empty last line if it exists
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    if (change.added) {
      // Added lines
      for (const line of lines) {
        diffBlocks.push({
          type: 'added',
          content: line,
          lineNumber: format === 'inline' ? lineNumber++ : newLineNumber,
          newLineNumber: newLineNumber++,
        });
      }
    } else if (change.removed) {
      // Removed lines
      for (const line of lines) {
        diffBlocks.push({
          type: 'removed',
          content: line,
          lineNumber: format === 'inline' ? lineNumber++ : oldLineNumber,
          oldLineNumber: oldLineNumber++,
        });
      }
    } else {
      // Unchanged lines
      for (const line of lines) {
        diffBlocks.push({
          type: 'unchanged',
          content: line,
          lineNumber: format === 'inline' ? lineNumber++ : oldLineNumber,
          oldLineNumber: oldLineNumber++,
          newLineNumber: newLineNumber++,
        });
      }
    }
  }
  
  return diffBlocks;
}
