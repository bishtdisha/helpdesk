import { PrismaClient } from '@prisma/client';
import { permissionEngine } from '../lib/rbac/permission-engine';

const prisma = new PrismaClient();

async function testPermissions() {
  try {
    // Get Disha's user
    const disha = await prisma.user.findUnique({
      where: { email: 'disha.bisht@cimconautomation.com' },
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

    if (!disha) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📊 User Info:');
    console.log('Name:', disha.name);
    console.log('Role:', disha.role?.name);
    console.log('Team:', disha.team?.name);

    // Get user permissions
    const permissions = await permissionEngine.getUserPermissions(disha.id);

    console.log('\n🔐 Permissions:');
    console.log('Organization Wide:', permissions.accessScope.organizationWide);
    console.log('Can View Users:', permissions.accessScope.canViewUsers);
    console.log('Can Manage Teams:', permissions.accessScope.canManageTeams);
    console.log('Team IDs:', permissions.accessScope.teamIds);

    // Test team access
    const canReadTeams = await permissionEngine.checkPermission(
      disha.id,
      'read',
      'teams'
    );

    console.log('\n✅ Can Read Teams:', canReadTeams);

    // Get all teams count
    const allTeamsCount = await prisma.team.count();
    console.log('\n📊 Total Teams in Database:', allTeamsCount);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissions();
