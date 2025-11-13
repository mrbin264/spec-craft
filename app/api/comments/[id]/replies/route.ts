// API route for comment replies
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CommentRepository } from '@/lib/repositories/comment-repository';
import { requireAuth } from '@/lib/middleware/auth';
import { SessionPayload } from '@/types/auth';

const commentRepository = new CommentRepository();

// Validation schema for creating a reply
const createReplySchema = z.object({
  text: z.string().min(1, 'Reply text is required'),
  mentions: z.array(z.string()).optional().default([]),
});

/**
 * POST /api/comments/:id/replies
 * Create a reply to an existing comment
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

    const { id: parentCommentId } = await params;

    // Verify parent comment exists
    const parentComment = await commentRepository.findById(parentCommentId);
    if (!parentComment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Parent comment not found' } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createReplySchema.parse(body);

    // Extract mentions from text (e.g., @username)
    const mentionRegex = /@(\w+)/g;
    const textMentions = [...validatedData.text.matchAll(mentionRegex)].map(
      (match) => match[1]
    );
    const allMentions = [
      ...new Set([...validatedData.mentions, ...textMentions]),
    ];

    // Create reply with same line range as parent
    const reply = await commentRepository.createComment(
      parentComment.specId,
      user.email,
      validatedData.text,
      parentComment.lineRange,
      allMentions,
      parentCommentId
    );

    // TODO: Send email notifications to mentioned users and parent comment author
    const notifyUsers = [...allMentions, parentComment.author];
    if (notifyUsers.length > 0) {
      // Email notification logic would go here
      console.log(`Notify users: ${notifyUsers.join(', ')}`);
    }

    return NextResponse.json({ reply }, { status: 201 });
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

    console.error('Error creating reply:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create reply',
        },
      },
      { status: 500 }
    );
  }
}
