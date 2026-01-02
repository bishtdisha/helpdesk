import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface TeamData {
  teamName: string;
  teamEmail: string;
  leaderName: string;
  leaderEmail: string;
}

async function importTeams() {
  try {
    console.log('📂 Reading Excel file...');
    
    // Read the Excel file
    const filePath = path.join('d:', 'v0-odoo', 'odoo Team Excel.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Found ${data.length} rows in Excel file`);
    console.log('Sample data:', data[0]);
    
    // Get the Team Leader role
    const teamLeaderRole = await prisma.role.findUnique({
      where: { name: 'Team Leader' }
    });
    
    if (!teamLeaderRole) {
      throw new Error('Team Leader role not found in database. Please run seed first.');
    }
    
    console.log('✅ Team Leader role found:', teamLeaderRole.id);
    
    let teamsCreated = 0;
    let leadersCreated = 0;
    let teamsSkipped = 0;
    
    for (const row of data) {
      try {
        // Extract data from row (based on your Excel structure)
        const teamName = (row['Taem Name '] || row['Team Name'] || '').trim();
        const teamEmail = (row['Team ID'] || '').trim();
        const leaderName = (row['__EMPTY'] || '').trim();
        
        if (!teamName || !teamEmail) {
          console.log(`⚠️  Skipping row - missing team name or email:`, row);
          teamsSkipped++;
          continue;
        }
        
        // Generate leader email from team email if not provided separately
        const leaderEmail = teamEmail;
        
        console.log(`\n🔄 Processing team: ${teamName}`);
        
        // Check if team already exists
        const existingTeam = await prisma.team.findUnique({
          where: { name: teamName }
        });
        
        if (existingTeam) {
          console.log(`⏭️  Team "${teamName}" already exists, skipping...`);
          teamsSkipped++;
          continue;
        }
        
        // Create team
        const team = await prisma.team.create({
          data: {
            name: teamName,
            email: teamEmail,
            description: `${teamName} team`
          }
        });
        
        console.log(`✅ Created team: ${team.name} (${team.email})`);
        teamsCreated++;
        
        // Create team leader if provided
        if (leaderName && leaderEmail) {
          // Check if leader user exists
          let leaderUser = await prisma.user.findUnique({
            where: { email: leaderEmail }
          });
          
          if (!leaderUser) {
            // Create leader user
            const defaultPassword = await bcrypt.hash('Password123!', 12);
            
            leaderUser = await prisma.user.create({
              data: {
                name: leaderName,
                email: leaderEmail,
                password: defaultPassword,
                roleId: teamLeaderRole.id,
                teamId: team.id,
                isActive: true
              }
            });
            
            console.log(`✅ Created team leader user: ${leaderUser.name} (${leaderUser.email})`);
            leadersCreated++;
          } else {
            // Update existing user to be team leader
            await prisma.user.update({
              where: { id: leaderUser.id },
              data: {
                roleId: teamLeaderRole.id,
                teamId: team.id
              }
            });
            
            console.log(`✅ Updated existing user as team leader: ${leaderUser.name}`);
          }
          
          // Create TeamLeader relationship
          await prisma.teamLeader.create({
            data: {
              userId: leaderUser.id,
              teamId: team.id
            }
          });
          
          console.log(`✅ Assigned ${leaderUser.name} as leader of ${team.name}`);
        }
        
      } catch (error: any) {
        console.error(`❌ Error processing row:`, error.message);
        if (error.code === 'P2002') {
          console.error('   Duplicate entry detected, skipping...');
          teamsSkipped++;
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Teams created: ${teamsCreated}`);
    console.log(`✅ Leaders created: ${leadersCreated}`);
    console.log(`⏭️  Teams skipped: ${teamsSkipped}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error importing teams:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importTeams()
  .then(() => {
    console.log('✅ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
