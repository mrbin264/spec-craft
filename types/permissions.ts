// Permission types and definitions
import { UserRole } from './auth';

export type WorkflowStage = 'Idea' | 'Draft' | 'Review' | 'Ready' | 'InProgress' | 'Done';

export type Permission =
  | 'spec:create'
  | 'spec:read'
  | 'spec:update'
  | 'spec:delete'
  | 'spec:transition'
  | 'comment:create'
  | 'comment:read'
  | 'comment:update'
  | 'comment:delete'
  | 'traceability:create'
  | 'traceability:read'
  | 'traceability:delete'
  | 'file:upload'
  | 'file:read'
  | 'ai:use';

export interface WorkflowTransition {
  from: WorkflowStage;
  to: WorkflowStage;
  allowedRoles: UserRole[];
}

// Define workflow transitions and allowed roles
export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  { from: 'Idea', to: 'Draft', allowedRoles: ['PM', 'TA'] },
  { from: 'Draft', to: 'Review', allowedRoles: ['PM', 'TA'] },
  { from: 'Review', to: 'Draft', allowedRoles: ['PM'] }, // Reject
  { from: 'Review', to: 'Ready', allowedRoles: ['PM', 'Stakeholder'] },
  { from: 'Ready', to: 'InProgress', allowedRoles: ['Dev'] },
  { from: 'InProgress', to: 'Done', allowedRoles: ['QA'] },
];

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  PM: [
    'spec:create',
    'spec:read',
    'spec:update',
    'spec:delete',
    'spec:transition',
    'comment:create',
    'comment:read',
    'comment:update',
    'comment:delete',
    'traceability:create',
    'traceability:read',
    'traceability:delete',
    'file:upload',
    'file:read',
    'ai:use',
  ],
  TA: [
    'spec:create',
    'spec:read',
    'spec:update',
    'spec:transition',
    'comment:create',
    'comment:read',
    'comment:update',
    'traceability:create',
    'traceability:read',
    'file:upload',
    'file:read',
    'ai:use',
  ],
  Dev: [
    'spec:read',
    'spec:update',
    'spec:transition',
    'comment:create',
    'comment:read',
    'traceability:read',
    'file:upload',
    'file:read',
    'ai:use',
  ],
  QA: [
    'spec:read',
    'spec:transition',
    'comment:create',
    'comment:read',
    'traceability:read',
    'file:read',
    'ai:use',
  ],
  Stakeholder: [
    'spec:read',
    'spec:transition',
    'comment:create',
    'comment:read',
    'traceability:read',
    'file:read',
  ],
};
