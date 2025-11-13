'use client';

import { WorkflowStage } from '@/types/spec';

interface WorkflowStatusBadgeProps {
  status: WorkflowStage;
  className?: string;
}

const statusColors: Record<WorkflowStage, string> = {
  Idea: 'bg-gray-100 text-gray-800 border-gray-300',
  Draft: 'bg-blue-100 text-blue-800 border-blue-300',
  Review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Ready: 'bg-green-100 text-green-800 border-green-300',
  InProgress: 'bg-purple-100 text-purple-800 border-purple-300',
  Done: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export function WorkflowStatusBadge({ status, className = '' }: WorkflowStatusBadgeProps) {
  const colorClass = statusColors[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass} ${className}`}
    >
      {status}
    </span>
  );
}
