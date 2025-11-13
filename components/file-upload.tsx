'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface FileUploadProps {
  specId: string;
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
}

interface UploadedFile {
  fileId: string;
  fileName: string;
  url: string;
  expiresAt: string;
  size: number;
  contentType: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({ specId, onUploadComplete, onUploadError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    // Add to upload progress list
    const uploadId = `${file.name}-${Date.now()}`;
    setUploads((prev) => [
      ...prev,
      { fileName: file.name, progress: 0, status: 'uploading' },
    ]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('specId', specId);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
      }

      const result: UploadedFile = await response.json();

      // Update progress to success
      setUploads((prev) =>
        prev.map((upload) =>
          upload.fileName === file.name
            ? { ...upload, progress: 100, status: 'success' as const }
            : upload
        )
      );

      // Call success callback
      onUploadComplete?.(result);

      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploads((prev) => prev.filter((upload) => upload.fileName !== file.name));
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // Update progress to error
      setUploads((prev) =>
        prev.map((upload) =>
          upload.fileName === file.name
            ? { ...upload, status: 'error' as const, error: errorMessage }
            : upload
        )
      );

      // Call error callback
      onUploadError?.(errorMessage);

      // Remove from list after 5 seconds
      setTimeout(() => {
        setUploads((prev) => prev.filter((upload) => upload.fileName !== file.name));
      }, 5000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Click to upload
            </span>{' '}
            or drag and drop
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, SVG, PDF, or documents up to 10MB
          </p>
        </div>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={`${upload.fileName}-${index}`}
              className="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  {upload.fileName}
                </span>
                {upload.status === 'uploading' && (
                  <span className="text-xs text-gray-500 ml-2">Uploading...</span>
                )}
                {upload.status === 'success' && (
                  <span className="text-xs text-green-600 ml-2">✓ Complete</span>
                )}
                {upload.status === 'error' && (
                  <span className="text-xs text-red-600 ml-2">✗ Failed</span>
                )}
              </div>
              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              {upload.status === 'error' && upload.error && (
                <p className="text-xs text-red-600 mt-1">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
