'use client';

import { WorkflowStage } from '@/types/spec';
import { WorkflowStatusBadge } from './workflow-status-badge';

interface WorkflowHistoryEntry {
  stage: WorkflowStage;
  timestamp: Date;
  author: string;
}

interface WorkflowHistoryProps {
  history: WorkflowHistoryEntry[];
  currentStage: WorkflowStage;
  className?: string;
}

export function WorkflowHistory({
  history,
  currentStage,
  className = '',
}: WorkflowHistoryProps) {
  if (history.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No workflow history available
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Workflow History</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline entries */}
        <div className="space-y-6">
          {history.map((entry, index) => {
            const isCurrentStage = entry.stage === currentStage;
            const date = new Date(entry.timestamp);

            return (
              <div key={index} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isCurrentStage
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {isCurrentStage && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>

                {/* Entry content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <WorkflowStatusBadge status={entry.stage} />
                    {isCurrentStage && (
                      <span className="text-xs text-blue-600 font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{entry.author}</span>
                    {' • '}
                    <time dateTime={date.toISOString()}>
                      {date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
