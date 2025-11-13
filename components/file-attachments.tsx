'use client';

import { useState } from 'react';
import { FileUpload } from './file-upload';
import { FileList } from './file-list';

interface FileAttachmentsProps {
  specId: string;
}

export function FileAttachments({ specId }: FileAttachmentsProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = () => {
    // Trigger refresh of file list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">File Attachments</h3>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showUpload ? 'Hide Upload' : 'Upload File'}
        </button>
      </div>

      {showUpload && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <FileUpload
            specId={specId}
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              console.error('Upload error:', error);
            }}
          />
        </div>
      )}

      <FileList specId={specId} refreshTrigger={refreshTrigger} />
    </div>
  );
}
