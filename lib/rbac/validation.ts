import { ROLE_TYPES, ROLE_PERMISSIONS, ROLE_ACCESS_SCOPES } from './permissions';
import { RoleType } from '../types/rbac';
import { InvalidUserRoleError } from './errors';

// Validate role type
export function validateRoleType(roleType: string): RoleType {
  const validRoles = Object.values(ROLE_TYPES);
  if (!validRoles.includes(roleType as RoleType)) {
    throw new InvalidUserRoleError(roleType);
  }
  return roleType as RoleType;
}

// Validate that all required roles have permissions defined
export function validatePermissionMatrix(): boolean {
  const requiredRoles = Object.values(ROLE_TYPES);
  
  for (const role of requiredRoles) {
    if (!ROLE_PERMISSIONS[role]) {
      throw new Error(`Missing permissions definition for role: ${role}`);
    }
    
    if (!ROLE_ACCESS_SCOPES[role]) {
      throw new Error(`Missing access scope definition for role: ${role}`);
    }
  }
  
  return true;
}

// Validate user role assignment
export function validateUserRole(userId: string, roleId: string, roleName: string): void {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!roleId) {
    throw new Error('Role ID is required');
  }
  
  if (!roleName) {
    throw new Error('Role name is required');
  }
  
  validateRoleType(roleName);
}

// Validate team assignment
export function validateTeamAssignment(userId: string, teamId: string): void {
  if (!userId) {
    throw new Error('User ID is required for team assignment');
  }
  
  if (!teamId) {
    throw new Error('Team ID is required for team assignment');
  }
}

// Initialize and validate RBAC system
export function initializeRBAC(): void {
  try {
    validatePermissionMatrix();
    console.log('RBAC system initialized successfully');
  } catch (error) {
    console.error('RBAC system initialization failed:', error);
    throw error;
  }
}