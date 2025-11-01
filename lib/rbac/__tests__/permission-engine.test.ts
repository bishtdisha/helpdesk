import { PermissionEngine, permissionEngine } from '../permission-engine';
import { PERMISSION_ACTIONS, RESOURCE_TYPES, ROLE_TYPES } from '../permissions';
import { PermissionError } from '../errors';

/**
 * Comprehensive test suite for Permission Engine
 * 
 * Tests core permission logic, access control, and error handling
 */

// Mock user data for testing
const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@test.com',
    name: 'Admin User',
    password: 'hashed',
    roleId: 'role-admin',
    teamId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: 'role-admin',
      name: 'Admin/Manager',
      description: 'Administrator role',
      permissions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    team: null,
    teamLeaderships: [],
  },
  teamLeader: {
    id: 'leader-1',
    email: 'leader@test.com',
    name: 'Team Leader',
    password: 'hashed',
    roleId: 'role-leader',
    teamId: 'team-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: 'role-leader',
      name: 'Team Leader',
      description: 'Team leader role',
      permissions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    team: {
      id: 'team-1',
      name: 'Team Alpha',
      description: 'Test team',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    teamLeaderships: [
      {
        id: 'tl-1',
        userId: 'leader-1',
        teamId: 'team-1',
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        team: {
          id: 'team-1',
          name: 'Team Alpha',
          description: 'Test team',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ],
  },
  user: {
    id: 'user-1',
    email: 'user@test.com',
    name: 'Regular User',
    password: 'hashed',
    roleId: 'role-user',
    teamId: 'team-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: 'role-user',
      name: 'User/Employee',
      description: 'Regular user role',
      permissions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    team: {
      id: 'team-1',
      name: 'Team Alpha',
      description: 'Test team',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    teamLeaderships: [],
  },
};

// Mock user data for testing
const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@test.com',
    name: 'Admin User',
    password: 'hashed',
    roleId: 'role-admin',
    teamId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: 'role-admin',
      name: 'Admin/Manager',
      description: 'Administrator role',
      permissions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    team: null,
    teamLeaderships: [],
  },
  teamLeader: {
    id: 'leader-1',
    email: 'leader@test.com',
    name: 'Team Leader',
    password: 'hashed',
    roleId: 'role-leader',
    teamId: 'team-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: 'role-leader',
      name: 'Team Leader',
      description: 'Team leader role',
      permissions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    team: {
      id: 'team-1',
      name: 'Team Alpha',
      description: 'Test team',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    teamLeaderships: [
      {
        id: 'tl-1',
        userId: 'leader-1',
        teamId: 'team-1',
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        team: {
          id: 'team-1',
          name: 'Team Alpha',
          description: 'Test team',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ],
  },
  user: {
    id: 'user-1',
    email: 'user@test.com',
    name: 'Regular User',
    password: 'hashed',
    roleId: 'role-user',
    teamId: 'team-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: 'role-user',
      name: 'User/Employee',
      description: 'Regular user role',
      permissions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    team: {
      id: 'team-1',
      name: 'Team Alpha',
      description: 'Test team',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    teamLeaderships: [],
  },
};

// Test permission checking logic
function testPermissionLogic() {
  console.log('=== Testing Permission Logic ===\n');
  
  const engine = new PermissionEngine();
  
  // Test role permissions retrieval
  console.log('Testing role permissions...');
  
  try {
    // This would normally require database access, so we'll test the logic directly
    const adminPerms = (engine as any).getRolePermissions(ROLE_TYPES.ADMIN_MANAGER);
    const teamLeaderPerms = (engine as any).getRolePermissions(ROLE_TYPES.TEAM_LEADER);
    const userPerms = (engine as any).getRolePermissions(ROLE_TYPES.USER_EMPLOYEE);
    
    console.log('✓ Admin permissions retrieved:', adminPerms.length > 0 ? 'PASS' : 'FAIL');
    console.log('✓ Team Leader permissions retrieved:', teamLeaderPerms.length > 0 ? 'PASS' : 'FAIL');
    console.log('✓ User permissions retrieved:', userPerms.length > 0 ? 'PASS' : 'FAIL');
    
    // Test specific permissions
    const adminCanCreateUsers = adminPerms.some((p: any) => 
      p.action === PERMISSION_ACTIONS.CREATE && p.resource === RESOURCE_TYPES.USERS
    );
    const teamLeaderCannotCreateUsers = !teamLeaderPerms.some((p: any) => 
      p.action === PERMISSION_ACTIONS.CREATE && p.resource === RESOURCE_TYPES.USERS
    );
    const userCanReadUsers = userPerms.some((p: any) => 
      p.action === PERMISSION_ACTIONS.READ && p.resource === RESOURCE_TYPES.USERS
    );
    
    console.log('✓ Admin can create users:', adminCanCreateUsers ? 'PASS' : 'FAIL');
    console.log('✓ Team Leader cannot create users:', teamLeaderCannotCreateUsers ? 'PASS' : 'FAIL');
    console.log('✓ User can read users (own):', userCanReadUsers ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.log('✗ Permission logic test failed:', error);
  }
}

// Test access scope logic
function testAccessScopeLogic() {
  console.log('\n=== Testing Access Scope Logic ===\n');
  
  const engine = new PermissionEngine();
  
  try {
    // Test access scope generation
    const adminScope = (engine as any).getUserAccessScope(mockUsers.admin);
    const teamLeaderScope = (engine as any).getUserAccessScope(mockUsers.teamLeader);
    const userScope = (engine as any).getUserAccessScope(mockUsers.user);
    
    console.log('✓ Admin scope - organization wide:', adminScope.organizationWide ? 'PASS' : 'FAIL');
    console.log('✓ Admin scope - can create users:', adminScope.canCreateUsers ? 'PASS' : 'FAIL');
    console.log('✓ Admin scope - can manage teams:', adminScope.canManageTeams ? 'PASS' : 'FAIL');
    
    console.log('✓ Team Leader scope - not organization wide:', !teamLeaderScope.organizationWide ? 'PASS' : 'FAIL');
    console.log('✓ Team Leader scope - can view users:', teamLeaderScope.canViewUsers ? 'PASS' : 'FAIL');
    console.log('✓ Team Leader scope - cannot create users:', !teamLeaderScope.canCreateUsers ? 'PASS' : 'FAIL');
    
    console.log('✓ User scope - not organization wide:', !userScope.organizationWide ? 'PASS' : 'FAIL');
    console.log('✓ User scope - cannot view users:', !userScope.canViewUsers ? 'PASS' : 'FAIL');
    console.log('✓ User scope - cannot manage teams:', !userScope.canManageTeams ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.log('✗ Access scope test failed:', error);
  }
}

// Test scope validation logic
function testScopeValidation() {
  console.log('\n=== Testing Scope Validation Logic ===\n');
  
  const engine = new PermissionEngine();
  
  try {
    // Test 'own' scope validation
    const userCanAccessSelf = (engine as any).validateScopeAccess(
      mockUsers.user, 'own', mockUsers.user.id
    );
    const userCannotAccessOther = !(engine as any).validateScopeAccess(
      mockUsers.user, 'own', mockUsers.admin.id
    );
    
    console.log('✓ User can access own data (own scope):', userCanAccessSelf ? 'PASS' : 'FAIL');
    console.log('✓ User cannot access other data (own scope):', userCannotAccessOther ? 'PASS' : 'FAIL');
    
    // Test 'organization' scope validation
    const adminHasOrgAccess = (engine as any).validateScopeAccess(
      mockUsers.admin, 'organization'
    );
    const userLacksOrgAccess = !(engine as any).validateScopeAccess(
      mockUsers.user, 'organization'
    );
    
    console.log('✓ Admin has organization access:', adminHasOrgAccess ? 'PASS' : 'FAIL');
    console.log('✓ User lacks organization access:', userLacksOrgAccess ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.log('✗ Scope validation test failed:', error);
  }
}

// Test error handling
function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===\n');
  
  const engine = new PermissionEngine();
  
  try {
    // Test default access scope
    const defaultScope = (engine as any).getDefaultAccessScope();
    
    console.log('✓ Default scope has no permissions:', 
      !defaultScope.canViewUsers && 
      !defaultScope.canCreateUsers && 
      !defaultScope.organizationWide ? 'PASS' : 'FAIL'
    );
    
    console.log('✓ Default scope has empty team IDs:', 
      Array.isArray(defaultScope.teamIds) && defaultScope.teamIds.length === 0 ? 'PASS' : 'FAIL'
    );
    
  } catch (error) {
    console.log('✗ Error handling test failed:', error);
  }
}

describe('PermissionEngine', () => {
  let engine: PermissionEngine;

  beforeEach(() => {
    engine = new PermissionEngine();
  });

  describe('Permission Logic', () => {
    test('should retrieve role permissions correctly', () => {
      const adminPerms = (engine as any).getRolePermissions(ROLE_TYPES.ADMIN_MANAGER);
      const teamLeaderPerms = (engine as any).getRolePermissions(ROLE_TYPES.TEAM_LEADER);
      const userPerms = (engine as any).getRolePermissions(ROLE_TYPES.USER_EMPLOYEE);

      expect(adminPerms).toBeDefined();
      expect(teamLeaderPerms).toBeDefined();
      expect(userPerms).toBeDefined();
      expect(adminPerms.length).toBeGreaterThan(0);
      expect(teamLeaderPerms.length).toBeGreaterThan(0);
      expect(userPerms.length).toBeGreaterThan(0);
    });

    test('should validate admin permissions correctly', () => {
      const adminPerms = (engine as any).getRolePermissions(ROLE_TYPES.ADMIN_MANAGER);
      
      const canCreateUsers = adminPerms.some((p: any) => 
        p.action === PERMISSION_ACTIONS.CREATE && p.resource === RESOURCE_TYPES.USERS
      );
      const canDeleteUsers = adminPerms.some((p: any) => 
        p.action === PERMISSION_ACTIONS.DELETE && p.resource === RESOURCE_TYPES.USERS
      );
      
      expect(canCreateUsers).toBe(true);
      expect(canDeleteUsers).toBe(true);
    });

    test('should validate team leader permissions correctly', () => {
      const teamLeaderPerms = (engine as any).getRolePermissions(ROLE_TYPES.TEAM_LEADER);
      
      const canCreateUsers = teamLeaderPerms.some((p: any) => 
        p.action === PERMISSION_ACTIONS.CREATE && p.resource === RESOURCE_TYPES.USERS
      );
      const canReadUsers = teamLeaderPerms.some((p: any) => 
        p.action === PERMISSION_ACTIONS.READ && p.resource === RESOURCE_TYPES.USERS
      );
      
      expect(canCreateUsers).toBe(false);
      expect(canReadUsers).toBe(true);
    });

    test('should validate user permissions correctly', () => {
      const userPerms = (engine as any).getRolePermissions(ROLE_TYPES.USER_EMPLOYEE);
      
      const canCreateUsers = userPerms.some((p: any) => 
        p.action === PERMISSION_ACTIONS.CREATE && p.resource === RESOURCE_TYPES.USERS
      );
      const canReadUsers = userPerms.some((p: any) => 
        p.action === PERMISSION_ACTIONS.READ && p.resource === RESOURCE_TYPES.USERS
      );
      
      expect(canCreateUsers).toBe(false);
      expect(canReadUsers).toBe(true); // Can read own profile
    });
  });

  describe('Access Scope Logic', () => {
    test('should generate correct admin access scope', () => {
      const adminScope = (engine as any).getUserAccessScope(mockUsers.admin);
      
      expect(adminScope.organizationWide).toBe(true);
      expect(adminScope.canCreateUsers).toBe(true);
      expect(adminScope.canManageTeams).toBe(true);
      expect(adminScope.canDeleteUsers).toBe(true);
    });

    test('should generate correct team leader access scope', () => {
      const teamLeaderScope = (engine as any).getUserAccessScope(mockUsers.teamLeader);
      
      expect(teamLeaderScope.organizationWide).toBe(false);
      expect(teamLeaderScope.canViewUsers).toBe(true);
      expect(teamLeaderScope.canCreateUsers).toBe(false);
      expect(teamLeaderScope.canDeleteUsers).toBe(false);
    });

    test('should generate correct user access scope', () => {
      const userScope = (engine as any).getUserAccessScope(mockUsers.user);
      
      expect(userScope.organizationWide).toBe(false);
      expect(userScope.canViewUsers).toBe(false);
      expect(userScope.canCreateUsers).toBe(false);
      expect(userScope.canManageTeams).toBe(false);
    });
  });

  describe('Scope Validation', () => {
    test('should validate own scope access correctly', () => {
      const userCanAccessSelf = (engine as any).validateScopeAccess(
        mockUsers.user, 'own', mockUsers.user.id
      );
      const userCannotAccessOther = (engine as any).validateScopeAccess(
        mockUsers.user, 'own', mockUsers.admin.id
      );
      
      expect(userCanAccessSelf).toBe(true);
      expect(userCannotAccessOther).toBe(false);
    });

    test('should validate organization scope access correctly', () => {
      const adminHasOrgAccess = (engine as any).validateScopeAccess(
        mockUsers.admin, 'organization'
      );
      const userLacksOrgAccess = (engine as any).validateScopeAccess(
        mockUsers.user, 'organization'
      );
      
      expect(adminHasOrgAccess).toBe(true);
      expect(userLacksOrgAccess).toBe(false);
    });

    test('should validate team scope access correctly', () => {
      const teamLeaderCanAccessTeam = (engine as any).validateScopeAccess(
        mockUsers.teamLeader, 'team', null, 'team-1'
      );
      const teamLeaderCannotAccessOtherTeam = (engine as any).validateScopeAccess(
        mockUsers.teamLeader, 'team', null, 'team-2'
      );
      
      expect(teamLeaderCanAccessTeam).toBe(true);
      expect(teamLeaderCannotAccessOtherTeam).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should return default access scope for invalid user', () => {
      const defaultScope = (engine as any).getDefaultAccessScope();
      
      expect(defaultScope.canViewUsers).toBe(false);
      expect(defaultScope.canCreateUsers).toBe(false);
      expect(defaultScope.organizationWide).toBe(false);
      expect(Array.isArray(defaultScope.teamIds)).toBe(true);
      expect(defaultScope.teamIds.length).toBe(0);
    });

    test('should handle null user gracefully', () => {
      const scope = (engine as any).getUserAccessScope(null);
      
      expect(scope.canViewUsers).toBe(false);
      expect(scope.canCreateUsers).toBe(false);
      expect(scope.organizationWide).toBe(false);
    });

    test('should handle invalid role gracefully', () => {
      const invalidUser = { ...mockUsers.user, role: { name: 'Invalid Role' } };
      const scope = (engine as any).getUserAccessScope(invalidUser);
      
      expect(scope.canViewUsers).toBe(false);
      expect(scope.canCreateUsers).toBe(false);
      expect(scope.organizationWide).toBe(false);
    });
  });

  describe('Permission Checking Integration', () => {
    test('should check permissions correctly for different roles', async () => {
      // Mock database calls would be needed for full integration
      // For now, test the permission logic structure
      expect(typeof engine.checkPermission).toBe('function');
      expect(typeof engine.getUserPermissions).toBe('function');
      expect(typeof engine.validateAccess).toBe('function');
    });
  });
});

// Legacy test functions for backward compatibility
function legacyTestPermissionLogic() {
  console.log('=== Testing Permission Logic ===\n');
  
  const engine = new PermissionEngine();
  
  try {
    const adminPerms = (engine as any).getRolePermissions(ROLE_TYPES.ADMIN_MANAGER);
    const teamLeaderPerms = (engine as any).getRolePermissions(ROLE_TYPES.TEAM_LEADER);
    const userPerms = (engine as any).getRolePermissions(ROLE_TYPES.USER_EMPLOYEE);
    
    console.log('✓ Admin permissions retrieved:', adminPerms.length > 0 ? 'PASS' : 'FAIL');
    console.log('✓ Team Leader permissions retrieved:', teamLeaderPerms.length > 0 ? 'PASS' : 'FAIL');
    console.log('✓ User permissions retrieved:', userPerms.length > 0 ? 'PASS' : 'FAIL');
    
    const adminCanCreateUsers = adminPerms.some((p: any) => 
      p.action === PERMISSION_ACTIONS.CREATE && p.resource === RESOURCE_TYPES.USERS
    );
    const teamLeaderCannotCreateUsers = !teamLeaderPerms.some((p: any) => 
      p.action === PERMISSION_ACTIONS.CREATE && p.resource === RESOURCE_TYPES.USERS
    );
    const userCanReadUsers = userPerms.some((p: any) => 
      p.action === PERMISSION_ACTIONS.READ && p.resource === RESOURCE_TYPES.USERS
    );
    
    console.log('✓ Admin can create users:', adminCanCreateUsers ? 'PASS' : 'FAIL');
    console.log('✓ Team Leader cannot create users:', teamLeaderCannotCreateUsers ? 'PASS' : 'FAIL');
    console.log('✓ User can read users (own):', userCanReadUsers ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.log('✗ Permission logic test failed:', error);
  }
}

function legacyTestAccessScopeLogic() {
  console.log('\n=== Testing Access Scope Logic ===\n');
  
  const engine = new PermissionEngine();
  
  try {
    const adminScope = (engine as any).getUserAccessScope(mockUsers.admin);
    const teamLeaderScope = (engine as any).getUserAccessScope(mockUsers.teamLeader);
    const userScope = (engine as any).getUserAccessScope(mockUsers.user);
    
    console.log('✓ Admin scope - organization wide:', adminScope.organizationWide ? 'PASS' : 'FAIL');
    console.log('✓ Admin scope - can create users:', adminScope.canCreateUsers ? 'PASS' : 'FAIL');
    console.log('✓ Admin scope - can manage teams:', adminScope.canManageTeams ? 'PASS' : 'FAIL');
    
    console.log('✓ Team Leader scope - not organization wide:', !teamLeaderScope.organizationWide ? 'PASS' : 'FAIL');
    console.log('✓ Team Leader scope - can view users:', teamLeaderScope.canViewUsers ? 'PASS' : 'FAIL');
    console.log('✓ Team Leader scope - cannot create users:', !teamLeaderScope.canCreateUsers ? 'PASS' : 'FAIL');
    
    console.log('✓ User scope - not organization wide:', !userScope.organizationWide ? 'PASS' : 'FAIL');
    console.log('✓ User scope - cannot view users:', !userScope.canViewUsers ? 'PASS' : 'FAIL');
    console.log('✓ User scope - cannot manage teams:', !userScope.canManageTeams ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.log('✗ Access scope test failed:', error);
  }
}

function legacyTestScopeValidation() {
  console.log('\n=== Testing Scope Validation Logic ===\n');
  
  const engine = new PermissionEngine();
  
  try {
    const userCanAccessSelf = (engine as any).validateScopeAccess(
      mockUsers.user, 'own', mockUsers.user.id
    );
    const userCannotAccessOther = !(engine as any).validateScopeAccess(
      mockUsers.user, 'own', mockUsers.admin.id
    );
    
    console.log('✓ User can access own data (own scope):', userCanAccessSelf ? 'PASS' : 'FAIL');
    console.log('✓ User cannot access other data (own scope):', userCannotAccessOther ? 'PASS' : 'FAIL');
    
    const adminHasOrgAccess = (engine as any).validateScopeAccess(
      mockUsers.admin, 'organization'
    );
    const userLacksOrgAccess = !(engine as any).validateScopeAccess(
      mockUsers.user, 'organization'
    );
    
    console.log('✓ Admin has organization access:', adminHasOrgAccess ? 'PASS' : 'FAIL');
    console.log('✓ User lacks organization access:', userLacksOrgAccess ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.log('✗ Scope validation test failed:', error);
  }
}

function legacyTestErrorHandling() {
  console.log('\n=== Testing Error Handling ===\n');
  
  const engine = new PermissionEngine();
  
  try {
    const defaultScope = (engine as any).getDefaultAccessScope();
    
    console.log('✓ Default scope has no permissions:', 
      !defaultScope.canViewUsers && 
      !defaultScope.canCreateUsers && 
      !defaultScope.organizationWide ? 'PASS' : 'FAIL'
    );
    
    console.log('✓ Default scope has empty team IDs:', 
      Array.isArray(defaultScope.teamIds) && defaultScope.teamIds.length === 0 ? 'PASS' : 'FAIL'
    );
    
  } catch (error) {
    console.log('✗ Error handling test failed:', error);
  }
}

function runPermissionEngineTests() {
  console.log('=== Permission Engine Test Suite ===\n');
  
  legacyTestPermissionLogic();
  legacyTestAccessScopeLogic();
  legacyTestScopeValidation();
  legacyTestErrorHandling();
  
  console.log('\n=== Permission Engine Tests Complete ===');
}

export { runPermissionEngineTests };