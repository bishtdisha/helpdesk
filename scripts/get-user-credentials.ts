import { prisma } from '../lib/db';

async function getUserCredentials() {
  try {
    // Find users by name
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'CS Support', mode: 'insensitive' } },
          { name: { contains: 'Jay Vara', mode: 'insensitive' } },
          { email: { contains: 'cs', mode: 'insensitive' } },
          { email: { contains: 'jay', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
        isActive: true,
      },
    });

    console.log('\n=== User Credentials ===\n');
    
    if (users.length === 0) {
      console.log('No users found matching "CS Support" or "Jay Vara"');
      console.log('\nSearching for all users...\n');
      
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: {
            select: {
              name: true,
            },
          },
          isActive: true,
        },
        take: 20,
      });
      
      allUsers.forEach(user => {
        console.log(`Name: ${user.name || 'N/A'}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role?.name || 'No role'}`);
        console.log(`Active: ${user.isActive}`);
        console.log('---');
      });
    } else {
      users.forEach(user => {
        console.log(`Name: ${user.name || 'N/A'}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role?.name || 'No role'}`);
        console.log(`Team: ${user.team?.name || 'No team'}`);
        console.log(`Active: ${user.isActive}`);
        console.log('---');
      });
    }

    console.log('\n⚠️  Note: Passwords are hashed and cannot be retrieved.');
    console.log('If you need to reset a password, use the password reset functionality.\n');

  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUserCredentials();
