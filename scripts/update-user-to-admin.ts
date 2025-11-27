import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserToAdmin() {
  try {
    // Get Admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin/Manager' }
    });

    if (!adminRole) {
      console.log('❌ Admin/Manager role not found');
      return;
    }

    // Update Disha to Admin role
    const updated = await prisma.user.update({
      where: { email: 'disha.bisht@cimconautomation.com' },
      data: {
        roleId: adminRole.id
      },
      include: {
        role: true,
        team: true,
        teamLeaderships: {
          include: {
            team: true
          }
        }
      }
    });

    console.log('\n✅ User updated successfully!');
    console.log('\n📊 Updated User Data:');
    console.log('Name:', updated.name);
    console.log('Email:', updated.email);
    console.log('Role:', updated.role?.name);
    console.log('Team:', updated.team?.name || 'No team');
    console.log('Team Leaderships:', updated.teamLeaderships.map(tl => tl.team.name).join(', ') || 'None');

    console.log('\n✅ Disha is now Admin/Manager AND Team Leader of Development Team');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserToAdmin();
