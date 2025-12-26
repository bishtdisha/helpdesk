// Conditional Redis import to avoid server-side issues during build
let createClient: ((options: { url: string; socket: { reconnectStrategy: (retries: number) => number } }) => {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  connect: () => Promise<void>;
  setEx: (key: string, ttl: number, value: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  del: (key: string | string[]) => Promise<void>;
  keys: (pattern: string) => Promise<string[]>;
  disconnect: () => Promise<void>;
}) | null = null;

// Only try to import Redis if we're in a runtime environment (not build time)
const isRuntimeEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV;

if (isRuntimeEnvironment && typeof window === 'undefined') {
  try {
    // Dynamic import for Redis - using eval to avoid static analysis
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const redis = eval('require')('redis');
    createClient = redis.createClient;
  } catch {
    // Redis not available, caching will be disabled
    console.warn('Redis not available, RBAC caching will be disabled');
  }
}
import {
  UserPermissions,
  AccessScope,
  UserWithRole,
  Role,
  Team,
} from '../types/rbac';

/**
 * Redis Cache Service for RBAC Performance Optimization
 * 
 * This service provides caching for frequently accessed RBAC data including:
 * - User permissions and role data
 * - Access scopes and team memberships
 * - Role definitions and permission matrices
 */
export class RBACCache {
  private client: any = null;
  private isConnected = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly defaultTTL = 3600; // 1 hour in seconds
  private readonly shortTTL = 300; // 5 minutes for frequently changing data

  // Cache key prefixes
  private readonly KEYS = {
    USER_PERMISSIONS: 'rbac:user_permissions:',
    USER_ROLE: 'rbac:user_role:',
    USER_TEAMS: 'rbac:user_teams:',
    ACCESS_SCOPE: 'rbac:access_scope:',
    ROLE_DATA: 'rbac:role:',
    TEAM_DATA: 'rbac:team:',
    TEAM_MEMBERS: 'rbac:team_members:',
    USER_WITH_ROLE: 'rbac:user_with_role:',
  };

  constructor() {
    // Don't initialize immediately - wait for first use
    // This prevents Redis connection attempts during Next.js build
  }

  /**
   * Initialize Redis client with connection handling
   */
  private async initializeClient(): Promise<void> {
    try {
      // Skip initialization during build time or if Redis is not available
      if (!createClient || !isRuntimeEnvironment) {
        return;
      }

      // Only initialize if Redis URL is provided
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;
      
      if (!redisUrl) {
        // Don't log warning during build time
        if (process.env.NODE_ENV !== 'production' || process.env.REDIS_URL) {
          console.warn('Redis URL not provided. RBAC caching will be disabled.');
        }
        return;
      }

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Ensure client is initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    if (!this.client) {
      this.initializationPromise = this.initializeClient();
      await this.initializationPromise;
    }
  }

  /**
   * Check if caching is available
   */
  private isCacheAvailable(): boolean {
    return this.client !== null && this.isConnected;
  }

  /**
   * Cache user permissions data
   */
  async cacheUserPermissions(userId: string, permissions: UserPermissions): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.isCacheAvailable()) return;

      const key = this.KEYS.USER_PERMISSIONS + userId;
      await this.client!.setEx(key, this.defaultTTL, JSON.stringify(permissions));
    } catch (error) {
      console.error('Failed to cache user permissions:', error);
    }
  }

  /**
   * Get cached user permissions
   */
  async getCachedUserPermissions(userId: string): Promise<UserPermissions | null> {
    try {
      await this.ensureInitialized();
      if (!this.isCacheAvailable()) return null;

      const key = this.KEYS.USER_PERMISSIONS + userId;
      const cached = await this.client!.get(key);
      return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached user permissions:', error);
      return null;
    }
  }

  /**
   * Cache user with role data
   */
  async cacheUserWithRole(userId: string, user: UserWithRole): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.isCacheAvailable()) return;

      const key = this.KEYS.USER_WITH_ROLE + userId;
      await this.client!.setEx(key, this.shortTTL, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to cache user with role:', error);
    }
  }

  /**
   * Get cached user with role data
   */
  async getCachedUserWithRole(userId: string): Promise<UserWithRole | null> {
    try {
      await this.ensureInitialized();
      if (!this.isCacheAvailable()) return null;

      const key = this.KEYS.USER_WITH_ROLE + userId;
      const cached = await this.client!.get(key);
      return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached user with role:', error);
      return null;
    }
  }

  /**
   * Cache user's access scope
   */
  async cacheAccessScope(userId: string, scope: AccessScope): Promise<void> {
    if (!this.isCacheAvailable()) return;

    try {
      const key = this.KEYS.ACCESS_SCOPE + userId;
      await this.client!.setEx(key, this.defaultTTL, JSON.stringify(scope));
    } catch (error) {
      console.error('Failed to cache access scope:', error);
    }
  }

  /**
   * Get cached user's access scope
   */
  async getCachedAccessScope(userId: string): Promise<AccessScope | null> {
    if (!this.isCacheAvailable()) return null;

    try {
      const key = this.KEYS.ACCESS_SCOPE + userId;
      const cached = await this.client!.get(key);
      return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached access scope:', error);
      return null;
    }
  }

  /**
   * Cache user's teams
   */
  async cacheUserTeams(userId: string, teams: Team[]): Promise<void> {
    if (!this.isCacheAvailable()) return;

    try {
      const key = this.KEYS.USER_TEAMS + userId;
      await this.client!.setEx(key, this.shortTTL, JSON.stringify(teams));
    } catch (error) {
      console.error('Failed to cache user teams:', error);
    }
  }

  /**
   * Get cached user's teams
   */
  async getCachedUserTeams(userId: string): Promise<Team[] | null> {
    if (!this.isCacheAvailable()) return null;

    try {
      const key = this.KEYS.USER_TEAMS + userId;
      const cached = await this.client!.get(key);
      return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached user teams:', error);
      return null;
    }
  }

  /**
   * Cache role data
   */
  async cacheRole(roleId: string, role: Role): Promise<void> {
    if (!this.isCacheAvailable()) return;

    try {
      const key = this.KEYS.ROLE_DATA + roleId;
      await this.client!.setEx(key, this.defaultTTL * 2, JSON.stringify(role)); // Roles change less frequently
    } catch (error) {
      console.error('Failed to cache role:', error);
    }
  }

  /**
   * Get cached role data
   */
  async getCachedRole(roleId: string): Promise<Role | null> {
    if (!this.isCacheAvailable()) return null;

    try {
      const key = this.KEYS.ROLE_DATA + roleId;
      const cached = await this.client!.get(key);
      return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached role:', error);
      return null;
    }
  }

  /**
   * Cache team data
   */
  async cacheTeam(teamId: string, team: Team): Promise<void> {
    if (!this.isCacheAvailable()) return;

    try {
      const key = this.KEYS.TEAM_DATA + teamId;
      await this.client!.setEx(key, this.defaultTTL, JSON.stringify(team));
    } catch (error) {
      console.error('Failed to cache team:', error);
    }
  }

  /**
   * Get cached team data
   */
  async getCachedTeam(teamId: string): Promise<Team | null> {
    if (!this.isCacheAvailable()) return null;

    try {
      const key = this.KEYS.TEAM_DATA + teamId;
      const cached = await this.client!.get(key);
      return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached team:', error);
      return null;
    }
  }

  /**
   * Cache team members list
   */
  async cacheTeamMembers(teamId: string, members: UserWithRole[]): Promise<void> {
    if (!this.isCacheAvailable()) return;

    try {
      const key = this.KEYS.TEAM_MEMBERS + teamId;
      await this.client!.setEx(key, this.shortTTL, JSON.stringify(members));
    } catch (error) {
      console.error('Failed to cache team members:', error);
    }
  }

  /**
   * Get cached team members
   */
  async getCachedTeamMembers(teamId: string): Promise<UserWithRole[] | null> {
    if (!this.isCacheAvailable()) return null;

    try {
      const key = this.KEYS.TEAM_MEMBERS + teamId;
      const cached = await this.client!.get(key);
      return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached team members:', error);
      return null;
    }
  }

  /**
   * Invalidate user-related cache entries
   */
  async invalidateUserCache(userId: string): Promise<void> {
    if (!this.isCacheAvailable()) return;

    try {
      const keys = [
        this.KEYS.USER_PERMISSIONS + userId,
        this.KEYS.USER_WITH_ROLE + userId,
        this.KEYS.ACCESS_SCOPE + userId,
        this.KEYS.USER_TEAMS + userId,
      ];

      await Promise.all(keys.map(key => this.client!.del(key)));
    } catch (error) {
      console.error('Failed to invalidate user cache:', error);
    }
  }

  /**
   * Invalidate team-related cache entries
   */
  async invalidateTeamCache(teamId: string): Promise<void> {
    if (!this.isCacheAvailable()) return;

    try {
      const keys = [
        this.KEYS.TEAM_DATA + teamId,
        this.KEYS.TEAM_MEMBERS + teamId,
      ];

      await Promise.all(keys.map(key => this.client!.del(key)));
    } catch (error) {
      console.error('Failed to invalidate team cache:', error);
    }
  }

  /**
   * Invalidate role-related cache entries
   */
  async invalidateRoleCache(roleId: string): Promise<void> {
    if (!this.isCacheAvailable()) return;

    try {
      const key = this.KEYS.ROLE_DATA + roleId;
      await this.client!.del(key);
    } catch (error) {
      console.error('Failed to invalidate role cache:', error);
    }
  }

  /**
   * Clear all RBAC cache entries
   */
  async clearAllCache(): Promise<void> {
    if (!this.isCacheAvailable()) return;

    try {
      const pattern = 'rbac:*';
      const keys = await this.client!.keys(pattern);
      
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ connected: boolean; keyCount: number } | null> {
    if (!this.isCacheAvailable()) return null;

    try {
      const keys = await this.client!.keys('rbac:*');
      return {
        connected: this.isConnected,
        keyCount: keys.length,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
      } catch (error) {
        console.error('Failed to disconnect Redis client:', error);
      }
    }
  }
}

// Export singleton instance
export const rbacCache = new RBACCache();