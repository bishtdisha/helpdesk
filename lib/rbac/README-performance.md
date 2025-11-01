# RBAC Performance Optimizations

This document describes the performance optimizations implemented for the RBAC system.

## Overview

The RBAC system includes several performance optimizations:

1. **Redis Caching** - Caches frequently accessed user permissions and role data
2. **Database Indexes** - Optimized indexes for common query patterns
3. **Database Views** - Pre-computed views for complex permission queries
4. **Pagination** - Efficient pagination for large datasets
5. **Bulk Operations** - Optimized bulk update operations

## Redis Caching

### Configuration

Add the following environment variable to your `.env` file:

```env
# Redis connection string for RBAC caching
REDIS_URL=redis://localhost:6379
# or
REDIS_CONNECTION_STRING=redis://localhost:6379
```

### Cached Data

The system caches the following data types:

- **User Permissions** (`rbac:user_permissions:{userId}`) - TTL: 1 hour
- **User with Role** (`rbac:user_with_role:{userId}`) - TTL: 5 minutes
- **Access Scope** (`rbac:access_scope:{userId}`) - TTL: 1 hour
- **User Teams** (`rbac:user_teams:{userId}`) - TTL: 5 minutes
- **Role Data** (`rbac:role:{roleId}`) - TTL: 2 hours
- **Team Data** (`rbac:team:{teamId}`) - TTL: 1 hour
- **Team Members** (`rbac:team_members:{teamId}`) - TTL: 5 minutes

### Cache Invalidation

Cache is automatically invalidated when:

- User role assignments change
- Team assignments change
- Team leadership changes
- User status changes (active/inactive)

### Fallback Behavior

If Redis is not available or configured:
- The system will log warnings but continue to function
- All operations will fall back to direct database queries
- No caching will be performed

## Database Indexes

The following indexes are created for optimal performance:

### User Table Indexes
- `idx_users_role_id` - Role-based user lookups
- `idx_users_team_id` - Team-based user lookups
- `idx_users_is_active` - Active user filtering
- `idx_users_role_team` - Combined role and team queries
- `idx_users_active_role_team` - Active users with role and team

### Session Management Indexes
- `idx_user_sessions_user_id` - User session lookups
- `idx_user_sessions_expires_at` - Session expiration cleanup
- `idx_user_sessions_active` - Active session queries

### RBAC Relationship Indexes
- `idx_team_leaders_user_id` - Team leadership queries
- `idx_team_leaders_team_id` - Team-based leadership lookups
- `idx_user_roles_user_id` - User role assignments
- `idx_user_roles_role_id` - Role-based user queries
- `idx_role_permissions_role_id` - Role permission lookups

### Audit Log Indexes
- `idx_audit_logs_user_id` - User activity tracking
- `idx_audit_logs_timestamp` - Time-based audit queries
- `idx_audit_logs_action` - Action-based filtering
- `idx_audit_logs_resource` - Resource-based audit queries
- `idx_audit_logs_user_action_time` - Combined user activity queries

## Database Views

Several database views are created for complex queries:

### user_permissions_view
Combines user, role, and team information with leadership data for efficient permission checking.

### team_members_view
Provides team membership information with role details and leadership flags.

### user_access_scope_view
Pre-computes user access scopes based on roles and team assignments.

### audit_log_summary_view
Enriched audit log data with user and resource information for reporting.

### team_performance_view
Team metrics including member counts, ticket assignments, and activity data.

### role_usage_view
Role usage statistics and distribution across teams.

## Pagination

### Default Settings
- Default page size: 20 items
- Maximum page size: 100 items
- Default sort: `createdAt DESC`

### Usage Example

```typescript
import { optimizedUserService } from '@/lib/rbac';

// Get paginated users
const result = await optimizedUserService.getUsers(
  requesterId,
  {
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc'
  },
  {
    search: 'john',
    roleId: 'role-123',
    isActive: true
  }
);

console.log(result.data); // Array of users
console.log(result.pagination); // Pagination metadata
```

### Supported Sort Fields

#### Users
- `name` - User name
- `email` - User email
- `created` - Creation date
- `updated` - Last update
- `role` - Role name
- `team` - Team name
- `lastLogin` - Last login date

#### Teams
- `name` - Team name
- `created` - Creation date
- `updated` - Last update
- `memberCount` - Number of members

#### Audit Logs
- `timestamp` - Log timestamp
- `action` - Action performed
- `resourceType` - Resource type
- `success` - Success status

## Performance Monitoring

### Cache Statistics

```typescript
import { rbacCache } from '@/lib/rbac';

const stats = await rbacCache.getCacheStats();
console.log(stats); // { connected: true, keyCount: 150 }
```

### Database Query Optimization

The system uses several optimization techniques:

1. **Selective Includes** - Only includes necessary related data
2. **Parallel Queries** - Executes count and data queries in parallel
3. **Batch Operations** - Processes bulk operations in batches
4. **View-Based Queries** - Uses database views for complex aggregations

## Migration Commands

To apply the performance optimizations:

```bash
# Apply database indexes
npx prisma db execute --file ./prisma/migrations/20241031_add_rbac_performance_indexes/migration.sql

# Apply database views
npx prisma db execute --file ./prisma/migrations/20241031_add_rbac_views/migration.sql
```

## Monitoring and Maintenance

### Cache Maintenance

```typescript
// Clear all RBAC cache
await rbacCache.clearAllCache();

// Invalidate specific user cache
await rbacCache.invalidateUserCache(userId);

// Invalidate team cache
await rbacCache.invalidateTeamCache(teamId);
```

### Performance Metrics

Monitor the following metrics:

- Cache hit ratio
- Average query response time
- Database connection pool usage
- Redis memory usage
- Audit log growth rate

### Recommended Monitoring

1. Set up alerts for cache connection failures
2. Monitor database query performance
3. Track audit log storage growth
4. Monitor Redis memory usage
5. Set up performance dashboards

## Troubleshooting

### Common Issues

1. **Redis Connection Failures**
   - Check Redis server status
   - Verify connection string
   - Check network connectivity

2. **Slow Query Performance**
   - Verify indexes are created
   - Check query execution plans
   - Monitor database load

3. **Cache Invalidation Issues**
   - Check cache invalidation logic
   - Verify event triggers
   - Monitor cache consistency

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=rbac:*
```

This will log cache operations, query performance, and invalidation events.