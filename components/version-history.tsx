'use client';

import { useState, useEffect } from 'react';
import { Revision } from '../types';

interface VersionHistoryProps {
  specId: string;
  onCompare: (rev1: number, rev2: number) => void;
  onRestore: (version: number) => void;
}

interface RevisionItem {
  id: string;
  version: number;
  author: string;
  timestamp: Date;
  content: string;
  metadata: any;
}

export function VersionHistory({ specId, onCompare, onRestore }: VersionHistoryProps) {
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevisions, setSelectedRevisions] = useState<number[]>([]);
  const [expandedRevision, setExpandedRevision] = useState<number | null>(null);

  useEffect(() => {
    fetchRevisions();
  }, [specId]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/specs/${specId}/revisions`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch revisions');
      }
      
      const data = await response.json();
      setRevisions(data.revisions.map((rev: any) => ({
        ...rev,
        timestamp: new Date(rev.timestamp),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevisionSelect = (version: number) => {
    setSelectedRevisions(prev => {
      if (prev.includes(version)) {
        return prev.filter(v => v !== version);
      }
      if (prev.length >= 2) {
        return [prev[1], version];
      }
      return [...prev, version];
    });
  };

  const handleCompare = () => {
    if (selectedRevisions.length === 2) {
      const [rev1, rev2] = selectedRevisions.sort((a, b) => a - b);
      onCompare(rev1, rev2);
    }
  };

  const handleRestore = (version: number) => {
    if (confirm(`Are you sure you want to restore version ${version}? This will create a new revision with the content from version ${version}.`)) {
      onRestore(version);
    }
  };

  const toggleExpand = (version: number) => {
    setExpandedRevision(prev => prev === version ? null : version);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading version history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchRevisions}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No revision history available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
        <p className="text-sm text-gray-600 mt-1">
          Select two versions to compare or restore a previous version
        </p>
        {selectedRevisions.length === 2 && (
          <button
            onClick={handleCompare}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Compare Selected Versions
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

          {revisions.map((revision, index) => (
            <div key={revision.id} className="relative pl-16 pr-4 py-4 hover:bg-gray-50">
              {/* Timeline dot */}
              <div
                className={`absolute left-6 w-5 h-5 rounded-full border-2 ${
                  selectedRevisions.includes(revision.version)
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              />

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRevisions.includes(revision.version)}
                      onChange={() => handleRevisionSelect(revision.version)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      disabled={
                        selectedRevisions.length >= 2 &&
                        !selectedRevisions.includes(revision.version)
                      }
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          Version {revision.version}
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatDate(revision.timestamp)} by {revision.author}
                      </div>
                    </div>
                  </div>

                  {expandedRevision === revision.version && (
                    <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm">
                      <div className="font-medium text-gray-700 mb-2">Metadata:</div>
                      <div className="space-y-1 text-gray-600">
                        <div>Title: {revision.metadata.title}</div>
                        <div>Status: {revision.metadata.status}</div>
                        <div>Type: {revision.metadata.type}</div>
                        {revision.metadata.tags?.length > 0 && (
                          <div>Tags: {revision.metadata.tags.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleExpand(revision.version)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  >
                    {expandedRevision === revision.version ? 'Hide' : 'Details'}
                  </button>
                  {index !== 0 && (
                    <button
                      onClick={() => handleRestore(revision.version)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
