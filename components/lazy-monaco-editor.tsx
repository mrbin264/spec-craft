'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load Monaco Editor to reduce initial bundle size
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading editor...</p>
      </div>
    </div>
  ),
});

export type MonacoEditorProps = ComponentProps<typeof MonacoEditor>;

export default MonacoEditor;
