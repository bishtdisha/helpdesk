import { RBACPermission, PermissionScope, AccessScope, RoleType } from '../types/rbac';

// Permission actions
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  ASSIGN: 'assign',
  MANAGE: 'manage',
} as const;

// Resource types
export const RESOURCE_TYPES = {
  USERS: 'users',
  TEAMS: 'teams',
  ROLES: 'roles',
  TICKETS: 'tickets',
  ANALYTICS: 'analytics',
  KNOWLEDGE_BASE: 'knowledge_base',
  FOLLOWERS: 'followers',
  SLA: 'sla',
  ESCALATION: 'escalation',
  REPORTS: 'reports',
} as const;

// Permission scopes
export const PERMISSION_SCOPES = {
  OWN: 'own' as PermissionScope,
  TEAM: 'team' as PermissionScope,
  ORGANIZATION: 'organization' as PermissionScope,
} as const;

// Role definitions
export const ROLE_TYPES = {
  ADMIN_MANAGER: 'Admin/Manager' as RoleType,
  TEAM_LEADER: 'Team Leader' as RoleType,
  USER_EMPLOYEE: 'Employee' as RoleType,
} as const;

// Permission matrix - defines what each role can do
export const ROLE_PERMISSIONS: Record<RoleType, RBACPermission[]> = {
  'Admin/Manager': [
    // User management - full access
    { action: PERMISSION_ACTIONS.CREATE, resource: RESOURCE_TYPES.USERS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.USERS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.UPDATE, resource: RESOURCE_TYPES.USERS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.DELETE, resource: RESOURCE_TYPES.USERS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.ASSIGN, resource: RESOURCE_TYPES.USERS, scope: PERMISSION_SCOPES.ORGANIZATION },
    
    // Team management - full access
    { action: PERMISSION_ACTIONS.CREATE, resource: RESOURCE_TYPES.TEAMS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.TEAMS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.UPDATE, resource: RESOURCE_TYPES.TEAMS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.DELETE, resource: RESOURCE_TYPES.TEAMS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.MANAGE, resource: RESOURCE_TYPES.TEAMS, scope: PERMISSION_SCOPES.ORGANIZATION },
    
    // Role management - full access
    { action: PERMISSION_ACTIONS.CREATE, resource: RESOURCE_TYPES.ROLES, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.ROLES, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.UPDATE, resource: RESOURCE_TYPES.ROLES, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.DELETE, resource: RESOURCE_TYPES.ROLES, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.ASSIGN, resource: RESOURCE_TYPES.ROLES, scope: PERMISSION_SCOPES.ORGANIZATION },
    
    // Analytics - organization-wide
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.ANALYTICS, scope: PERMISSION_SCOPES.ORGANIZATION },
    

    
    // Tickets - full access
    { action: PERMISSION_ACTIONS.CREATE, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.UPDATE, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.DELETE, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.ASSIGN, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.ORGANIZATION },
    
    // Knowledge base - full access
    { action: PERMISSION_ACTIONS.CREATE, resource: RESOURCE_TYPES.KNOWLEDGE_BASE, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.KNOWLEDGE_BASE, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.UPDATE, resource: RESOURCE_TYPES.KNOWLEDGE_BASE, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.DELETE, resource: RESOURCE_TYPES.KNOWLEDGE_BASE, scope: PERMISSION_SCOPES.ORGANIZATION },
  ],
  
  'Team Leader': [
    // User management - NO ACCESS (removed for Team Leader role)
    // Team Leaders cannot access user management module
    
    // Team management - read only for assigned teams
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.TEAMS, scope: PERMISSION_SCOPES.TEAM },
    
    // Analytics - team specific
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.ANALYTICS, scope: PERMISSION_SCOPES.TEAM },
    
    // Tickets - team scope
    { action: PERMISSION_ACTIONS.CREATE, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.TEAM },
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.TEAM },
    { action: PERMISSION_ACTIONS.UPDATE, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.TEAM },
    { action: PERMISSION_ACTIONS.ASSIGN, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.TEAM },
    
    // Knowledge base - read and create
    { action: PERMISSION_ACTIONS.CREATE, resource: RESOURCE_TYPES.KNOWLEDGE_BASE, scope: PERMISSION_SCOPES.TEAM },
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.KNOWLEDGE_BASE, scope: PERMISSION_SCOPES.ORGANIZATION },
    { action: PERMISSION_ACTIONS.UPDATE, resource: RESOURCE_TYPES.KNOWLEDGE_BASE, scope: PERMISSION_SCOPES.OWN },
  ],
  
  'Employee': [
    // User management - own profile only
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.USERS, scope: PERMISSION_SCOPES.OWN },
    { action: PERMISSION_ACTIONS.UPDATE, resource: RESOURCE_TYPES.USERS, scope: PERMISSION_SCOPES.OWN },
    
    // Team management - read own team only
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.TEAMS, scope: PERMISSION_SCOPES.OWN },
    
    // Tickets - limited access
    { action: PERMISSION_ACTIONS.CREATE, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.OWN },
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.OWN },
    { action: PERMISSION_ACTIONS.UPDATE, resource: RESOURCE_TYPES.TICKETS, scope: PERMISSION_SCOPES.OWN },
    
    // Knowledge base - read only
    { action: PERMISSION_ACTIONS.READ, resource: RESOURCE_TYPES.KNOWLEDGE_BASE, scope: PERMISSION_SCOPES.ORGANIZATION },
  ],
};

