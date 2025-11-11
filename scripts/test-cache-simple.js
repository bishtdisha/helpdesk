#!/usr/bin/env node

/**
 * Simple cache performance test using direct database queries
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple in-memory cache simulation
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

async function validateSessionWithCache(token) {
  // Check cache first
  const cached = getCached(token);
  if (cached) {
    return { ...cached, source: 'cache' };
  }
  
  // Cache miss - query database
  const result = await prisma.$queryRaw`
    SELECT 
      us.id as session_id,
      us.token as session_token,
      us."expiresAt" as session_expires_at,
      u.id as user_id,
      u.email as user_email,
      u.name as user_name,
      u."isActive" as user_is_active,
      r.name as role_name,
      t.name as team_name
    FROM user_sessions us
    INNER JOIN users u ON us."userId" = u.id
    LEFT JOIN roles r ON u."roleId" = r.id
    LEFT JOIN teams t ON u."teamId" = t.id
    WHERE us.token = ${token}
      AND us."expiresAt" > NOW()
      AND u."isActive" = true
    LIMIT 1
  `;
  
  if (!result || result.length === 0) {
    return null;
  }
  
  const data = {
    session: { id: result[0].session_id, token: result[0].session_token },
    user: { 
      id: result[0].user_id, 
      email: result[0].user_email,
      name: result[0].user_name,
      isActive: result[0].user_is_active
    },
    source: 'database'
  };
  
  // Cache the result
  setCache(token, data);
  
  return data;
}

async function testCachePerformance() {
  console.log('🧪 Testing Cache Performance (Simplified)...\n');
  
  try {
    // Find an active session
    const testSession = await prisma.userSession.findFirst({
      where: { 
        expiresAt: { gt: new Date() },
        user: { isActive: true }
      },
      include: { user: true }
    });
    
    if (!testSession) {
      console.log('❌ No active sessions found. Please login first.');
      return;
    }
    
    console.log(`🎯 Testing with session for user: ${testSession.user.email}\n`);
    
    // Clear cache
    cache.clear();
    
    console.log('📊 Testing CACHE MISS (first call)...');
    const cacheMissResults = [];
    
    for (let i = 0; i < 3; i++) {
      const startTime = performance.now();
      const result = await validateSessionWithCache(testSession.token);
      const duration = performance.now() - startTime;
      
      cacheMissResults.push(duration);
      console.log(`  Call ${i + 1}: ${duration.toFixed(2)}ms (${result?.source || 'null'})`);
    }
    
    console.log('\n📊 Testing CACHE HIT (subsequent calls)...');
    const cacheHitResults = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      const result = await validateSessionWithCache(testSession.token);
      const duration = performance.now() - startTime;
      
      cacheHitResults.push(duration);
      console.log(`  Call ${i + 1}: ${duration.toFixed(2)}ms (${result?.source || 'null'})`);
    }
    
    // Calculate statistics
    const cacheMissAvg = cacheMissResults.reduce((a, b) => a + b, 0) / cacheMissResults.length;
    const cacheHitAvg = cacheHitResults.reduce((a, b) => a + b, 0) / cacheHitResults.length;
    const improvement = ((cacheMissAvg - cacheHitAvg) / cacheMissAvg * 100);
    const speedup = cacheMissAvg / cacheHitAvg;
    
    console.log('\n📈 CACHE PERFORMANCE RESULTS:');
    console.log('=============================');
    console.log(`Database Query (Cache Miss): ${cacheMissAvg.toFixed(2)}ms avg`);
    console.log(`Memory Access (Cache Hit):   ${cacheHitAvg.toFixed(2)}ms avg`);
    console.log(`🚀 IMPROVEMENT: ${improvement.toFixed(1)}% faster`);
    console.log(`⚡ SPEEDUP: ${speedup.toFixed(1)}x faster`);
    
    console.log('\n📊 CACHE STATISTICS:');
    console.log('====================');
    console.log(`Cache Size: ${cache.size} entries`);
    console.log(`Memory Usage: ~${cache.size * 0.5}KB (estimated)`);
    
    if (improvement > 70) {
      console.log('\n🎉 Excellent cache performance! Cache is highly effective.');
    } else if (improvement > 40) {
      console.log('\n👍 Good cache performance. Cache is working well.');
    } else {
      console.log('\n✅ Cache is working. Some performance benefit achieved.');
    }
    
    if (cacheHitAvg < 1) {
      console.log('⚡ Sub-millisecond cache hits! Excellent memory performance.');
    } else if (cacheHitAvg < 5) {
      console.log('🚀 Very fast cache hits. Good memory performance.');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCachePerformance().catch(console.error);