import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...\n');

  // Create Roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin/Manager' },
    update: {},
    create: {
      name: 'Admin/Manager',
      description: 'Full system access with all permissions',
      permissions: {
        tickets: ['read', 'write', 'delete', 'assign', 'manage'],
        users: ['read', 'write', 'delete', 'manage'],
        teams: ['read', 'write', 'delete', 'manage'],
        analytics: ['read', 'export', 'comparative'],
        knowledge_base: ['read', 'write', 'delete', 'manage'],
        settings: ['read', 'write', 'manage'],
      },
    },
  });

  const teamLeaderRole = await prisma.role.upsert({
    where: { name: 'Team Leader' },
    update: {},
    create: {
      name: 'Team Leader',
      description: 'Team management and ticket assignment',
      permissions: {
        tickets: ['read', 'write', 'assign'],
        users: ['read'],
        teams: ['read'],
        analytics: ['read', 'export'],
        knowledge_base: ['read', 'write'],
      },
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'User/Employee' },
    update: {},
    create: {
      name: 'User/Employee',
      description: 'Basic user with limited access',
      permissions: {
        tickets: ['read', 'write'],
        knowledge_base: ['read'],
      },
    },
  });

  console.log('✓ Roles created\n');

  // Create Teams
  console.log('Creating teams...');
  const supportTeam = await prisma.team.upsert({
    where: { name: 'Customer Support' },
    update: {},
    create: {
      name: 'Customer Support',
      description: 'Handles customer inquiries and support tickets',
    },
  });

  const technicalTeam = await prisma.team.upsert({
    where: { name: 'Technical Support' },
    update: {},
    create: {
      name: 'Technical Support',
      description: 'Handles technical issues and bug reports',
    },
  });

  const salesTeam = await prisma.team.upsert({
    where: { name: 'Sales Team' },
    update: {},
    create: {
      name: 'Sales Team',
      description: 'Handles sales inquiries and pre-sales support',
    },
  });

  console.log('✓ Teams created\n');

  // Create Users
  console.log('Creating users...');
  const employeePassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('cimcon@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'disha.bisht@cimconautomation.com' },
    update: {},
    create: {
      email: 'disha.bisht@cimconautomation.com',
      name: 'Disha',
      password: adminPassword,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  const teamLead1 = await prisma.user.upsert({
    where: { email: 'teamlead1@example.com' },
    update: {},
    create: {
      email: 'teamlead1@example.com',
      name: 'John Smith',
      password: employeePassword,
      roleId: teamLeaderRole.id,
      teamId: supportTeam.id,
      isActive: true,
    },
  });

  const teamLead2 = await prisma.user.upsert({
    where: { email: 'teamlead2@example.com' },
    update: {},
    create: {
      email: 'teamlead2@example.com',
      name: 'Sarah Johnson',
      password: employeePassword,
      roleId: teamLeaderRole.id,
      teamId: technicalTeam.id,
      isActive: true,
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: 'employee1@example.com' },
    update: {},
    create: {
      email: 'employee1@example.com',
      name: 'Mike Davis',
      password: employeePassword,
      roleId: employeeRole.id,
      teamId: supportTeam.id,
      isActive: true,
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'employee2@example.com' },
    update: {},
    create: {
      email: 'employee2@example.com',
      name: 'Emily Brown',
      password: employeePassword,
      roleId: employeeRole.id,
      teamId: technicalTeam.id,
      isActive: true,
    },
  });

  console.log('✓ Users created\n');

  // Assign Team Leaders
  console.log('Assigning team leaders...');
  await prisma.teamLeader.upsert({
    where: {
      userId_teamId: {
        userId: teamLead1.id,
        teamId: supportTeam.id,
      },
    },
    update: {},
    create: {
      userId: teamLead1.id,
      teamId: supportTeam.id,
    },
  });

  await prisma.teamLeader.upsert({
    where: {
      userId_teamId: {
        userId: teamLead2.id,
        teamId: technicalTeam.id,
      },
    },
    update: {},
    create: {
      userId: teamLead2.id,
      teamId: technicalTeam.id,
    },
  });

  console.log('✓ Team leaders assigned\n');

  // Note: Customers are now just users, so we'll use existing users as customers for tickets
  console.log('Using existing users as customers for sample tickets...');

  // Create Sample Tickets (using employees as customers)
  console.log('Creating sample tickets...');
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Login Issue - Cannot access account',
      description: 'Customer is unable to login to their account. Password reset not working.',
      phone: '+1 (555) 123-4567',
      status: 'OPEN',
      priority: 'HIGH',
      customerId: employee1.id,  // Using employee1 as the customer
      createdBy: employee1.id,
      assignedTo: teamLead1.id,
      teamId: supportTeam.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Bug Report - Application crashes on startup',
      description: 'Application crashes immediately after launching. Error code: 0x8007000E',
      phone: '555-987-6543',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      customerId: employee2.id,  // Using employee2 as the customer
      createdBy: employee2.id,
      assignedTo: teamLead2.id,
      teamId: technicalTeam.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Feature Request - Dark mode support',
      description: 'Customer requesting dark mode theme for better usability',
      phone: '+44 20 7946 0958',
      status: 'OPEN',
      priority: 'LOW',
      customerId: employee1.id,  // Using employee1 as the customer
      createdBy: employee1.id,
      assignedTo: teamLead1.id,
      teamId: supportTeam.id,
    },
  });

  console.log('✓ Sample tickets created\n');

  // Create Comments
  console.log('Creating comments...');
  await prisma.comment.create({
    data: {
      content: 'I have started investigating this issue. Will update soon.',
      ticketId: ticket1.id,
      authorId: teamLead1.id,
      isInternal: false,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'This appears to be a memory allocation issue. Working on a fix.',
      ticketId: ticket2.id,
      authorId: teamLead2.id,
      isInternal: true,
    },
  });

  console.log('✓ Comments created\n');

  // Create SLA Policies
  console.log('Creating SLA policies...');
  await prisma.sLAPolicy.upsert({
    where: { id: 'sla-urgent' },
    update: {},
    create: {
      id: 'sla-urgent',
      name: 'Urgent Priority SLA',
      description: 'SLA for urgent priority tickets',
      priority: 'URGENT',
      responseTimeHours: 4,
      resolutionTimeHours: 48, // 2 days
      isActive: true,
    },
  });

  await prisma.sLAPolicy.upsert({
    where: { id: 'sla-high' },
    update: {},
    create: {
      id: 'sla-high',
      name: 'High Priority SLA',
      description: 'SLA for high priority tickets',
      priority: 'HIGH',
      responseTimeHours: 8,
      resolutionTimeHours: 168, // 7 days
      isActive: true,
    },
  });

  await prisma.sLAPolicy.upsert({
    where: { id: 'sla-medium' },
    update: {},
    create: {
      id: 'sla-medium',
      name: 'Medium Priority SLA',
      description: 'SLA for medium priority tickets',
      priority: 'MEDIUM',
      responseTimeHours: 24,
      resolutionTimeHours: 360, // 15 days
      isActive: true,
    },
  });

  await prisma.sLAPolicy.upsert({
    where: { id: 'sla-low' },
    update: {},
    create: {
      id: 'sla-low',
      name: 'Low Priority SLA',
      description: 'SLA for low priority tickets',
      priority: 'LOW',
      responseTimeHours: 48,
      resolutionTimeHours: 720, // 30 days
      isActive: true,
    },
  });

  console.log('✓ SLA policies created\n');

  // Create Knowledge Base Articles
  console.log('Creating knowledge base articles...');
  await prisma.knowledgeBaseArticle.create({
    data: {
      title: 'How to Reset Your Password',
      content: 'To reset your password:\n1. Click on "Forgot Password"\n2. Enter your email\n3. Check your email for reset link\n4. Follow the instructions',
      summary: 'Step-by-step guide for password reset',
      accessLevel: 'PUBLIC',
      isPublished: true,
    },
  });

  await prisma.knowledgeBaseArticle.create({
    data: {
      title: 'Troubleshooting Common Login Issues',
      content: 'Common login issues and solutions:\n- Clear browser cache\n- Check internet connection\n- Verify credentials\n- Try incognito mode',
      summary: 'Solutions for common login problems',
      accessLevel: 'PUBLIC',
      isPublished: true,
    },
  });

  await prisma.knowledgeBaseArticle.create({
    data: {
      title: 'Internal: Escalation Procedures',
      content: 'Internal escalation procedures for critical issues...',
      summary: 'Internal guide for escalating critical tickets',
      accessLevel: 'INTERNAL',
      isPublished: true,
      teamId: supportTeam.id,
    },
  });

  console.log('✓ Knowledge base articles created\n');

  console.log('✅ Database seeding completed successfully!\n');
  console.log('Login credentials:');
  console.log('  Admin: disha.bisht@cimconautomation.com / cimcon@123');
  console.log('  Team Lead 1: teamlead1@example.com / password123');
  console.log('  Team Lead 2: teamlead2@example.com / password123');
  console.log('  Employee 1: employee1@example.com / password123');
  console.log('  Employee 2: employee2@example.com / password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
