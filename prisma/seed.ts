import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create roles first
  console.log('📝 Creating roles...');
  
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin/Manager' },
    update: {},
    create: {
      name: 'Admin/Manager',
      description: 'Full system administrator with complete access to all features and user management',
      permissions: {
        users: ['create', 'read', 'update', 'delete', 'assign'],
        teams: ['create', 'read', 'update', 'delete', 'manage'],
        roles: ['create', 'read', 'update', 'delete', 'assign'],
        tickets: ['create', 'read', 'update', 'delete', 'assign'],
        analytics: ['read'],
        audit_logs: ['read'],
        knowledge_base: ['create', 'read', 'update', 'delete']
      }
    }
  });

  const teamLeaderRole = await prisma.role.upsert({
    where: { name: 'Team Leader' },
    update: {},
    create: {
      name: 'Team Leader',
      description: 'Team leader with access to manage team members and team-specific resources',
      permissions: {
        users: ['read', 'update'], // Team scope only
        teams: ['read'], // Team scope only
        tickets: ['create', 'read', 'update', 'assign'], // Team scope
        analytics: ['read'], // Team scope
        knowledge_base: ['create', 'read', 'update']
      }
    }
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'User/Employee' },
    update: {},
    create: {
      name: 'User/Employee',
      description: 'Regular user with access to own profile and assigned tickets',
      permissions: {
        users: ['read', 'update'], // Own scope only
        teams: ['read'], // Own team only
        tickets: ['create', 'read', 'update'], // Own tickets only
        knowledge_base: ['read']
      }
    }
  });

  console.log('✅ Roles created successfully');

  // Create default team
  console.log('🏢 Creating default team...');
  
  const defaultTeam = await prisma.team.upsert({
    where: { name: 'Administration' },
    update: {},
    create: {
      name: 'Administration',
      description: 'Default administrative team for system administrators'
    }
  });

  console.log('✅ Default team created successfully');

  // Hash the password
  console.log('🔐 Hashing password...');
  const hashedPassword = await bcrypt.hash('cimcon@123', 12);

  // Create admin user
  console.log('👤 Creating admin user...');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'disha.bisht@cimconautomation.com' },
    update: {
      name: 'Disha Bisht',
      roleId: adminRole.id,
      teamId: defaultTeam.id,
      isActive: true
    },
    create: {
      email: 'disha.bisht@cimconautomation.com',
      name: 'Disha Bisht',
      password: hashedPassword,
      roleId: adminRole.id,
      teamId: defaultTeam.id,
      isActive: true
    }
  });

  console.log('✅ Admin user created successfully');

  // Create some sample permissions for reference
  console.log('🔑 Creating permission definitions...');
  
  const permissions = [
    { resource: 'users', action: 'create', description: 'Create new users' },
    { resource: 'users', action: 'read', description: 'View user information' },
    { resource: 'users', action: 'update', description: 'Update user information' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'users', action: 'assign', description: 'Assign roles to users' },
    
    { resource: 'teams', action: 'create', description: 'Create new teams' },
    { resource: 'teams', action: 'read', description: 'View team information' },
    { resource: 'teams', action: 'update', description: 'Update team information' },
    { resource: 'teams', action: 'delete', description: 'Delete teams' },
    { resource: 'teams', action: 'manage', description: 'Manage team assignments' },
    
    { resource: 'roles', action: 'create', description: 'Create new roles' },
    { resource: 'roles', action: 'read', description: 'View role information' },
    { resource: 'roles', action: 'update', description: 'Update role information' },
    { resource: 'roles', action: 'delete', description: 'Delete roles' },
    { resource: 'roles', action: 'assign', description: 'Assign roles to users' },
    
    { resource: 'tickets', action: 'create', description: 'Create new tickets' },
    { resource: 'tickets', action: 'read', description: 'View tickets' },
    { resource: 'tickets', action: 'update', description: 'Update tickets' },
    { resource: 'tickets', action: 'delete', description: 'Delete tickets' },
    { resource: 'tickets', action: 'assign', description: 'Assign tickets to users' },
    
    { resource: 'analytics', action: 'read', description: 'View analytics and reports' },
    { resource: 'audit_logs', action: 'read', description: 'View audit logs' },
    { resource: 'knowledge_base', action: 'create', description: 'Create knowledge base articles' },
    { resource: 'knowledge_base', action: 'read', description: 'Read knowledge base articles' },
    { resource: 'knowledge_base', action: 'update', description: 'Update knowledge base articles' },
    { resource: 'knowledge_base', action: 'delete', description: 'Delete knowledge base articles' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action
        }
      },
      update: {},
      create: perm
    });
  }

  console.log('✅ Permissions created successfully');

  // Create role-permission associations for Admin
  console.log('🔗 Creating role-permission associations...');
  
  const adminPermissions = await prisma.permission.findMany();
  
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id
      }
    });
  }

  console.log('✅ Role-permission associations created successfully');

  // Log summary
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`👤 Admin User: ${adminUser.email}`);
  console.log(`🔑 Password: cimcon@123`);
  console.log(`👑 Role: ${adminRole.name}`);
  console.log(`🏢 Team: ${defaultTeam.name}`);
  console.log('\n🚀 You can now log in with the admin credentials!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });