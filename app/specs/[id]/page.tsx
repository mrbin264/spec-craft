'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SpecEditor } from '@/components/spec-editor';
import { VersionHistory } from '@/components/version-history';
import { DiffViewer } from '@/components/diff-viewer';
import { WorkflowStatusBadge } from '@/components/workflow-status-badge';
import { WorkflowTransitionButton } from '@/components/workflow-transition-button';
import { SpecMetadata, WorkflowStage } from '@/types/spec';
import { useAuth } from '@/lib/auth-context';

interface Spec {
  _id: string;
  title: string;
  content: string;
  metadata: SpecMetadata;
}

export default function SpecPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [spec, setSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'versions' | 'workflow'>('versions');
  const [compareVersions, setCompareVersions] = useState<{ rev1: number; rev2: number } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchSpec = async () => {
      try {
        const response = await fetch(`/api/specs/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch spec');
        }
        const data = await response.json();
        setSpec(data.spec);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSpec();
  }, [params.id, user, router]);

  const handleSave = async (content: string, metadata: SpecMetadata) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/specs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, metadata }),
      });

      if (!response.ok) {
        throw new Error('Failed to save spec');
      }

      const data = await response.json();
      setSpec(data.spec);
    } catch (err) {
      console.error('Save error:', err);
      throw err;
    }
  };

  const handleTransition = async (newStage: WorkflowStage) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/specs/${params.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ toStage: newStage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to transition stage');
      }

      const data = await response.json();
      setSpec(data.spec);
    } catch (err) {
      console.error('Transition error:', err);
      throw err;
    }
  };

  const handleCompare = (rev1: number, rev2: number) => {
    setCompareVersions({ rev1, rev2 });
  };

  const handleRestore = async (version: number) => {
    try {
      // Fetch the revision content
      const response = await fetch(`/api/specs/${params.id}/revisions`);
      if (!response.ok) {
        throw new Error('Failed to fetch revisions');
      }
      
      const data = await response.json();
      const revision = data.revisions.find((rev: any) => rev.version === version);
      
      if (!revision) {
        throw new Error('Revision not found');
      }
      
      // Save the revision content as a new version
      await handleSave(revision.content, revision.metadata);
      
      // Refresh the page to show the restored content
      window.location.reload();
    } catch (err) {
      console.error('Restore error:', err);
      alert('Failed to restore version');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading spec...</p>
        </div>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Spec not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with workflow controls and version history button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{spec.title}</h1>
          <WorkflowStatusBadge status={spec.metadata.status} />
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <WorkflowTransitionButton
              specId={spec._id}
              currentStage={spec.metadata.status}
              userRole={user.role}
              onTransition={handleTransition}
            />
          )}
          <button
            onClick={() => {
              setShowSidebar(!showSidebar);
              if (!showSidebar) setSidebarTab('versions');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            {showSidebar ? 'Hide' : 'Show'} History
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={`${showSidebar ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
          <SpecEditor
            specId={spec._id}
            initialContent={spec.content}
            initialMetadata={spec.metadata}
            onSave={handleSave}
          />
        </div>

        {/* History Sidebar */}
        {showSidebar && (
          <div className="w-1/3 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setSidebarTab('versions')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  sidebarTab === 'versions'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Version History
              </button>
              <button
                onClick={() => setSidebarTab('workflow')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  sidebarTab === 'workflow'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Workflow History
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {sidebarTab === 'versions' ? (
                <VersionHistory
                  specId={spec._id}
                  onCompare={handleCompare}
                  onRestore={handleRestore}
                />
              ) : (
                <div className="p-4 text-gray-600 text-sm">
                  Workflow history will be tracked in future revisions. Each time the workflow stage changes, it will be recorded here with the author and timestamp.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Diff Viewer Modal */}
      {compareVersions && (
        <DiffViewer
          specId={spec._id}
          rev1={compareVersions.rev1}
          rev2={compareVersions.rev2}
          onClose={() => setCompareVersions(null)}
        />
      )}
    </div>
  );
}
