#!/usr/bin/env node

/**
 * Script to apply performance indexes for session validation optimization
 * Run this after deploying the code changes
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyIndexes() {
  console.log('🚀 Applying performance indexes for session validation...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../prisma/migrations/add_session_performance_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // If index already exists, that's okay
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Statement ${i + 1} - Index already exists, skipping`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('🎉 All performance indexes applied successfully!');
    
    // Test the performance improvement
    console.log('\n🔍 Testing session validation performance...');
    
    // Create a test session if none exists
    const existingSession = await prisma.userSession.findFirst({
      where: { expiresAt: { gt: new Date() } }
    });
    
    if (existingSession) {
      const startTime = performance.now();
      
      // Test the optimized query
      const result = await prisma.$queryRaw`
        SELECT 
          us.id as session_id,
          us.token as session_token,
          u.id as user_id,
          u.email as user_email,
          u."isActive" as user_is_active,
          r.name as role_name,
          t.name as team_name
        FROM user_sessions us
        INNER JOIN users u ON us."userId" = u.id
        LEFT JOIN roles r ON u."roleId" = r.id
        LEFT JOIN teams t ON u."teamId" = t.id
        WHERE us.token = ${existingSession.token}
          AND us."expiresAt" > NOW()
          AND u."isActive" = true
        LIMIT 1
      `;
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⚡ Session validation test completed in ${duration.toFixed(2)}ms`);
      
      if (duration < 20) {
        console.log('🎯 Excellent performance! Query is optimized.');
      } else if (duration < 50) {
        console.log('👍 Good performance. Indexes are working.');
      } else {
        console.log('⚠️  Performance could be better. Check if indexes were applied correctly.');
      }
    } else {
      console.log('ℹ️  No active sessions found for testing');
    }
    
  } catch (error) {
    console.error('❌ Error applying indexes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
applyIndexes().catch(console.error);