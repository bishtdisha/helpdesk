/**
 * Database Cleanup Script
 * 
 * This script removes all data from the database except the admin user (Disha Bisht).
 * 
 * Usage:
 *   npx tsx scripts/cleanup-database.ts
 * 
 * What it does:
 * 1. Finds and preserves the admin user (Disha Bisht)
 * 2. Deletes all data from all tables
 * 3. Keeps only the admin user
 * 4. Resets the database to a clean state
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Step 1: Find the admin user
    console.log('📋 Step 1: Finding admin user...');
    
    // Try to find admin user by different criteria
    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: 'Disha Bisht' },
          { email: { contains: 'disha', mode: 'insensitive' } },
          { role: { name: { contains: 'Admin', mode: 'insensitive' } } },
        ],
      },
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'asc', // Get the oldest user (likely the first admin)
      },
    });

    // If still not found, get the first user
    if (!adminUser) {
      console.log('⚠️  No specific admin user found, checking for any user...');
      adminUser = await prisma.user.findFirst({
        include: {
          role: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    if (!adminUser) {
      console.error('❌ Error: No users found in database!');
      console.log('   The database appears to be empty.');
      console.log('   Please create at least one admin user first.');
      console.log('\n💡 Tip: Run "npm run db:seed" to create sample data including an admin user.');
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})`);
    console.log(`   User ID: ${adminUser.id}`);
    console.log(`   Role: ${adminUser.role?.name || 'No role'}`);
    console.log(`   Role ID: ${adminUser.roleId || 'null'}\n`);

    const adminUserId = adminUser.id;
    const adminRoleId = adminUser.roleId;

    // Step 2: Delete data in correct order (respecting foreign key constraints)
    console.log('🗑️  Step 2: Deleting all data (except admin user)...\n');

    // Delete notification preferences
    console.log('   Deleting notification preferences...');
    const deletedNotifPrefs = await prisma.notificationPreferences.deleteMany({
      where: {
        userId: { not: adminUserId },
      },
    });
    console.log(`   ✓ Deleted ${deletedNotifPrefs.count} notification preferences`);

    // Delete notifications
    console.log('   Deleting notifications...');
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        userId: { not: adminUserId },
      },
    });
    console.log(`   ✓ Deleted ${deletedNotifications.count} notifications`);

    // Delete ticket templates
    console.log('   Deleting ticket templates...');
    const deletedTemplates = await prisma.ticketTemplate.deleteMany({
      where: {
        createdBy: { not: adminUserId },
      },
    });
    console.log(`   ✓ Deleted ${deletedTemplates.count} ticket templates`);

    // Delete ticket feedback
    console.log('   Deleting ticket feedback...');
    const deletedFeedback = await prisma.ticketFeedback.deleteMany();
    console.log(`   ✓ Deleted ${deletedFeedback.count} ticket feedback entries`);

    // Delete ticket history
    console.log('   Deleting ticket history...');
    const deletedHistory = await prisma.ticketHistory.deleteMany();
    console.log(`   ✓ Deleted ${deletedHistory.count} ticket history entries`);

    // Delete ticket attachments
    console.log('   Deleting ticket attachments...');
    const deletedAttachments = await prisma.ticketAttachment.deleteMany();
    console.log(`   ✓ Deleted ${deletedAttachments.count} ticket attachments`);

    // Delete ticket followers
    console.log('   Deleting ticket followers...');
    const deletedFollowers = await prisma.ticketFollower.deleteMany();
    console.log(`   ✓ Deleted ${deletedFollowers.count} ticket followers`);

    // Delete ticket tags
    console.log('   Deleting ticket tags...');
    const deletedTicketTags = await prisma.ticketTag.deleteMany();
    console.log(`   ✓ Deleted ${deletedTicketTags.count} ticket tags`);

    // Delete comments
    console.log('   Deleting comments...');
    const deletedComments = await prisma.comment.deleteMany();
    console.log(`   ✓ Deleted ${deletedComments.count} comments`);

    // Delete tickets
    console.log('   Deleting tickets...');
    const deletedTickets = await prisma.ticket.deleteMany();
    console.log(`   ✓ Deleted ${deletedTickets.count} tickets`);

    // Delete tags
    console.log('   Deleting tags...');
    const deletedTags = await prisma.tag.deleteMany();
    console.log(`   ✓ Deleted ${deletedTags.count} tags`);

    // Delete customers
    console.log('   Deleting customers...');
    const deletedCustomers = await prisma.customer.deleteMany();
    console.log(`   ✓ Deleted ${deletedCustomers.count} customers`);

    // Delete KB article categories
    console.log('   Deleting KB article categories...');
    const deletedKBArticleCategories = await prisma.kBArticleCategory.deleteMany();
    console.log(`   ✓ Deleted ${deletedKBArticleCategories.count} KB article categories`);

    // Delete KB articles
    console.log('   Deleting KB articles...');
    const deletedKBArticles = await prisma.knowledgeBaseArticle.deleteMany();
    console.log(`   ✓ Deleted ${deletedKBArticles.count} KB articles`);

    // Delete KB categories
    console.log('   Deleting KB categories...');
    const deletedKBCategories = await prisma.kBCategory.deleteMany();
    console.log(`   ✓ Deleted ${deletedKBCategories.count} KB categories`);

    // Delete escalation rules
    console.log('   Deleting escalation rules...');
    const deletedEscalationRules = await prisma.escalationRule.deleteMany();
    console.log(`   ✓ Deleted ${deletedEscalationRules.count} escalation rules`);

    // Delete SLA policies
    console.log('   Deleting SLA policies...');
    const deletedSLAPolicies = await prisma.sLAPolicy.deleteMany();
    console.log(`   ✓ Deleted ${deletedSLAPolicies.count} SLA policies`);

    // Delete team leaders
    console.log('   Deleting team leaders...');
    const deletedTeamLeaders = await prisma.teamLeader.deleteMany();
    console.log(`   ✓ Deleted ${deletedTeamLeaders.count} team leaders`);

    // Delete user sessions (except admin)
    console.log('   Deleting user sessions...');
    const deletedSessions = await prisma.userSession.deleteMany({
      where: {
        userId: { not: adminUserId },
      },
    });
    console.log(`   ✓ Deleted ${deletedSessions.count} user sessions`);

    // Delete audit logs (except admin's)
    console.log('   Deleting audit logs...');
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { userId: { not: adminUserId } },
          { userId: null },
        ],
      },
    });
    console.log(`   ✓ Deleted ${deletedAuditLogs.count} audit logs`);

    // Delete user roles (except admin's)
    console.log('   Deleting user roles...');
    const deletedUserRoles = await prisma.userRole.deleteMany({
      where: {
        userId: { not: adminUserId },
      },
    });
    console.log(`   ✓ Deleted ${deletedUserRoles.count} user roles`);

    // Delete users (except admin)
    console.log('   Deleting users (except admin)...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { not: adminUserId },
      },
    });
    console.log(`   ✓ Deleted ${deletedUsers.count} users`);

    // Delete teams
    console.log('   Deleting teams...');
    const deletedTeams = await prisma.team.deleteMany();
    console.log(`   ✓ Deleted ${deletedTeams.count} teams`);

    // Delete role permissions (except admin role's)
    console.log('   Deleting role permissions...');
    const deletedRolePermissions = await prisma.rolePermission.deleteMany({
      where: {
        roleId: { not: adminRoleId || '' },
      },
    });
    console.log(`   ✓ Deleted ${deletedRolePermissions.count} role permissions`);

    // Delete roles (except admin role)
    console.log('   Deleting roles (except admin role)...');
    const deletedRoles = await prisma.role.deleteMany({
      where: {
        id: { not: adminRoleId || '' },
      },
    });
    console.log(`   ✓ Deleted ${deletedRoles.count} roles`);

    // Delete permissions (except those used by admin role)
    console.log('   Deleting unused permissions...');
    const deletedPermissions = await prisma.permission.deleteMany({
      where: {
        rolePermissions: {
          none: {
            roleId: adminRoleId || '',
          },
        },
      },
    });
    console.log(`   ✓ Deleted ${deletedPermissions.count} permissions`);

    // Delete settings
    console.log('   Deleting settings...');
    const deletedSettings = await prisma.setting.deleteMany();
    console.log(`   ✓ Deleted ${deletedSettings.count} settings`);

    // Step 3: Update admin user to ensure clean state
    console.log('\n🔧 Step 3: Ensuring admin user is in clean state...');
    await prisma.user.update({
      where: { id: adminUserId },
      data: {
        teamId: null, // Remove team assignment since all teams are deleted
        isActive: true,
      },
    });
    console.log('   ✓ Admin user updated (teamId set to null)');

    // Step 4: Verify final state
    console.log('\n📊 Step 4: Verifying database state...\n');

    const finalCounts = {
      users: await prisma.user.count(),
      roles: await prisma.role.count(),
      teams: await prisma.team.count(),
      tickets: await prisma.ticket.count(),
      customers: await prisma.customer.count(),
      comments: await prisma.comment.count(),
      notifications: await prisma.notification.count(),
      kbArticles: await prisma.knowledgeBaseArticle.count(),
    };

    console.log('   Final database state:');
    console.log(`   - Users: ${finalCounts.users} (should be 1 - admin only)`);
    console.log(`   - Roles: ${finalCounts.roles} (admin role only)`);
    console.log(`   - Teams: ${finalCounts.teams} (should be 0)`);
    console.log(`   - Tickets: ${finalCounts.tickets} (should be 0)`);
    console.log(`   - Customers: ${finalCounts.customers} (should be 0)`);
    console.log(`   - Comments: ${finalCounts.comments} (should be 0)`);
    console.log(`   - Notifications: ${finalCounts.notifications} (should be 0)`);
    console.log(`   - KB Articles: ${finalCounts.kbArticles} (should be 0)`);

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Preserved admin user: ${adminUser.name} (${adminUser.email})`);
    console.log(`   - Preserved admin role: ${adminUser.role?.name || 'N/A'}`);
    console.log('   - All other data has been deleted');
    console.log('   - Database is ready for fresh data\n');

  } catch (error) {
    console.error('\n❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => {
    console.log('🎉 Cleanup script finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });
