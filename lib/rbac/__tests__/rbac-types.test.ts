import {
  ROLE_TYPES,
  ROLE_PERMISSIONS,
  ROLE_ACCESS_SCOPES,
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
  getPermissionsForRole,
  getAccessScopeForRole,
  hasPermission,
  canAccessUser,
  canAccessTeam,
  validateRoleType,
  validatePermissionMatrix,
  initializeRBAC,
} from '../index';

// Test role types
function testRoleTypes() {
  console.log('Testing role types...');
  
  const adminRole = ROLE_TYPES.ADMIN_MANAGER;
  const teamLeaderRole = ROLE_TYPES.TEAM_LEADER;
  const userRole = ROLE_TYPES.USER_EMPLOYEE;
  
  console.log('Admin role:', adminRole === 'Admin/Manager' ? 'PASS' : 'FAIL');
  console.log('Team Leader role:', teamLeaderRole === 'Team Leader' ? 'PASS' : 'FAIL');
  console.log('User role:', userRole === 'User/Employee' ? 'PASS' : 'FAIL');
  
  // Test role validation
  try {
    validateRoleType('Admin/Manager');
    validateRoleType('Team Leader');
    validateRoleType('User/Employee');
    console.log('Valid role validation: PASS');
  } catch (error) {
    console.log('Valid role validation: FAIL -', error);
  }
  
  try {
    validateRoleType('Invalid Role');
    console.log('Invalid role validation: FAIL - should have thrown error');
  } catch (error) {
    console.log('Invalid role validation: PASS - correctly threw error');
  }
}

// Test permission matrix
function testPermissionMatrix() {
  console.log('\nTesting permission matrix...');
  
  const adminPerms = ROLE_PERMISSIONS[ROLE_TYPES.ADMIN_MANAGER];
  const teamLeaderPerms = ROLE_PERMISSIONS[ROLE_TYPES.TEAM_LEADER];
  const userPerms = ROLE_PERMISSIONS[ROLE_TYPES.USER_EMPLOYEE];
  
  console.log('Admin permissions defined:', adminPerms ? 'PASS' : 'FAIL');
  console.log('Team Leader permissions defined:', teamLeaderPerms ? 'PASS' : 'FAIL');
  console.log('User permissions defined:', userPerms ? 'PASS' : 'FAIL');
  
  const adminScope = ROLE_ACCESS_SCOPES[ROLE_TYPES.ADMIN_MANAGER];
  const teamLeaderScope = ROLE_ACCESS_SCOPES[ROLE_TYPES.TEAM_LEADER];
  const userScope = ROLE_ACCESS_SCOPES[ROLE_TYPES.USER_EMPLOYEE];
  
  console.log('Admin access scope defined:', adminScope ? 'PASS' : 'FAIL');
  console.log('Team Leader access scope defined:', teamLeaderScope ? 'PASS' : 'FAIL');
  console.log('User access scope defined:', userScope ? 'PASS' : 'FAIL');
  
  try {
    validatePermissionMatrix();
    console.log('Permission matrix validation: PASS');
  } catch (error) {
    console.log('Permission matrix validation: FAIL -', error);
  }
}

