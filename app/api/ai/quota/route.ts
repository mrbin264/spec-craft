// GET /api/ai/quota - Get AI token quota information
import { NextRequest, NextResponse } from 'next/server';
import { checkQuota } from '@/lib/ai-quota';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.userId;

    // Get quota information
    const quota = await checkQuota(userId);

    return NextResponse.json({
      dailyLimit: quota.dailyLimit,
      used: quota.used,
      remaining: quota.remaining,
      resetsAt: quota.resetsAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching AI quota:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch AI quota',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
