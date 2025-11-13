'use client';

import dynamic from 'next/dynamic';

// Lazy load TraceabilityGraph to reduce initial bundle size
// React Flow is a heavy dependency
const LazyTraceabilityGraph = dynamic(
  () => import('./traceability-graph').then((mod) => ({ default: mod.TraceabilityGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading traceability graph...</p>
        </div>
      </div>
    ),
  }
);

export default LazyTraceabilityGraph;
