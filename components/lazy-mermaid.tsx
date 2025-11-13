'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load Mermaid to reduce initial bundle size
const Mermaid = dynamic(
  () => import('react-markdown').then((mod) => {
    // This is a placeholder - the actual Mermaid rendering happens in markdown-preview
    return mod.default;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading diagram...</p>
        </div>
      </div>
    ),
  }
);

export default Mermaid;