// Access scope definitions for each role
export const ROLE_ACCESS_SCOPES: Record<RoleType, AccessScope> = {
  'Admin/Manager': {
    canViewUsers: true,
    canEditUsers: true,
    canCreateUsers: true,
    canDeleteUsers: true,
    canManageRoles: true,
    canManageTeams: true,
    teamIds: [], // Empty means all teams
    organizationWide: true,
  },
  
  'Team Leader': {
    canViewUsers: false,
    canEditUsers: false,
    canCreateUsers: false,
    canDeleteUsers: false,
    canManageRoles: false,
    canManageTeams: false,
    teamIds: [], // Will be populated with assigned teams
    organizationWide: false,
  },
  
  'Employee': {
    canViewUsers: false,
    canEditUsers: false,
    canCreateUsers: false,
    canDeleteUsers: false,
    canManageRoles: false,
    canManageTeams: false,
    teamIds: [], // Will be populated with own team
    organizationWide: false,
  },
};

// Helper functions for permission checking
export function hasPermission(
  userPermissions: RBACPermission[],
  action: string,
  resource: string,
  scope?: PermissionScope
): boolean {
  return userPermissions.some(permission => 
    permission.action === action && 
    permission.resource === resource &&
    (scope ? permission.scope === scope : true)
  );
}

export function getPermissionsForRole(roleType: RoleType): RBACPermission[] {
  return ROLE_PERMISSIONS[roleType] || [];
}

export function getAccessScopeForRole(roleType: RoleType): AccessScope {
  return { ...ROLE_ACCESS_SCOPES[roleType] };
}

// Permission validation helpers
export function canAccessUser(
  currentUserRole: RoleType,
  currentUserTeamIds: string[],
  targetUserTeamId?: string,
  targetUserId?: string,
  currentUserId?: string
): boolean {
  switch (currentUserRole) {
    case ROLE_TYPES.ADMIN_MANAGER:
      return true;
    
    case ROLE_TYPES.TEAM_LEADER:
      return targetUserTeamId ? currentUserTeamIds.includes(targetUserTeamId) : false;
    
    case ROLE_TYPES.USER_EMPLOYEE:
      return targetUserId === currentUserId;
    
    default:
      return false;
  }
}

export function canAccessTeam(
  currentUserRole: RoleType,
  currentUserTeamIds: string[],
  targetTeamId: string
): boolean {
  switch (currentUserRole) {
    case ROLE_TYPES.ADMIN_MANAGER:
      return true;
    
    case ROLE_TYPES.TEAM_LEADER:
      return currentUserTeamIds.includes(targetTeamId);
    
    case ROLE_TYPES.USER_EMPLOYEE:
      return currentUserTeamIds.includes(targetTeamId);
    
    default:
      return false;
  }
}

// Ticket-specific permission scopes
export type TicketAccessScope = 'all' | 'team' | 'own' | 'own_and_following';
export type KnowledgeBaseAccessScope = 'all' | 'team' | 'public' | 'own';
export type AnalyticsAccessScope = 'organization' | 'team' | 'none';

// Detailed ticket permissions matrix
export const TICKET_PERMISSIONS = {
  'Admin/Manager': {
    tickets: {
      create: true,
      read: 'all' as TicketAccessScope,
      update: 'all' as TicketAccessScope,
      delete: true,
      assign: 'all' as TicketAccessScope,
      close: 'all' as TicketAccessScope,
    },
    knowledgeBase: {
      create: true,
      read: 'all' as KnowledgeBaseAccessScope,
      update: 'all' as KnowledgeBaseAccessScope,
      delete: true,
      publish: true,
    },
    followers: {
      add: 'all' as TicketAccessScope,
      remove: 'all' as TicketAccessScope,
    },
    analytics: {
      view: 'organization' as AnalyticsAccessScope,
      export: true,
      viewComparative: true,
    },
    sla: {
      manage: true,
      view: true,
    },
    escalation: {
      manage: true,
      view: true,
    },
  },
  'Team Leader': {
    tickets: {
      create: true,
      read: 'team' as TicketAccessScope,
      update: 'team' as TicketAccessScope,
      delete: false,
      assign: 'team' as TicketAccessScope,
      close: 'team' as TicketAccessScope,
    },
    knowledgeBase: {
      create: true,
      read: 'team' as KnowledgeBaseAccessScope,
      update: 'own' as KnowledgeBaseAccessScope,
      delete: false,
      publish: false,
    },
    followers: {
      add: 'team' as TicketAccessScope,
      remove: 'team' as TicketAccessScope,
    },
    analytics: {
      view: 'team' as AnalyticsAccessScope,
      export: true,
      viewComparative: false,
    },
    sla: {
      manage: false,
      view: true,
    },
    escalation: {
      manage: false,
      view: true,
    },
  },
  'Employee': {
    tickets: {
      create: true,
      read: 'own_and_following' as TicketAccessScope,
      update: 'own' as TicketAccessScope,
      delete: false,
      assign: false,
      close: false,
    },
    knowledgeBase: {
      create: false,
      read: 'public' as KnowledgeBaseAccessScope,
      update: false,
      delete: false,
      publish: false,
    },
    followers: {
      add: false,
      remove: 'own' as TicketAccessScope,
    },
    analytics: {
      view: 'none' as AnalyticsAccessScope,
      export: false,
      viewComparative: false,
    },
    sla: {
      manage: false,
      view: false,
    },
    escalation: {
      manage: false,
      view: false,
    },
  },
} as const;

// Helper to get ticket permissions for a role
export function getTicketPermissionsForRole(roleType: RoleType) {
  return TICKET_PERMISSIONS[roleType];
}
