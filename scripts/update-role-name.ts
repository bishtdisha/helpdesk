import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRoleName() {
  try {
    console.log('🔄 Updating role name from "User/Employee" to "Employee"...\n');

    // Check if User/Employee role exists
    const oldRole = await prisma.role.findUnique({
      where: { name: 'User/Employee' },
    });

    if (!oldRole) {
      console.log('❌ User/Employee role not found!');
      return;
    }

    console.log('✅ Found role:', oldRole.name);
    console.log('   ID:', oldRole.id);
    console.log('   Description:', oldRole.description);

    // Check if Employee role already exists
    const existingEmployee = await prisma.role.findUnique({
      where: { name: 'Employee' },
    });

    if (existingEmployee) {
      console.log('\n⚠️  "Employee" role already exists!');
      console.log('   Deleting old "User/Employee" role and keeping "Employee"...');
      
      // Update all users with User/Employee to Employee
      const updateResult = await prisma.user.updateMany({
        where: { roleId: oldRole.id },
        data: { roleId: existingEmployee.id },
      });

      console.log(`   Updated ${updateResult.count} users to Employee role`);

      // Delete old role
      await prisma.role.delete({
        where: { id: oldRole.id },
      });

      console.log('   Deleted old "User/Employee" role');
    } else {
      // Update the role name
      const updatedRole = await prisma.role.update({
        where: { id: oldRole.id },
        data: {
          name: 'Employee',
          description: 'Standard employee with limited access',
        },
      });

      console.log('\n✅ Role updated successfully!');
      console.log('   New name:', updatedRole.name);
      console.log('   Description:', updatedRole.description);
    }

    // Count users with this role
    const userCount = await prisma.user.count({
      where: { 
        role: { name: 'Employee' }
      },
    });

    console.log(`\n📊 Total users with Employee role: ${userCount}`);

    // Show all roles
    const allRoles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    console.log('\n📋 All Roles:');
    allRoles.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.name}`);
    });

    console.log('\n✅ Update complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoleName();
