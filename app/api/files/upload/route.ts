// POST /api/files/upload - Upload file attachment
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { uploadFile, generateSasUrl } from '@/lib/blob-storage';
import { FileAttachmentRepository } from '@/lib/repositories/file-attachment-repository';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const specId = formData.get('specId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'File is required' } },
        { status: 400 }
      );
    }

    if (!specId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'specId is required' } },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
          },
        },
        { status: 400 }
      );
    }

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: `File type ${file.type} is not allowed`,
            details: { allowedTypes: ALLOWED_CONTENT_TYPES },
          },
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Blob Storage
    const blobName = await uploadFile(file.name, buffer, file.type);

    // Generate SAS URL with 1-hour expiration
    const url = await generateSasUrl(blobName, 1);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store metadata in database
    const fileAttachmentRepo = new FileAttachmentRepository();
    const attachment = await fileAttachmentRepo.createAttachment(
      specId,
      file.name,
      blobName,
      file.type,
      file.size,
      authResult.user.email
    );

    return NextResponse.json({
      fileId: attachment._id,
      fileName: file.name,
      url,
      expiresAt: expiresAt.toISOString(),
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload file',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
