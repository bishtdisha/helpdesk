import { User, Role, Team, Permission, UserRole, RolePermission, TeamLeader, AuditLog } from '@prisma/client';

// Re-export Prisma types
export type { User, Role, Team, Permission, UserRole, RolePermission, TeamLeader, AuditLog } from '@prisma/client';

// Extended types with relationships
export interface UserWithRole extends User {
  role: Role | null;
  team: Team | null;
  teamLeaderships: TeamLeader[];
}

export interface RoleWithPermissions extends Role {
  rolePermissions: (RolePermission & {
    permission: Permission;
  })[];
}

export interface TeamWithMembers extends Team {
  members: User[];
  teamLeaders: (TeamLeader & {
    user: User;
  })[];
}

// Core RBAC interfaces
export interface RBACPermission {
  action: string;
  resource: string;
  scope: PermissionScope;
  conditions?: Record<string, any>;
}

export interface AccessScope {
  canViewUsers: boolean;
  canEditUsers: boolean;
  canCreateUsers: boolean;
  canDeleteUsers: boolean;
  canManageRoles: boolean;
  canManageTeams: boolean;
  teamIds: string[];
  organizationWide: boolean;
}

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  scope: AccessScope;
}

// Permission scopes
export type PermissionScope = 'own' | 'team' | 'organization';

// Role types
export type RoleType = 'Admin/Manager' | 'Team Leader' | 'User/Employee';

// User creation and update interfaces
export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  roleId?: string;
  teamId?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roleId?: string;
  teamId?: string;
  isActive?: boolean;
}

export interface UpdateOwnProfileData {
  name?: string;
  email?: string;
}

// Team management interfaces
export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
}

export interface TeamAssignmentData {
  userId: string;
  teamId: string;
}

export interface RoleAssignmentData {
  userId: string;
  roleId: string;
}

// Permission checking interfaces
export interface PermissionCheckRequest {
  userId: string;
  action: string;
  resource: string;
  targetUserId?: string;
  teamId?: string;
}

export interface UserPermissions {
  userId: string;
  roleId: string;
  roleName: string;
  permissions: RBACPermission[];
  accessScope: AccessScope;
  teamIds: string[];
}

// Audit logging interfaces
export interface AuditLogData {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  success: boolean;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role?: {
      name: string;
    } | null;
  } | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  success: boolean;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
}

export interface AuditLogResult {
  logs: AuditLogEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface AuditLogStats {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  permissionViolations: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resourceType: string; count: number }>;
  recentViolations: Array<{
    userId: string;
    action: string;
    resourceType: string;
    timestamp: Date;
    user?: { name: string; email: string };
  }>;
}

// API response interfaces
export interface UserListResponse {
  users: UserWithRole[];
  total: number;
  page: number;
  limit: number;
}

export interface TeamListResponse {
  teams: TeamWithMembers[];
  total: number;
  page: number;
  limit: number;
}

// Filter and pagination interfaces
export interface UserFilters {
  roleId?: string;
  teamId?: string;
  isActive?: boolean;
  search?: string;
}

export interface TeamFilters {
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

// Safe user types (without sensitive data)
export type SafeUserWithRole = Omit<UserWithRole, 'password'>;
export type SafeUser = Omit<User, 'password'>;