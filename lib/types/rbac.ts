import { User, Role, Team, Permission, UserRole, RolePermission, TeamLeader } from '@prisma/client';

// Re-export Prisma types
export type { User, Role, Team, Permission, UserRole, RolePermission, TeamLeader } from '@prisma/client';

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