// Test permission checking
function testPermissionChecking() {
  console.log('\nTesting permission checking...');
  
  // Test Admin permissions
  const adminPermissions = getPermissionsForRole(ROLE_TYPES.ADMIN_MANAGER);
  const canCreateUsers = hasPermission(adminPermissions, PERMISSION_ACTIONS.CREATE, RESOURCE_TYPES.USERS);
  const canDeleteUsers = hasPermission(adminPermissions, PERMISSION_ACTIONS.DELETE, RESOURCE_TYPES.USERS);
  const canManageTeams = hasPermission(adminPermissions, PERMISSION_ACTIONS.MANAGE, RESOURCE_TYPES.TEAMS);
  
  console.log('Admin can create users:', canCreateUsers ? 'PASS' : 'FAIL');
  console.log('Admin can delete users:', canDeleteUsers ? 'PASS' : 'FAIL');
  console.log('Admin can manage teams:', canManageTeams ? 'PASS' : 'FAIL');
  
  // Test Team Leader permissions
  const teamLeaderPermissions = getPermissionsForRole(ROLE_TYPES.TEAM_LEADER);
  const canReadUsers = hasPermission(teamLeaderPermissions, PERMISSION_ACTIONS.READ, RESOURCE_TYPES.USERS);
  const cannotCreateUsers = !hasPermission(teamLeaderPermissions, PERMISSION_ACTIONS.CREATE, RESOURCE_TYPES.USERS);
  const cannotDeleteUsers = !hasPermission(teamLeaderPermissions, PERMISSION_ACTIONS.DELETE, RESOURCE_TYPES.USERS);
  
  console.log('Team Leader can read users:', canReadUsers ? 'PASS' : 'FAIL');
  console.log('Team Leader cannot create users:', cannotCreateUsers ? 'PASS' : 'FAIL');
  console.log('Team Leader cannot delete users:', cannotDeleteUsers ? 'PASS' : 'FAIL');
  
  // Test User permissions
  const userPermissions = getPermissionsForRole(ROLE_TYPES.USER_EMPLOYEE);
  const canReadOwnProfile = hasPermission(userPermissions, PERMISSION_ACTIONS.READ, RESOURCE_TYPES.USERS);
  const cannotCreateUsersAsUser = !hasPermission(userPermissions, PERMISSION_ACTIONS.CREATE, RESOURCE_TYPES.USERS);
  
  console.log('User can read own profile:', canReadOwnProfile ? 'PASS' : 'FAIL');
  console.log('User cannot create users:', cannotCreateUsersAsUser ? 'PASS' : 'FAIL');
}

// Test access control
function testAccessControl() {
  console.log('\nTesting access control...');
  
  // Test user access
  const adminCanAccessAnyUser = canAccessUser(ROLE_TYPES.ADMIN_MANAGER, [], 'team1', 'user1', 'admin1');
  const teamLeaderCanAccessTeamUser = canAccessUser(ROLE_TYPES.TEAM_LEADER, ['team1'], 'team1', 'user1', 'leader1');
  const teamLeaderCannotAccessOtherTeamUser = !canAccessUser(ROLE_TYPES.TEAM_LEADER, ['team1'], 'team2', 'user1', 'leader1');
  const userCanAccessSelf = canAccessUser(ROLE_TYPES.USER_EMPLOYEE, ['team1'], 'team1', 'user1', 'user1');
  const userCannotAccessOther = !canAccessUser(ROLE_TYPES.USER_EMPLOYEE, ['team1'], 'team1', 'user2', 'user1');
  
  console.log('Admin can access any user:', adminCanAccessAnyUser ? 'PASS' : 'FAIL');
  console.log('Team Leader can access team user:', teamLeaderCanAccessTeamUser ? 'PASS' : 'FAIL');
  console.log('Team Leader cannot access other team user:', teamLeaderCannotAccessOtherTeamUser ? 'PASS' : 'FAIL');
  console.log('User can access self:', userCanAccessSelf ? 'PASS' : 'FAIL');
  console.log('User cannot access other:', userCannotAccessOther ? 'PASS' : 'FAIL');
  
  // Test team access
  const adminCanAccessAnyTeam = canAccessTeam(ROLE_TYPES.ADMIN_MANAGER, [], 'team1');
  const teamLeaderCanAccessOwnTeam = canAccessTeam(ROLE_TYPES.TEAM_LEADER, ['team1'], 'team1');
  const teamLeaderCannotAccessOtherTeam = !canAccessTeam(ROLE_TYPES.TEAM_LEADER, ['team1'], 'team2');
  const userCanAccessOwnTeam = canAccessTeam(ROLE_TYPES.USER_EMPLOYEE, ['team1'], 'team1');
  const userCannotAccessOtherTeam = !canAccessTeam(ROLE_TYPES.USER_EMPLOYEE, ['team1'], 'team2');
  
  console.log('Admin can access any team:', adminCanAccessAnyTeam ? 'PASS' : 'FAIL');
  console.log('Team Leader can access own team:', teamLeaderCanAccessOwnTeam ? 'PASS' : 'FAIL');
  console.log('Team Leader cannot access other team:', teamLeaderCannotAccessOtherTeam ? 'PASS' : 'FAIL');
  console.log('User can access own team:', userCanAccessOwnTeam ? 'PASS' : 'FAIL');
  console.log('User cannot access other team:', userCannotAccessOtherTeam ? 'PASS' : 'FAIL');
}

