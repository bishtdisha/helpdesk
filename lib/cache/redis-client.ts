/**
 * Redis Client Configuration
 * 
 * Provides a configured Redis client for caching operations
 */

import { createClient } from 'redis';

// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
export const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 5000,
    lazyConnect: true,
  },
  // Retry configuration
  retry: {
    retries: 3,
    delay: (attempt) => Math.min(attempt * 50, 500),
  },
});

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready');
});

redisClient.on('end', () => {
  console.log('Redis Client Disconnected');
});

// Connect to Redis (only in server environment)
if (typeof window === 'undefined') {
  redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redisClient.quit();
  process.exit(0);
});

export default redisClient;