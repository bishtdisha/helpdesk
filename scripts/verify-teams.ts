import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTeams() {
  try {
    console.log('🔍 Verifying imported teams...\n');
    
    const teams = await prisma.team.findMany({
      include: {
        teamLeaders: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            tickets: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📊 Total teams in database: ${teams.length}\n`);
    console.log('='.repeat(80));
    
    teams.forEach((team, index) => {
      console.log(`\n${index + 1}. ${team.name}`);
      console.log(`   📧 Email: ${team.email || 'N/A'}`);
      console.log(`   👥 Members: ${team._count.members}`);
      console.log(`   🎫 Tickets: ${team._count.tickets}`);
      
      if (team.teamLeaders.length > 0) {
        const leader = team.teamLeaders[0].user;
        console.log(`   👑 Leader: ${leader.name} (${leader.email})`);
        console.log(`   🎭 Role: ${leader.role?.name || 'N/A'}`);
      } else {
        console.log(`   👑 Leader: None assigned`);
      }
      
      if (team.members.length > 0) {
        console.log(`   📋 Team Members:`);
        team.members.forEach(member => {
          console.log(`      - ${member.name} (${member.email}) - ${member.role?.name || 'No role'}`);
        });
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying teams:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTeams();
