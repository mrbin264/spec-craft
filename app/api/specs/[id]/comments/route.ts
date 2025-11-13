// API routes for spec comments
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CommentRepository } from '@/lib/repositories/comment-repository';
import { requireAuth } from '@/lib/middleware/auth';
import { SessionPayload } from '@/types/auth';

const commentRepository = new CommentRepository();

// Validation schema for creating a comment
const createCommentSchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
  lineRange: z.object({
    start: z.number().int().min(0),
    end: z.number().int().min(0),
  }),
  mentions: z.array(z.string()).optional().default([]),
});

/**
 * POST /api/specs/:id/comments
 * Create a new comment on a spec
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult as SessionPayload;

    const { id: specId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Extract mentions from text (e.g., @username)
    const mentionRegex = /@(\w+)/g;
    const textMentions = [...validatedData.text.matchAll(mentionRegex)].map(
      (match) => match[1]
    );
    const allMentions = [
      ...new Set([...validatedData.mentions, ...textMentions]),
    ];

    // Create comment
    const comment = await commentRepository.createComment(
      specId,
      user.email,
      validatedData.text,
      validatedData.lineRange,
      allMentions
    );

    // TODO: Send email notifications to mentioned users
    if (allMentions.length > 0) {
      // Email notification logic would go here
      console.log(`Mentions detected: ${allMentions.join(', ')}`);
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
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

    console.error('Error creating comment:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create comment',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/specs/:id/comments
 * Get all comments for a spec with threaded replies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: specId } = await params;

    // Get all comments for the spec
    const allComments = await commentRepository.findAllBySpecId(specId);

    // Build threaded structure
    type CommentWithReplies = typeof allComments[0] & { replies: CommentWithReplies[] };
    const commentMap = new Map<string, CommentWithReplies>();
    const topLevelComments: CommentWithReplies[] = [];

    // First pass: create map of all comments
    allComments.forEach((comment) => {
      commentMap.set(comment._id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    allComments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment._id);
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent && commentWithReplies) {
          parent.replies.push(commentWithReplies);
        }
      } else if (commentWithReplies) {
        topLevelComments.push(commentWithReplies);
      }
    });

    return NextResponse.json({ comments: topLevelComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch comments',
        },
      },
      { status: 500 }
    );
  }
}
