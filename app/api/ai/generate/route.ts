// POST /api/ai/generate - Generate AI content
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { rateLimit, getRateLimitHeaders } from '@/lib/middleware/rate-limit';
import { generateWithAI, estimateTokenCost, AIAction } from '@/lib/ai-client';
import { enforceQuota, recordUsage } from '@/lib/ai-quota';

interface GenerateRequest {
  action: AIAction;
  selectedText: string;
  context: string;
  model?: 'gpt-4o-mini' | 'gpt-4o';
  specId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.userId;

    // Apply rate limiting (20 requests per minute for AI)
    const rateLimitResult = await rateLimit(request, userId, {
      maxRequests: 20,
      windowMs: 60000,
    });
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Parse request body
    const body: GenerateRequest = await request.json();
    const { action, selectedText, context, model = 'gpt-4o-mini', specId } = body;

    // Validate required fields
    if (!action || !selectedText || !specId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: action, selectedText, specId',
          },
        },
        { status: 400 }
      );
    }

    // Validate action
    const validActions: AIAction[] = [
      'complete',
      'rewrite',
      'generate-criteria',
      'generate-tests',
      'summarize',
      'extract-tasks',
      'translate',
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Estimate token cost
    const estimatedTokens = estimateTokenCost({
      action,
      selectedText,
      context: context || '',
      model,
    });

    // Enforce quota
    try {
      await enforceQuota(userId, estimatedTokens);
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'QUOTA_EXCEEDED',
            message: error instanceof Error ? error.message : 'Daily quota exceeded',
          },
        },
        { status: 429 }
      );
    }

    // Generate AI content
    const result = await generateWithAI({
      action,
      selectedText,
      context: context || '',
      model,
    });

    // Record usage
    await recordUsage(userId, specId, action, result.model, result.tokensUsed);

    // Add rate limit headers
    const rateLimitHeaders = getRateLimitHeaders(userId, {
      maxRequests: 20,
      windowMs: 60000,
    });

    return NextResponse.json(
      {
        generatedText: result.generatedText,
        tokensUsed: result.tokensUsed,
        model: result.model,
        metadata: {
          timestamp: result.metadata.timestamp.toISOString(),
          action: result.metadata.action,
        },
      },
      {
        headers: rateLimitHeaders,
      }
    );
  } catch (error) {
    console.error('Error generating AI content:', error);
    
    // Handle specific Azure OpenAI errors
    if (error instanceof Error && error.message.includes('Azure OpenAI')) {
      return NextResponse.json(
        {
          error: {
            code: 'AI_SERVICE_ERROR',
            message: 'AI service is temporarily unavailable',
            details: error.message,
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate AI content',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