// Test access scopes
function testAccessScopes() {
  console.log('\nTesting access scopes...');
  
  const adminScope = getAccessScopeForRole(ROLE_TYPES.ADMIN_MANAGER);
  console.log('Admin can view users:', adminScope.canViewUsers ? 'PASS' : 'FAIL');
  console.log('Admin can edit users:', adminScope.canEditUsers ? 'PASS' : 'FAIL');
  console.log('Admin can create users:', adminScope.canCreateUsers ? 'PASS' : 'FAIL');
  console.log('Admin can delete users:', adminScope.canDeleteUsers ? 'PASS' : 'FAIL');
  console.log('Admin can manage roles:', adminScope.canManageRoles ? 'PASS' : 'FAIL');
  console.log('Admin can manage teams:', adminScope.canManageTeams ? 'PASS' : 'FAIL');
  console.log('Admin has organization-wide access:', adminScope.organizationWide ? 'PASS' : 'FAIL');
  
  const teamLeaderScope = getAccessScopeForRole(ROLE_TYPES.TEAM_LEADER);
  console.log('Team Leader can view users:', teamLeaderScope.canViewUsers ? 'PASS' : 'FAIL');
  console.log('Team Leader can edit users:', teamLeaderScope.canEditUsers ? 'PASS' : 'FAIL');
  console.log('Team Leader cannot create users:', !teamLeaderScope.canCreateUsers ? 'PASS' : 'FAIL');
  console.log('Team Leader cannot delete users:', !teamLeaderScope.canDeleteUsers ? 'PASS' : 'FAIL');
  console.log('Team Leader cannot manage roles:', !teamLeaderScope.canManageRoles ? 'PASS' : 'FAIL');
  console.log('Team Leader cannot manage teams:', !teamLeaderScope.canManageTeams ? 'PASS' : 'FAIL');
  console.log('Team Leader has limited access:', !teamLeaderScope.organizationWide ? 'PASS' : 'FAIL');
  
  const userScope = getAccessScopeForRole(ROLE_TYPES.USER_EMPLOYEE);
  console.log('User cannot view users:', !userScope.canViewUsers ? 'PASS' : 'FAIL');
  console.log('User cannot edit users:', !userScope.canEditUsers ? 'PASS' : 'FAIL');
  console.log('User cannot create users:', !userScope.canCreateUsers ? 'PASS' : 'FAIL');
  console.log('User cannot delete users:', !userScope.canDeleteUsers ? 'PASS' : 'FAIL');
  console.log('User cannot manage roles:', !userScope.canManageRoles ? 'PASS' : 'FAIL');
  console.log('User cannot manage teams:', !userScope.canManageTeams ? 'PASS' : 'FAIL');
  console.log('User has limited access:', !userScope.organizationWide ? 'PASS' : 'FAIL');
}

