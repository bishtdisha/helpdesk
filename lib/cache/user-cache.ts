/**
 * In-memory cache for user session data
 * Reduces database calls for frequently accessed user information
 */

interface CachedUser {
  id: string;
  email: string;
  name: string | null;
  roleId: string | null;
  teamId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
}

interface CachedSession {
  id: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class UserCache {
  private userCache = new Map<string, CacheEntry<CachedUser>>();
  private sessionCache = new Map<string, CacheEntry<{ session: CachedSession; user: CachedUser }>>();
  
  // Cache TTL in milliseconds
  private readonly USER_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SESSION_TTL = 10 * 60 * 1000; // 10 minutes
  
  // Maximum cache size to prevent memory leaks
  private readonly MAX_USERS = 1000;
  private readonly MAX_SESSIONS = 2000;

  /**
   * Get user from cache
   */
  getUser(userId: string): CachedUser | null {
    const entry = this.userCache.get(userId);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.userCache.delete(userId);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache user data
   */
  setUser(userId: string, user: CachedUser): void {
    // Implement LRU eviction if cache is full
    if (this.userCache.size >= this.MAX_USERS) {
      this.evictOldestUsers(Math.floor(this.MAX_USERS * 0.1)); // Remove 10%
    }
    
    this.userCache.set(userId, {
      data: user,
      timestamp: Date.now(),
      ttl: this.USER_TTL,
    });
  }

  /**
   * Get session validation result from cache
   */
  getSessionValidation(token: string): { session: CachedSession; user: CachedUser } | null {
    const entry = this.sessionCache.get(token);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired or session itself is expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl || entry.data.session.expiresAt.getTime() < now) {
      this.sessionCache.delete(token);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache session validation result
   */
  setSessionValidation(token: string, session: CachedSession, user: CachedUser): void {
    // Don't cache if session expires soon (less than 1 minute)
    if (session.expiresAt.getTime() - Date.now() < 60000) {
      return;
    }
    
    // Implement LRU eviction if cache is full
    if (this.sessionCache.size >= this.MAX_SESSIONS) {
      this.evictOldestSessions(Math.floor(this.MAX_SESSIONS * 0.1)); // Remove 10%
    }
    
    this.sessionCache.set(token, {
      data: { session, user },
      timestamp: Date.now(),
      ttl: this.SESSION_TTL,
    });
    
    // Also cache the user separately
    this.setUser(user.id, user);
  }

  /**
   * Invalidate user cache (when user data changes)
   */
  invalidateUser(userId: string): void {
    this.userCache.delete(userId);
    
    // Also invalidate any sessions for this user
    for (const [token, entry] of this.sessionCache.entries()) {
      if (entry.data.user.id === userId) {
        this.sessionCache.delete(token);
      }
    }
  }

  /**
   * Invalidate session cache
   */
  invalidateSession(token: string): void {
    this.sessionCache.delete(token);
  }

  /**
   * Invalidate all sessions for a user
   */
  invalidateUserSessions(userId: string): void {
    for (const [token, entry] of this.sessionCache.entries()) {
      if (entry.data.user.id === userId) {
        this.sessionCache.delete(token);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.userCache.clear();
    this.sessionCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    users: { size: number; maxSize: number; hitRate: number };
    sessions: { size: number; maxSize: number; hitRate: number };
    memory: { estimatedSizeKB: number };
  } {
    // Simple memory estimation (rough)
    const avgUserSize = 500; // bytes
    const avgSessionSize = 800; // bytes
    const estimatedSizeKB = Math.round(
      (this.userCache.size * avgUserSize + this.sessionCache.size * avgSessionSize) / 1024
    );

    return {
      users: {
        size: this.userCache.size,
        maxSize: this.MAX_USERS,
        hitRate: this.userHitRate,
      },
      sessions: {
        size: this.sessionCache.size,
        maxSize: this.MAX_SESSIONS,
        hitRate: this.sessionHitRate,
      },
      memory: {
        estimatedSizeKB,
      },
    };
  }

  // Hit rate tracking
  private userHits = 0;
  private userMisses = 0;
  private sessionHits = 0;
  private sessionMisses = 0;

  private get userHitRate(): number {
    const total = this.userHits + this.userMisses;
    return total > 0 ? this.userHits / total : 0;
  }

  private get sessionHitRate(): number {
    const total = this.sessionHits + this.sessionMisses;
    return total > 0 ? this.sessionHits / total : 0;
  }

  /**
   * Track cache hit
   */
  private trackUserHit(): void {
    this.userHits++;
  }

  /**
   * Track cache miss
   */
  private trackUserMiss(): void {
    this.userMisses++;
  }

  /**
   * Track session cache hit
   */
  private trackSessionHit(): void {
    this.sessionHits++;
  }

  /**
   * Track session cache miss
   */
  private trackSessionMiss(): void {
    this.sessionMisses++;
  }

  /**
   * Evict oldest users from cache
   */
  private evictOldestUsers(count: number): void {
    const entries = Array.from(this.userCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);
    
    for (const [userId] of entries) {
      this.userCache.delete(userId);
    }
  }

  /**
   * Evict oldest sessions from cache
   */
  private evictOldestSessions(count: number): void {
    const entries = Array.from(this.sessionCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);
    
    for (const [token] of entries) {
      this.sessionCache.delete(token);
    }
  }

  /**
   * Cleanup expired entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    
    // Cleanup expired users
    for (const [userId, entry] of this.userCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.userCache.delete(userId);
      }
    }
    
    // Cleanup expired sessions
    for (const [token, entry] of this.sessionCache.entries()) {
      if (now - entry.timestamp > entry.ttl || entry.data.session.expiresAt.getTime() < now) {
        this.sessionCache.delete(token);
      }
    }
  }
}

// Global cache instance
export const userCache = new UserCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  userCache.cleanup();
}, 5 * 60 * 1000);