// Permission checking utilities
import { UserRole } from '@/types/auth';
import {
  Permission,
  WorkflowStage,
  ROLE_PERMISSIONS,
  WORKFLOW_TRANSITIONS,
} from '@/types/permissions';

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role can perform multiple permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a role can perform at least one of the given permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role can transition a spec from one stage to another
 */
export function canTransitionWorkflow(
  role: UserRole,
  from: WorkflowStage,
  to: WorkflowStage
): boolean {
  const transition = WORKFLOW_TRANSITIONS.find(
    (t) => t.from === from && t.to === to
  );

  if (!transition) {
    return false;
  }

  return transition.allowedRoles.includes(role);
}

/**
 * Get all valid transitions from a given stage for a role
 */
export function getValidTransitions(
  role: UserRole,
  currentStage: WorkflowStage
): WorkflowStage[] {
  return WORKFLOW_TRANSITIONS.filter(
    (t) => t.from === currentStage && t.allowedRoles.includes(role)
  ).map((t) => t.to);
}

/**
 * Validate if a workflow transition is valid (regardless of role)
 */
export function isValidTransition(
  from: WorkflowStage,
  to: WorkflowStage
): boolean {
  return WORKFLOW_TRANSITIONS.some((t) => t.from === from && t.to === to);
}
