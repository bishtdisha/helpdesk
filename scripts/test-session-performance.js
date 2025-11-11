#!/usr/bin/env node

/**
 * Performance testing script for session validation
 * Compares old vs new implementation performance
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPerformance() {
  console.log('🧪 Testing session validation performance...\n');
  
  try {
    // Find an active session to test with
    const testSession = await prisma.userSession.findFirst({
      where: { 
        expiresAt: { gt: new Date() },
        user: { isActive: true }
      },
      include: { user: true }
    });
    
    if (!testSession) {
      console.log('❌ No active sessions found. Please login first to create a test session.');
      return;
    }
    
    console.log(`🎯 Testing with session for user: ${testSession.user.email}`);
    console.log(`📅 Session expires: ${testSession.expiresAt.toISOString()}\n`);
    
    // Test the old method (simulated with separate queries)
    console.log('📊 Testing OLD method (separate queries)...');
    const oldResults = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      
      // Simulate old method with separate queries
      const session = await prisma.userSession.findUnique({
        where: { token: testSession.token }
      });
      
      if (session) {
        const user = await prisma.user.findUnique({
          where: { id: session.userId }
        });
        
        if (user && user.roleId) {
          await prisma.role.findUnique({
            where: { id: user.roleId }
          });
        }
        
        if (user && user.teamId) {
          await prisma.team.findUnique({
            where: { id: user.teamId }
          });
        }
      }
      
      const duration = performance.now() - startTime;
      oldResults.push(duration);
    }
    
    // Test the new optimized method
    console.log('📊 Testing NEW method (single optimized query)...');
    const newResults = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      
      // New optimized query
      await prisma.$queryRaw`
        SELECT 
          us.id as session_id,
          us.token as session_token,
          us."expiresAt" as session_expires_at,
          u.id as user_id,
          u.email as user_email,
          u.name as user_name,
          u."roleId" as user_role_id,
          u."teamId" as user_team_id,
          u."isActive" as user_is_active,
          r.id as role_id,
          r.name as role_name,
          r.description as role_description,
          t.id as team_id,
          t.name as team_name
        FROM user_sessions us
        INNER JOIN users u ON us."userId" = u.id
        LEFT JOIN roles r ON u."roleId" = r.id
        LEFT JOIN teams t ON u."teamId" = t.id
        WHERE us.token = ${testSession.token}
          AND us."expiresAt" > NOW()
          AND u."isActive" = true
        LIMIT 1
      `;
      
      const duration = performance.now() - startTime;
      newResults.push(duration);
    }
    
    // Calculate statistics
    const oldAvg = oldResults.reduce((a, b) => a + b, 0) / oldResults.length;
    const newAvg = newResults.reduce((a, b) => a + b, 0) / newResults.length;
    const oldMin = Math.min(...oldResults);
    const oldMax = Math.max(...oldResults);
    const newMin = Math.min(...newResults);
    const newMax = Math.max(...newResults);
    
    const improvement = ((oldAvg - newAvg) / oldAvg * 100);
    const speedup = oldAvg / newAvg;
    
    console.log('\n📈 PERFORMANCE RESULTS:');
    console.log('========================');
    console.log(`OLD Method (separate queries):`);
    console.log(`  Average: ${oldAvg.toFixed(2)}ms`);
    console.log(`  Min: ${oldMin.toFixed(2)}ms`);
    console.log(`  Max: ${oldMax.toFixed(2)}ms`);
    console.log('');
    console.log(`NEW Method (optimized query):`);
    console.log(`  Average: ${newAvg.toFixed(2)}ms`);
    console.log(`  Min: ${newMin.toFixed(2)}ms`);
    console.log(`  Max: ${newMax.toFixed(2)}ms`);
    console.log('');
    console.log(`🚀 IMPROVEMENT: ${improvement.toFixed(1)}% faster`);
    console.log(`⚡ SPEEDUP: ${speedup.toFixed(1)}x faster`);
    
    if (improvement > 50) {
      console.log('🎉 Excellent optimization! Major performance improvement achieved.');
    } else if (improvement > 25) {
      console.log('👍 Good optimization! Noticeable performance improvement.');
    } else if (improvement > 0) {
      console.log('✅ Positive optimization. Some performance improvement.');
    } else {
      console.log('⚠️  No improvement detected. Check if indexes are properly applied.');
    }
    
  } catch (error) {
    console.error('❌ Error during performance testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPerformance().catch(console.error);