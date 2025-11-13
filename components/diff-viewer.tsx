'use client';

import { useState, useEffect } from 'react';

interface DiffBlock {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface DiffViewerProps {
  specId: string;
  rev1: number;
  rev2: number;
  onClose: () => void;
}

interface RevisionInfo {
  id: string;
  version: number;
  author: string;
  timestamp: Date;
}

export function DiffViewer({ specId, rev1, rev2, onClose }: DiffViewerProps) {
  const [diff, setDiff] = useState<DiffBlock[]>([]);
  const [revision1, setRevision1] = useState<RevisionInfo | null>(null);
  const [revision2, setRevision2] = useState<RevisionInfo | null>(null);
  const [format, setFormat] = useState<'inline' | 'side-by-side'>('inline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiff();
  }, [specId, rev1, rev2, format]);

  const fetchDiff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/specs/${specId}/revisions/compare?rev1=${rev1}&rev2=${rev2}&format=${format}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch diff');
      }
      
      const data = await response.json();
      setDiff(data.diff);
      setRevision1({
        ...data.revision1,
        timestamp: new Date(data.revision1.timestamp),
      });
      setRevision2({
        ...data.revision2,
        timestamp: new Date(data.revision2.timestamp),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diff');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderInlineDiff = () => {
    return (
      <div className="font-mono text-sm">
        {diff.map((block, index) => (
          <div
            key={index}
            className={`flex ${
              block.type === 'added'
                ? 'bg-green-50'
                : block.type === 'removed'
                ? 'bg-red-50'
                : 'bg-white'
            }`}
          >
            <div
              className={`w-16 flex-shrink-0 text-right pr-4 py-1 select-none ${
                block.type === 'added'
                  ? 'text-green-700 bg-green-100'
                  : block.type === 'removed'
                  ? 'text-red-700 bg-red-100'
                  : 'text-gray-500 bg-gray-50'
              }`}
            >
              {block.lineNumber}
            </div>
            <div
              className={`w-8 flex-shrink-0 text-center py-1 select-none font-bold ${
                block.type === 'added'
                  ? 'text-green-700 bg-green-100'
                  : block.type === 'removed'
                  ? 'text-red-700 bg-red-100'
                  : 'text-gray-400 bg-gray-50'
              }`}
            >
              {block.type === 'added' ? '+' : block.type === 'removed' ? '-' : ' '}
            </div>
            <div
              className={`flex-1 px-4 py-1 whitespace-pre-wrap break-all ${
                block.type === 'added'
                  ? 'text-green-900'
                  : block.type === 'removed'
                  ? 'text-red-900'
                  : 'text-gray-900'
              }`}
            >
              {block.content || ' '}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSideBySideDiff = () => {
    return (
      <div className="grid grid-cols-2 gap-px bg-gray-300 font-mono text-sm">
        <div className="bg-gray-100 px-4 py-2 font-semibold">
          Version {rev1} (Old)
        </div>
        <div className="bg-gray-100 px-4 py-2 font-semibold">
          Version {rev2} (New)
        </div>
        
        {diff.map((block, index) => {
          if (block.type === 'unchanged') {
            return (
              <div key={index} className="col-span-2 grid grid-cols-2 gap-px bg-gray-300">
                <div className="flex bg-white">
                  <div className="w-12 flex-shrink-0 text-right pr-2 py-1 text-gray-500 bg-gray-50 select-none">
                    {block.oldLineNumber}
                  </div>
                  <div className="flex-1 px-4 py-1 whitespace-pre-wrap break-all text-gray-900">
                    {block.content || ' '}
                  </div>
                </div>
                <div className="flex bg-white">
                  <div className="w-12 flex-shrink-0 text-right pr-2 py-1 text-gray-500 bg-gray-50 select-none">
                    {block.newLineNumber}
                  </div>
                  <div className="flex-1 px-4 py-1 whitespace-pre-wrap break-all text-gray-900">
                    {block.content || ' '}
                  </div>
                </div>
              </div>
            );
          } else if (block.type === 'removed') {
            return (
              <div key={index} className="col-span-2 grid grid-cols-2 gap-px bg-gray-300">
                <div className="flex bg-red-50">
                  <div className="w-12 flex-shrink-0 text-right pr-2 py-1 text-red-700 bg-red-100 select-none">
                    {block.oldLineNumber}
                  </div>
                  <div className="flex-1 px-4 py-1 whitespace-pre-wrap break-all text-red-900">
                    {block.content || ' '}
                  </div>
                </div>
                <div className="bg-gray-100"></div>
              </div>
            );
          } else {
            return (
              <div key={index} className="col-span-2 grid grid-cols-2 gap-px bg-gray-300">
                <div className="bg-gray-100"></div>
                <div className="flex bg-green-50">
                  <div className="w-12 flex-shrink-0 text-right pr-2 py-1 text-green-700 bg-green-100 select-none">
                    {block.newLineNumber}
                  </div>
                  <div className="flex-1 px-4 py-1 whitespace-pre-wrap break-all text-green-900">
                    {block.content || ' '}
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Comparing Versions
            </h2>
            {revision1 && revision2 && (
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Version {revision1.version}</span>
                {' '}({formatDate(revision1.timestamp)} by {revision1.author})
                {' → '}
                <span className="font-medium">Version {revision2.version}</span>
                {' '}({formatDate(revision2.timestamp)} by {revision2.author})
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setFormat('inline')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  format === 'inline'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Inline
              </button>
              <button
                onClick={() => setFormat('side-by-side')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  format === 'side-by-side'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Side by Side
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading diff...</div>
            </div>
          )}

          {error && (
            <div className="p-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={fetchDiff}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="min-h-full">
              {format === 'inline' ? renderInlineDiff() : renderSideBySideDiff()}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-gray-700">Added</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-700">Removed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span className="text-gray-700">Unchanged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
