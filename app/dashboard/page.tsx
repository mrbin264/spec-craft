'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { WorkflowStatusBadge } from '@/components/workflow-status-badge';
import { getAllTemplates } from '@/lib/templates';
import type { SpecMetadata, WorkflowStage, SpecType } from '@/types';

interface SpecListItem {
  id: string;
  title: string;
  metadata: SpecMetadata;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [specs, setSpecs] = useState<SpecListItem[]>([]);
  const [filteredSpecs, setFilteredSpecs] = useState<SpecListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowStage | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<SpecType | 'all'>('all');
  
  // Create spec modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newSpecTitle, setNewSpecTitle] = useState('');
  const [creating, setCreating] = useState(false);
  
  const templates = getAllTemplates();
  
  // Fetch specs
  useEffect(() => {
    fetchSpecs();
  }, []);
  
  // Listen for keyboard shortcut to create spec
  useEffect(() => {
    const handleCreateSpec = () => {
      setShowCreateModal(true);
    };
    
    window.addEventListener('create-spec', handleCreateSpec);
    return () => window.removeEventListener('create-spec', handleCreateSpec);
  }, []);
  
  // Apply filters
  useEffect(() => {
    let filtered = [...specs];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (spec) =>
          spec.title.toLowerCase().includes(query) ||
          spec.metadata.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((spec) => spec.metadata.status === statusFilter);
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((spec) => spec.metadata.type === typeFilter);
    }
    
    setFilteredSpecs(filtered);
  }, [specs, searchQuery, statusFilter, typeFilter]);
  
  async function fetchSpecs() {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/specs', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch specs');
      }
      
      const data = await response.json();
      setSpecs(data.specs || []);
    } catch (err) {
      console.error('Error fetching specs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load specs');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleCreateSpec() {
    if (!selectedTemplate || !newSpecTitle.trim()) {
      return;
    }
    
    try {
      setCreating(true);
      
      const template = templates.find((t) => t.id === selectedTemplate);
      if (!template) return;
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/specs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          title: newSpecTitle,
          type: template.type,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create spec');
      }
      
      const data = await response.json();
      
      // Navigate to the new spec
      router.push(`/specs/${data.spec.id}`);
    } catch (err) {
      console.error('Error creating spec:', err);
      alert('Failed to create spec. Please try again.');
    } finally {
      setCreating(false);
    }
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Actions Bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkflowStage | 'all')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="Idea">Idea</option>
                <option value="Draft">Draft</option>
                <option value="Review">Review</option>
                <option value="Ready">Ready</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as SpecType | 'all')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="epic">Epic</option>
                <option value="user-story">User Story</option>
                <option value="technical-spec">Technical Spec</option>
                <option value="test-case">Test Case</option>
              </select>
            </div>
            
            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Create New Spec
            </button>
          </div>
          
          {/* Spec List */}
          {loading ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <div className="text-gray-500">Loading specs...</div>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <div className="text-red-600">{error}</div>
              <button
                onClick={fetchSpecs}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                Try again
              </button>
            </div>
          ) : filteredSpecs.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <div className="text-gray-500">
                {specs.length === 0
                  ? 'No specs yet. Create your first spec to get started!'
                  : 'No specs match your filters.'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSpecs.map((spec) => (
                <div
                  key={spec.id}
                  onClick={() => router.push(`/specs/${spec.id}`)}
                  className="cursor-pointer rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {spec.title}
                        </h3>
                        <WorkflowStatusBadge status={spec.metadata.status} />
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          {spec.metadata.type}
                        </span>
                      </div>
                      
                      {spec.metadata.tags && spec.metadata.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {spec.metadata.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span>v{spec.currentVersion}</span>
                        <span>Updated {formatDate(spec.updatedAt)}</span>
                        {spec.metadata.assignee && (
                          <span>Assigned to {spec.metadata.assignee}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Recent Activity Section */}
          {!loading && specs.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Recent Activity</h2>
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="space-y-3">
                  {specs
                    .slice()
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 5)
                    .map((spec) => (
                      <div
                        key={spec.id}
                        className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{spec.title}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            was updated {formatDate(spec.updatedAt)}
                          </span>
                        </div>
                        <WorkflowStatusBadge status={spec.metadata.status} />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Create Spec Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Create New Spec</h2>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={newSpecTitle}
                  onChange={(e) => setNewSpecTitle(e.target.value)}
                  placeholder="Enter spec title"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Template
                </label>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <label
                      key={template.id}
                      className="flex cursor-pointer items-start rounded-md border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplate === template.id}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTemplate('');
                  setNewSpecTitle('');
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSpec}
                disabled={!selectedTemplate || !newSpecTitle.trim() || creating}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
