// Core type definitions for SpecCraft

export type WorkflowStage = 'Idea' | 'Draft' | 'Review' | 'Ready' | 'InProgress' | 'Done';

export type SpecType = 'epic' | 'user-story' | 'technical-spec' | 'test-case';

export type UserRole = 'PM' | 'TA' | 'Dev' | 'QA' | 'Stakeholder';

export interface SpecMetadata {
  title: string;
  status: WorkflowStage;
  type: SpecType;
  assignee?: string;
  tags: string[];
  parentId?: string;
}

// Re-export all types
export * from './auth';
export * from './permissions';
export * from './spec';
export * from './template';
