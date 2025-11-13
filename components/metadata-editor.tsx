'use client';

import { useState, useEffect } from 'react';
import { SpecMetadata, WorkflowStage, SpecType } from '@/types/spec';
import yaml from 'js-yaml';

interface MetadataEditorProps {
  metadata: SpecMetadata;
  onChange: (metadata: SpecMetadata) => void;
  readOnly?: boolean;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  'Idea',
  'Draft',
  'Review',
  'Ready',
  'InProgress',
  'Done',
];

const SPEC_TYPES: SpecType[] = [
  'epic',
  'user-story',
  'technical-spec',
  'test-case',
];

export function MetadataEditor({
  metadata,
  onChange,
  readOnly = false,
}: MetadataEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlText, setYamlText] = useState('');

  // Convert metadata to YAML when entering YAML mode
  useEffect(() => {
    if (yamlMode) {
      try {
        const yamlString = yaml.dump(metadata, { indent: 2 });
        setYamlText(yamlString);
        setYamlError(null);
      } catch (error) {
        setYamlError(`Failed to convert to YAML: ${error}`);
      }
    }
  }, [yamlMode, metadata]);

  const handleFieldChange = (field: keyof SpecMetadata, value: any) => {
    if (readOnly) return;
    onChange({ ...metadata, [field]: value });
  };

  const handleTagsChange = (tagsString: string) => {
    if (readOnly) return;
    const tags = tagsString
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    onChange({ ...metadata, tags });
  };

  const handleYamlChange = (value: string) => {
    setYamlText(value);
    setYamlError(null);

    try {
      const parsed = yaml.load(value) as any;
      
      // Validate the parsed YAML has required fields
      if (!parsed.title || typeof parsed.title !== 'string') {
        setYamlError('Missing or invalid "title" field');
        return;
      }
      if (!parsed.status || !WORKFLOW_STAGES.includes(parsed.status)) {
        setYamlError('Missing or invalid "status" field');
        return;
      }
      if (!parsed.type || !SPEC_TYPES.includes(parsed.type)) {
        setYamlError('Missing or invalid "type" field');
        return;
      }

      // Construct valid metadata
      const newMetadata: SpecMetadata = {
        title: parsed.title,
        status: parsed.status,
        type: parsed.type,
        assignee: parsed.assignee || undefined,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        parentId: parsed.parentId || undefined,
      };

      onChange(newMetadata);
    } catch (error: any) {
      setYamlError(`YAML parsing error at line ${error.mark?.line || '?'}: ${error.message}`);
    }
  };

  const toggleYamlMode = () => {
    if (!yamlMode && yamlError) {
      // Don't allow switching to YAML mode if there's an error
      return;
    }
    setYamlMode(!yamlMode);
  };

  return (
    <div className="border-b bg-gray-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">Metadata</span>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="flex justify-end mb-2">
            <button
              onClick={toggleYamlMode}
              disabled={readOnly}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {yamlMode ? 'Switch to Form' : 'Switch to YAML'}
            </button>
          </div>

          {yamlMode ? (
            <div>
              <textarea
                value={yamlText}
                onChange={(e) => handleYamlChange(e.target.value)}
                readOnly={readOnly}
                className="w-full h-48 p-3 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter YAML frontmatter..."
              />
              {yamlError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-600">{yamlError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={metadata.status}
                  onChange={(e) =>
                    handleFieldChange('status', e.target.value as WorkflowStage)
                  }
                  disabled={readOnly}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {WORKFLOW_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={metadata.type}
                  onChange={(e) =>
                    handleFieldChange('type', e.target.value as SpecType)
                  }
                  disabled={readOnly}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {SPEC_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee (optional)
                </label>
                <input
                  type="text"
                  value={metadata.assignee || ''}
                  onChange={(e) => handleFieldChange('assignee', e.target.value || undefined)}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={metadata.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="feature, backend, api"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent ID (optional)
                </label>
                <input
                  type="text"
                  value={metadata.parentId || ''}
                  onChange={(e) => handleFieldChange('parentId', e.target.value || undefined)}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="parent-spec-id"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
