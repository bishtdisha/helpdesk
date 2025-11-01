import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDishaRole() {
  try {
    console.log('🔍 Checking Disha Bisht\'s current role...');
    
    // Find Disha's user record
    const disha = await prisma.user.findUnique({
      where: { email: 'disha.bisht@cimconautomation.com' },
      include: { role: true, team: true }
    });

    if (!disha) {
      console.log('❌ Disha Bisht not found in database!');
      return;
    }

    console.log('👤 Current user data:');
    console.log(`   Name: ${disha.name}`);
    console.log(`   Email: ${disha.email}`);
    console.log(`   Current Role: ${disha.role?.name || 'No Role'}`);
    console.log(`   Team: ${disha.team?.name || 'No Team'}`);

    // Find the Admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin/Manager' }
    });

    if (!adminRole) {
      console.log('❌ Admin/Manager role not found! Creating it...');
      
      const newAdminRole = await prisma.role.create({
        data: {
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
      
      console.log('✅ Created Admin/Manager role');
      
      // Update Disha's role
      await prisma.user.update({
        where: { id: disha.id },
        data: { roleId: newAdminRole.id }
      });
      
      console.log('✅ Assigned Admin/Manager role to Disha Bisht');
    } else {
      console.log('✅ Admin/Manager role found');
      
      // Update Disha's role
      await prisma.user.update({
        where: { id: disha.id },
        data: { roleId: adminRole.id }
      });
      
      console.log('✅ Assigned Admin/Manager role to Disha Bisht');
    }

    // Verify the update
    const updatedDisha = await prisma.user.findUnique({
      where: { email: 'disha.bisht@cimconautomation.com' },
      include: { role: true, team: true }
    });

    console.log('\n🎉 Updated user data:');
    console.log(`   Name: ${updatedDisha?.name}`);
    console.log(`   Email: ${updatedDisha?.email}`);
    console.log(`   Role: ${updatedDisha?.role?.name || 'No Role'}`);
    console.log(`   Team: ${updatedDisha?.team?.name || 'No Team'}`);
    
    console.log('\n✅ Disha Bisht is now properly configured as Admin!');
    console.log('🔄 Please refresh your browser to see the changes.');
    
  } catch (error) {
    console.error('❌ Error fixing Disha\'s role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDishaRole();