'use client';

import { useState } from 'react';
import { AIAction } from '@/lib/ai-client';

interface AIAssistantPanelProps {
  selectedText: string;
  context: string;
  specId: string;
  position: { x: number; y: number };
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
  onClose: () => void;
}

interface AIActionOption {
  id: AIAction;
  label: string;
  description: string;
  icon: string;
}

const AI_ACTIONS: AIActionOption[] = [
  {
    id: 'complete',
    label: 'Complete',
    description: 'Continue writing from selected text',
    icon: '✨',
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    description: 'Improve clarity and conciseness',
    icon: '✏️',
  },
  {
    id: 'generate-criteria',
    label: 'Generate Criteria',
    description: 'Create acceptance criteria from user story',
    icon: '✓',
  },
  {
    id: 'generate-tests',
    label: 'Generate Tests',
    description: 'Create test cases for specification',
    icon: '🧪',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Create a concise summary',
    icon: '📝',
  },
  {
    id: 'extract-tasks',
    label: 'Extract Tasks',
    description: 'Pull out actionable tasks',
    icon: '☑️',
  },
  {
    id: 'translate',
    label: 'Translate',
    description: 'Translate to another language',
    icon: '🌐',
  },
];

export function AIAssistantPanel({
  selectedText,
  context,
  specId,
  position,
  onInsert,
  onReplace,
  onClose,
}: AIAssistantPanelProps) {
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);
  const [estimatedTokens, setEstimatedTokens] = useState<number | null>(null);

  const handleAction = async (action: AIAction) => {
    setLoading(true);
    setError(null);
    setGeneratedText(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          selectedText,
          context,
          specId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate content');
      }

      const data = await response.json();
      setGeneratedText(data.generatedText);
      setTokensUsed(data.tokensUsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (generatedText) {
      onInsert(generatedText);
      onClose();
    }
  };

  const handleReplace = () => {
    if (generatedText) {
      onReplace(generatedText);
      onClose();
    }
  };

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-96 max-h-[600px] overflow-hidden flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!generatedText && !loading && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Select an action to generate content:
            </p>
            <div className="space-y-2">
              {AI_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{action.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {action.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Generating content...</p>
          </div>
        )}

        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-red-600">⚠️</span>
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setError(null);
                setGeneratedText(null);
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {generatedText && (
          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Generated Content
                </p>
                {tokensUsed && (
                  <span className="text-xs text-gray-500">
                    {tokensUsed} tokens used
                  </span>
                )}
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                  {generatedText}
                </pre>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleInsert}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Insert
              </button>
              <button
                onClick={handleReplace}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Replace
              </button>
              <button
                onClick={() => {
                  setGeneratedText(null);
                  setTokensUsed(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer with quota info */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <QuotaDisplay />
      </div>
    </div>
  );
}

function QuotaDisplay() {
  const [quota, setQuota] = useState<{
    used: number;
    dailyLimit: number;
    remaining: number;
  } | null>(null);

  useState(() => {
    fetch('/api/ai/quota')
      .then((res) => res.json())
      .then((data) => setQuota(data))
      .catch(() => {});
  });

  if (!quota) {
    return null;
  }

  const percentage = (quota.used / quota.dailyLimit) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>Daily Quota</span>
        <span>
          {quota.used.toLocaleString()} / {quota.dailyLimit.toLocaleString()}{' '}
          tokens
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage > 90
              ? 'bg-red-600'
              : percentage > 70
              ? 'bg-yellow-600'
              : 'bg-green-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}
