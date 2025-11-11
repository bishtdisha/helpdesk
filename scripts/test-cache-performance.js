#!/usr/bin/env node

/**
 * Performance testing script for Phase 2 caching implementation
 * Tests cache hit/miss performance and overall improvement
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCachePerformance() {
  console.log('🧪 Testing Phase 2 Cache Performance...\n');
  
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
    
    // Import the auth service (assuming it's compiled to JS or using ts-node)
    let AuthService;
    try {
      // Try to import the compiled JS version
      AuthService = require('../lib/auth-service.js').AuthService;
    } catch (error) {
      console.log('⚠️  Could not import AuthService. Make sure the project is compiled.');
      console.log('   Run: npm run build or tsc');
      return;
    }
    
    console.log('📊 Testing CACHE MISS performance (first calls)...');
    const cacheMissResults = [];
    
    // Clear any existing cache first
    try {
      const { userCache } = require('../lib/cache/user-cache.js');
      userCache.clear();
      console.log('🧹 Cache cleared for accurate testing');
    } catch (error) {
      console.log('⚠️  Could not clear cache, continuing with test...');
    }
    
    // Test cache misses (first calls)
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      
      const result = await AuthService.validateSession(testSession.token);
      
      const duration = performance.now() - startTime;
      cacheMissResults.push(duration);
      
      if (!result.valid) {
        console.log('❌ Session validation failed');
        return;
      }
    }
    
    console.log('📊 Testing CACHE HIT performance (subsequent calls)...');
    const cacheHitResults = [];
    
    // Test cache hits (subsequent calls)
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      
      const result = await AuthService.validateSession(testSession.token);
      
      const duration = performance.now() - startTime;
      cacheHitResults.push(duration);
      
      if (!result.valid) {
        console.log('❌ Session validation failed');
        return;
      }
    }
    
    // Test lightweight validation
    console.log('📊 Testing LIGHTWEIGHT validation performance...');
    const lightweightResults = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      
      const result = await AuthService.validateSessionLightweight(testSession.token);
      
      const duration = performance.now() - startTime;
      lightweightResults.push(duration);
      
      if (!result.valid) {
        console.log('❌ Lightweight session validation failed');
        return;
      }
    }
    
    // Calculate statistics
    const cacheMissAvg = cacheMissResults.reduce((a, b) => a + b, 0) / cacheMissResults.length;
    const cacheHitAvg = cacheHitResults.reduce((a, b) => a + b, 0) / cacheHitResults.length;
    const lightweightAvg = lightweightResults.reduce((a, b) => a + b, 0) / lightweightResults.length;
    
    const cacheImprovement = ((cacheMissAvg - cacheHitAvg) / cacheMissAvg * 100);
    const cacheSpeedup = cacheMissAvg / cacheHitAvg;
    const lightweightImprovement = ((cacheMissAvg - lightweightAvg) / cacheMissAvg * 100);
    
    console.log('\n📈 PHASE 2 CACHE PERFORMANCE RESULTS:');
    console.log('=====================================');
    console.log(`Cache Miss (Database Query):`);
    console.log(`  Average: ${cacheMissAvg.toFixed(2)}ms`);
    console.log(`  Min: ${Math.min(...cacheMissResults).toFixed(2)}ms`);
    console.log(`  Max: ${Math.max(...cacheMissResults).toFixed(2)}ms`);
    console.log('');
    console.log(`Cache Hit (Memory):`);
    console.log(`  Average: ${cacheHitAvg.toFixed(2)}ms`);
    console.log(`  Min: ${Math.min(...cacheHitResults).toFixed(2)}ms`);
    console.log(`  Max: ${Math.max(...cacheHitResults).toFixed(2)}ms`);
    console.log('');
    console.log(`Lightweight Validation:`);
    console.log(`  Average: ${lightweightAvg.toFixed(2)}ms`);
    console.log(`  Min: ${Math.min(...lightweightResults).toFixed(2)}ms`);
    console.log(`  Max: ${Math.max(...lightweightResults).toFixed(2)}ms`);
    console.log('');
    console.log(`🚀 CACHE IMPROVEMENT: ${cacheImprovement.toFixed(1)}% faster`);
    console.log(`⚡ CACHE SPEEDUP: ${cacheSpeedup.toFixed(1)}x faster`);
    console.log(`🏃 LIGHTWEIGHT IMPROVEMENT: ${lightweightImprovement.toFixed(1)}% faster than full validation`);
    
    // Get cache statistics if available
    try {
      const { CacheMonitor } = require('../lib/cache/cache-monitor.js');
      const cacheStats = CacheMonitor.getCacheStats();
      
      console.log('\n📊 CACHE STATISTICS:');
      console.log('====================');
      console.log(`Session Cache Hit Rate: ${(cacheStats.cache.sessions.hitRate * 100).toFixed(1)}%`);
      console.log(`User Cache Hit Rate: ${(cacheStats.cache.users.hitRate * 100).toFixed(1)}%`);
      console.log(`Memory Usage: ${cacheStats.cache.memory.estimatedSizeKB}KB`);
      console.log(`Sessions Cached: ${cacheStats.cache.sessions.size}/${cacheStats.cache.sessions.maxSize}`);
      console.log(`Users Cached: ${cacheStats.cache.users.size}/${cacheStats.cache.users.maxSize}`);
      
      const health = CacheMonitor.getCacheHealth();
      console.log(`Cache Health: ${health.status.toUpperCase()}`);
      
      if (health.issues.length > 0) {
        console.log(`Issues: ${health.issues.join(', ')}`);
      }
      
    } catch (error) {
      console.log('⚠️  Cache statistics not available');
    }
    
    // Performance assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT:');
    console.log('==========================');
    
    if (cacheImprovement > 70) {
      console.log('🎉 Excellent cache performance! Cache is highly effective.');
    } else if (cacheImprovement > 40) {
      console.log('👍 Good cache performance. Cache is working well.');
    } else if (cacheImprovement > 10) {
      console.log('✅ Moderate cache improvement. Some benefit from caching.');
    } else {
      console.log('⚠️  Limited cache benefit. Check cache configuration.');
    }
    
    if (cacheHitAvg < 1) {
      console.log('⚡ Sub-millisecond cache hits! Excellent memory performance.');
    } else if (cacheHitAvg < 5) {
      console.log('🚀 Very fast cache hits. Good memory performance.');
    } else {
      console.log('📈 Cache hits could be faster. Check system load.');
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    console.log('• Use lightweight validation for simple auth checks');
    console.log('• Cache hit rate should be >70% for optimal performance');
    console.log('• Monitor memory usage to prevent cache bloat');
    console.log('• Consider Redis for distributed caching in production');
    
  } catch (error) {
    console.error('❌ Error during cache performance testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCachePerformance().catch(console.error);