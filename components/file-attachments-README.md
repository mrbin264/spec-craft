# File Attachments System

## Overview

The file attachment system allows users to upload, view, and manage files associated with specification documents. It uses Azure Blob Storage for file storage and CosmosDB for metadata.

## Components

### Backend

1. **lib/blob-storage.ts** - Azure Blob Storage client
   - `uploadFile()` - Upload file to blob storage
   - `generateSasUrl()` - Generate secure URL with expiration
   - `deleteFile()` - Delete file from storage
   - `fileExists()` - Check if file exists

2. **API Endpoints**
   - `POST /api/files/upload` - Upload a new file
   - `GET /api/files/:id` - Get file with fresh SAS URL
   - `DELETE /api/files/:id` - Delete a file
   - `GET /api/specs/:id/files` - List all files for a spec

### Frontend

1. **components/file-upload.tsx** - File upload component
   - Drag-and-drop support
   - Multiple file upload
   - Progress indicators
   - File validation (type, size)

2. **components/file-list.tsx** - File list component
   - Display uploaded files
   - Image preview modal
   - Download functionality
   - Delete functionality

3. **components/file-attachments.tsx** - Combined component
   - Integrates upload and list
   - Manages refresh state

## Usage

### In a Spec Page

```tsx
import { FileAttachments } from '@/components/file-attachments';

export default function SpecPage({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* Other spec content */}
      
      <FileAttachments specId={params.id} />
    </div>
  );
}
```

### Environment Variables

Required in `.env.local`:

```
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER_NAME=attachments
```

## Features

- **File Upload**: Drag-and-drop or click to upload
- **File Types**: Images (PNG, JPG, SVG), PDF, documents (Word, Excel), text files
- **Size Limit**: 10 MB per file
- **Security**: SAS tokens with 1-hour expiration
- **Preview**: Image preview modal for PNG, JPG, SVG
- **Download**: Direct download for all file types
- **Delete**: Users can delete their own files

## File Validation

The system validates:
- File size (max 10 MB)
- Content type (allowed types only)
- Authentication (user must be logged in)
- Ownership (for deletion)

## Storage

- **Blob Storage**: Files stored with timestamp prefix
- **CosmosDB**: Metadata stored in `fileAttachments` collection
- **SAS URLs**: Generated on-demand with 1-hour expiration

## Future Enhancements

- Bulk upload
- File versioning
- Thumbnail generation for images
- Virus scanning
- Storage quota per user/project