describe('RBAC Types and Permissions', () => {
  beforeAll(() => {
    try {
      initializeRBAC();
    } catch (error) {
      console.log('RBAC initialization failed:', error);
    }
  });

  test('should have valid role types', () => {
    expect(ROLE_TYPES.ADMIN_MANAGER).toBe('Admin/Manager');
    expect(ROLE_TYPES.TEAM_LEADER).toBe('Team Leader');
    expect(ROLE_TYPES.USER_EMPLOYEE).toBe('User/Employee');
  });

  test('should validate role types correctly', () => {
    expect(() => validateRoleType('Admin/Manager')).not.toThrow();
    expect(() => validateRoleType('Team Leader')).not.toThrow();
    expect(() => validateRoleType('User/Employee')).not.toThrow();
    expect(() => validateRoleType('Invalid Role')).toThrow();
  });

  test('should have permission matrix defined', () => {
    expect(ROLE_PERMISSIONS[ROLE_TYPES.ADMIN_MANAGER]).toBeDefined();
    expect(ROLE_PERMISSIONS[ROLE_TYPES.TEAM_LEADER]).toBeDefined();
    expect(ROLE_PERMISSIONS[ROLE_TYPES.USER_EMPLOYEE]).toBeDefined();
  });

  test('should validate permission matrix', () => {
    expect(() => validatePermissionMatrix()).not.toThrow();
  });

  test('should check admin permissions correctly', () => {
    const adminPermissions = getPermissionsForRole(ROLE_TYPES.ADMIN_MANAGER);
    const canCreateUsers = hasPermission(adminPermissions, PERMISSION_ACTIONS.CREATE, RESOURCE_TYPES.USERS);
    const canDeleteUsers = hasPermission(adminPermissions, PERMISSION_ACTIONS.DELETE, RESOURCE_TYPES.USERS);
    
    expect(canCreateUsers).toBe(true);
    expect(canDeleteUsers).toBe(true);
  });

  test('should check team leader permissions correctly', () => {
    const teamLeaderPermissions = getPermissionsForRole(ROLE_TYPES.TEAM_LEADER);
    const canReadUsers = hasPermission(teamLeaderPermissions, PERMISSION_ACTIONS.READ, RESOURCE_TYPES.USERS);
    const cannotCreateUsers = !hasPermission(teamLeaderPermissions, PERMISSION_ACTIONS.CREATE, RESOURCE_TYPES.USERS);
    
    expect(canReadUsers).toBe(true);
    expect(cannotCreateUsers).toBe(true);
  });

  test('should validate access control correctly', () => {
    const adminCanAccessAnyUser = canAccessUser(ROLE_TYPES.ADMIN_MANAGER, [], 'team1', 'user1', 'admin1');
    const userCanAccessSelf = canAccessUser(ROLE_TYPES.USER_EMPLOYEE, ['team1'], 'team1', 'user1', 'user1');
    const userCannotAccessOther = !canAccessUser(ROLE_TYPES.USER_EMPLOYEE, ['team1'], 'team1', 'user2', 'user1');
    
    expect(adminCanAccessAnyUser).toBe(true);
    expect(userCanAccessSelf).toBe(true);
    expect(userCannotAccessOther).toBe(true);
  });

  test('should have correct access scopes', () => {
    const adminScope = getAccessScopeForRole(ROLE_TYPES.ADMIN_MANAGER);
    const userScope = getAccessScopeForRole(ROLE_TYPES.USER_EMPLOYEE);
    
    expect(adminScope.organizationWide).toBe(true);
    expect(adminScope.canCreateUsers).toBe(true);
    expect(userScope.organizationWide).toBe(false);
    expect(userScope.canCreateUsers).toBe(false);
  });
});

// Run all tests
async function runTests() {
  console.log('=== RBAC Types and Permissions Test ===\n');
  
  // Initialize RBAC system
  try {
    initializeRBAC();
    console.log('RBAC system initialized successfully\n');
  } catch (error) {
    console.log('RBAC initialization failed:', error);
    return;
  }
  
  testRoleTypes();
  testPermissionMatrix();
  testPermissionChecking();
  testAccessControl();
  testAccessScopes();
  
  console.log('\n=== Tests Complete ===');
}

// Export for potential use
export { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}