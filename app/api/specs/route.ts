// API route for spec creation and listing
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SpecRepository } from '../../../lib/repositories/spec-repository';
import { getTemplateById, generateSpecFromTemplate } from '../../../lib/templates';
import { combineMarkdown, validateMetadata } from '../../../lib/yaml-parser';
import { verifyAuth } from '../../../lib/middleware/auth';
import { handleApiError, ErrorCode, createErrorResponse } from '../../../lib/errors';
import { cachedJsonResponse, CACHE_CONFIGS, memoryCache, cacheKeys } from '../../../lib/api-cache';

// Request validation schema
const CreateSpecSchema = z.object({
  templateId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['epic', 'user-story', 'technical-spec', 'test-case']),
  parentId: z.string().optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

/**
 * POST /api/specs
 * Create a new spec document
 */
export async function POST(request: NextRequest) {
  try {
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
    
    const body = await request.json();
    
    // Validate request
    const validatedData = CreateSpecSchema.parse(body);
    
    // Generate content from template or use default
    let content = '';
    let frontmatter: Record<string, any> = {
      title: validatedData.title,
      status: 'Idea',
      type: validatedData.type,
      tags: validatedData.tags,
    };
    
    if (validatedData.parentId) {
      frontmatter.parentId = validatedData.parentId;
    }
    
    if (validatedData.assignee) {
      frontmatter.assignee = validatedData.assignee;
    }
    
    if (validatedData.templateId) {
      const templateResult = generateSpecFromTemplate(
        validatedData.templateId,
        frontmatter
      );
      
      if (!templateResult) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: `Template '${validatedData.templateId}' not found`,
            },
          },
          { status: 404 }
        );
      }
      
      content = templateResult.content;
      frontmatter = templateResult.frontmatter;
    } else {
      // Default content if no template specified
      content = `# ${validatedData.title}\n\nStart writing your specification here...`;
    }
    
    // Validate metadata
    const metadata = validateMetadata(frontmatter);
    
    // Combine frontmatter and content
    const fullContent = combineMarkdown(metadata, content);
    
    // Create spec in database
    const specRepo = new SpecRepository();
    const spec = await specRepo.createSpec(
      validatedData.title,
      fullContent,
      metadata,
      authResult.user.userId
    );
    
    return NextResponse.json(
      {
        spec: {
          id: spec._id,
          title: spec.title,
          content: spec.content,
          metadata: spec.metadata,
          createdBy: spec.createdBy,
          createdAt: spec.createdAt,
          updatedAt: spec.updatedAt,
          currentVersion: spec.currentVersion,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid request data', error.issues),
        { status: 400 }
      );
    }
    
    const { response, status } = handleApiError(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * GET /api/specs
 * List specs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
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
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const type = searchParams.get('type') as any;
    const createdBy = searchParams.get('createdBy') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    const specRepo = new SpecRepository();
    
    // Use paginated query with caching
    const result = await specRepo.findSpecsPaginated(
      { status, type, createdBy },
      page,
      limit
    );
    
    const response = {
      specs: result.data.map((spec) => ({
        id: spec._id,
        title: spec.title,
        metadata: spec.metadata,
        createdBy: spec.createdBy,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
        currentVersion: spec.currentVersion,
      })),
      pagination: result.pagination,
    };
    
    return cachedJsonResponse(response, CACHE_CONFIGS.SPEC);
  } catch (error) {
    const { response, status } = handleApiError(error);
    return NextResponse.json(response, { status });
  }
}
