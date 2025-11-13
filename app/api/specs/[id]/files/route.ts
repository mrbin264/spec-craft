// GET /api/specs/:id/files - Get all file attachments for a spec
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { FileAttachmentRepository } from '@/lib/repositories/file-attachment-repository';
import { generateSasUrl } from '@/lib/blob-storage';

export async function GET(
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

    const { id: specId } = await params;

    // Get all attachments for the spec
    const fileAttachmentRepo = new FileAttachmentRepository();
    const attachments = await fileAttachmentRepo.findBySpecId(specId);

    // Generate fresh SAS URLs for all attachments
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const url = await generateSasUrl(attachment.blobPath, 1);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        return {
          fileId: attachment._id,
          fileName: attachment.fileName,
          url,
          expiresAt: expiresAt.toISOString(),
          size: attachment.size,
          contentType: attachment.contentType,
          uploadedBy: attachment.uploadedBy,
          uploadedAt: attachment.uploadedAt,
        };
      })
    );

    return NextResponse.json({ files: attachmentsWithUrls });
  } catch (error) {
    console.error('File list retrieval error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve files',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
