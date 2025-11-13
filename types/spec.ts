// Spec document types and interfaces

export type WorkflowStage = 'Idea' | 'Draft' | 'Review' | 'Ready' | 'InProgress' | 'Done';
export type SpecType = 'epic' | 'user-story' | 'technical-spec' | 'test-case';

export interface SpecMetadata {
  title: string;
  status: WorkflowStage;
  type: SpecType;
  assignee?: string;
  tags: string[];
  parentId?: string;
}

export interface Spec {
  _id: string;
  title: string;
  content: string;
  metadata: SpecMetadata;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  currentVersion: number;
}

export interface Revision {
  _id: string;
  specId: string;
  version: number;
  content: string;
  metadata: SpecMetadata;
  author: string;
  timestamp: Date;
}

export interface LineRange {
  start: number;
  end: number;
}

export interface Comment {
  _id: string;
  specId: string;
  parentCommentId?: string;
  author: string;
  text: string;
  lineRange: LineRange;
  mentions: string[];
  timestamp: Date;
}

export interface TraceabilityLink {
  _id: string;
  parentId: string;
  childId: string;
  createdBy: string;
  createdAt: Date;
}

export interface AIUsageLog {
  _id: string;
  userId: string;
  specId: string;
  action: string;
  model: string;
  tokensUsed: number;
  timestamp: Date;
}

export interface FileAttachment {
  _id: string;
  specId: string;
  fileName: string;
  blobPath: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}
