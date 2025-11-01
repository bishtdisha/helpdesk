# Implementation Plan

- [x] 1. Extend database schema for RBAC
  - Create Prisma schema extensions for roles, teams, and audit logging tables
  - Add role_id, team_id, and is_active columns to existing User model
  - Create team_leaders junction table for many-to-many relationships
  - Generate and run database migrations
  - _Requirements: 4.1, 4.2, 5.1, 5.5_

- [x] 2. Create core RBAC data models and types
  - Define TypeScript interfaces for Role, Team, Permission, and AccessScope
  - Create Prisma model definitions with proper relationships
  - Implement permission matrix constants and role definitions
  - Create error classes for permission-related exceptions
  - _Requirements: 4.1, 4.4, 7.1_

- [x] 3. Implement Permission Engine service
  - Create PermissionEngine class with permission checking logic
  - Implement checkPermission method for action-based authorization
  - Build getUserPermissions method to retrieve user's effective permissions
  - Create validateAccess method for scope-based access control
  - _Requirements: 4.1, 4.2, 4.3, 6.2, 6.4_

- [x] 4. Build Role Management service
  - Implement RoleService class for role and team assignment operations
  - Create assignRole and assignToTeam methods with proper validation
  - Build getUserRole and getUserTeams methods for role retrieval
  - Add removeFromTeam method with permission checks
  - _Requirements: 1.2, 2.2, 5.2, 5.3_

- [x] 5. Create RBAC middleware for API protection
  - Build authentication middleware that includes role information in requests
  - Create permission validation middleware for protecting API endpoints
  - Implement scope-based filtering middleware for data access
  - Add audit logging middleware for tracking permission-sensitive actions
  - _Requirements: 4.2, 4.3, 4.4, 7.2_

- [x] 6. Implement user management API endpoints
  - Create POST /api/users endpoint for user creation (Admin only)
  - Build GET /api/users with role-based filtering and pagination
  - Implement GET /api/users/:id with permission-based access control
  - Create PUT /api/users/:id with scope validation for updates
  - Add DELETE /api/users/:id endpoint (Admin only)
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.4_

- [x] 7. Build role and team assignment endpoints
  - Create POST /api/users/:id/assign-role for role management (Admin only)
  - Implement POST /api/users/:id/assign-team for team assignments
  - Build GET /api/users/me for current user profile access
  - Create PUT /api/users/me for self-profile updates
  - _Requirements: 1.2, 2.2, 3.1, 3.2, 5.2_

- [x] 8. Implement team management API
  - Create POST /api/teams endpoint for team creation (Admin only)
  - Build GET /api/teams with role-based team visibility
  - Implement PUT /api/teams/:id for team updates (Admin only)
  - Create GET /api/teams/:id/members with permission-based access
  - Add DELETE /api/teams/:id with proper validation
  - _Requirements: 5.1, 5.2, 5.4, 6.1, 6.2_

- [x] 9. Create user management UI components
  - Build UserList component with role-based filtering and actions
  - Create UserForm component for creating and editing users
  - Implement RoleSelector component for role assignment
  - Build TeamSelector component for team assignment
  - Create UserProfile component for viewing and editing user details
  - _Requirements: 1.1, 1.3, 2.1, 3.1, 3.2_

- [x] 10. Build team management interface
  - Create TeamList component with role-appropriate team visibility
  - Build TeamForm component for team creation and editing (Admin only)
  - Implement TeamMembersList component with permission-based member access
  - Create TeamAssignment component for managing user-team relationships
  - _Requirements: 5.1, 5.2, 6.1, 6.2_

- [x] 11. Implement role-based navigation and UI controls
  - Create PermissionGate component for conditional UI rendering
  - Build RoleBasedNavigation component with appropriate menu items
  - Implement ActionButton component with permission-based visibility
  - Create UserRoleBadge component for displaying user roles
  - Update existing navigation to include user management links
  - _Requirements: 7.4, 1.1, 2.1, 6.1_

- [x] 12. Add audit logging and monitoring
  - Implement AuditLogger service for tracking permission-sensitive actions
  - Create audit log viewing interface for Admin users
  - Build permission violation monitoring and alerting
  - Add user activity tracking for security monitoring
  - _Requirements: 4.4, 1.5, 7.3_

- [x] 13. Create comprehensive test suite


  - Write unit tests for Permission Engine and Role Management services
  - Create integration tests for API endpoints with different user roles
  - Build end-to-end tests for complete user management workflows
  - Add security tests for authorization bypass attempts
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 14. Add performance optimizations 
  - Implement Redis caching for user permissions and role data
  - Add database indexes for role_id, team_id, and frequently queried fields
  - Create database views for complex permission queries
  - Implement pagination and filtering optimizations for large datasets
  - _Requirements: 4.2, 6.1, 6.2_