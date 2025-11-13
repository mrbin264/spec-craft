'use client';

import { useState } from 'react';
import { TraceabilityGraph } from './traceability-graph';

interface TraceabilityManagerProps {
  specId: string;
  onNavigate?: (specId: string) => void;
}

export function TraceabilityManager({ specId, onNavigate }: TraceabilityManagerProps) {
  const [showAddLink, setShowAddLink] = useState(false);
  const [parentId, setParentId] = useState('');
  const [childId, setChildId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddLink = async () => {
    if (!parentId || !childId) {
      setError('Both parent and child IDs are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/traceability/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parentId, childId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create link');
      }

      setSuccess('Link created successfully');
      setParentId('');
      setChildId('');
      setShowAddLink(false);
      
      // Refresh the graph
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Error creating link:', err);
      setError(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (clickedSpecId: string) => {
    if (onNavigate) {
      onNavigate(clickedSpecId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Traceability Graph</h2>
          <button
            onClick={() => setShowAddLink(!showAddLink)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {showAddLink ? 'Cancel' : 'Add Link'}
          </button>
        </div>

        {/* Add Link Form */}
        {showAddLink && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Create Traceability Link</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Spec ID
                </label>
                <input
                  id="parentId"
                  type="text"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  placeholder="Enter parent spec ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="childId" className="block text-sm font-medium text-gray-700 mb-1">
                  Child Spec ID
                </label>
                <input
                  id="childId"
                  type="text"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  placeholder="Enter child spec ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleAddLink}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
      </div>

      {/* Graph */}
      <div className="flex-1 bg-gray-50">
        <TraceabilityGraph
          key={refreshKey}
          rootSpecId={specId}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
}
