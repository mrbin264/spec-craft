// GET /api/files/:id - Get file attachment with fresh SAS URL
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { generateSasUrl } from '@/lib/blob-storage';
import { FileAttachmentRepository } from '@/lib/repositories/file-attachment-repository';

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

    const { id } = await params;

    // Get file attachment from database
    const fileAttachmentRepo = new FileAttachmentRepository();
    const attachment = await fileAttachmentRepo.findById(id);

    if (!attachment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'File not found' } },
        { status: 404 }
      );
    }

    // Generate fresh SAS URL with 1-hour expiration
    const url = await generateSasUrl(attachment.blobPath, 1);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    return NextResponse.json({
      fileId: attachment._id,
      fileName: attachment.fileName,
      url,
      expiresAt: expiresAt.toISOString(),
      size: attachment.size,
      contentType: attachment.contentType,
      uploadedBy: attachment.uploadedBy,
      uploadedAt: attachment.uploadedAt,
    });
  } catch (error) {
    console.error('File retrieval error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve file',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/files/:id - Delete file attachment
export async function DELETE(
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

    // Get file attachment from database
    const fileAttachmentRepo = new FileAttachmentRepository();
    const attachment = await fileAttachmentRepo.findById(id);

    if (!attachment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'File not found' } },
        { status: 404 }
      );
    }

    // Check if user is the uploader (or has admin role)
    if (attachment.uploadedBy !== authResult.user.email) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only delete your own files' } },
        { status: 403 }
      );
    }

    // Delete from Blob Storage
    const { deleteFile } = await import('@/lib/blob-storage');
    await deleteFile(attachment.blobPath);

    // Delete from database
    await fileAttachmentRepo.deleteById(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete file',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
