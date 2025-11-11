# Performance Optimization Guide

This document outlines the performance optimizations implemented for the ticket management system with RBAC.

## Overview

The system has been optimized for high performance with large data volumes through:
- Database indexing strategies
- Query optimization
- Caching implementation
- Performance monitoring
- Load testing

## Database Optimizations

### Indexes Added

#### Composite Indexes for Common Query Patterns
```sql
-- Ticket queries
CREATE INDEX idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX idx_tickets_team_status ON tickets(team_id, status);
CREATE INDEX idx_tickets_assignedto_status ON tickets(assigned_to, status);
CREATE INDEX idx_tickets_createdby_status ON tickets(created_by, status);
CREATE INDEX idx_tickets_createdat_status ON tickets(created_at DESC, status);

-- Analytics queries
CREATE INDEX idx_tickets_team_createdat ON tickets(team_id, created_at DESC);
CREATE INDEX idx_tickets_assignedto_createdat ON tickets(assigned_to, created_at DESC);

-- Partial indexes for resolved/closed tickets
CREATE INDEX idx_tickets_resolvedat ON tickets(resolved_at) WHERE resolved_at IS NOT NULL;
CREATE INDEX idx_tickets_closedat ON tickets(closed_at) WHERE closed_at IS NOT NULL;
```

#### Full-Text Search Indexes
```sql
-- Trigram indexes for fuzzy search
CREATE INDEX idx_tickets_title_trgm ON tickets USING gin(title gin_trgm_ops);
CREATE INDEX idx_tickets_description_trgm ON tickets USING gin(description gin_trgm_ops);
CREATE INDEX idx_kb_articles_title_trgm ON knowledge_base_articles USING gin(title gin_trgm_ops);
CREATE INDEX idx_kb_articles_content_trgm ON knowledge_base_articles USING gin(content gin_trgm_ops);
```

#### Notification Indexes
```sql
CREATE INDEX idx_notifications_user_isread_createdat ON notifications(user_id, is_read, created_at DESC);
```

#### Audit Log Indexes
```sql
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);
```

### Running the Optimization Script

```bash
# Run the database optimization script
npx ts-node scripts/optimize-performance.ts
```

This script will:
1. Add all necessary indexes
2. Analyze tables for query planner optimization
3. Provide recommendations for further optimization

## Query Optimization

### Optimized Query Patterns

The system uses optimized query patterns in `lib/db/optimized-queries.ts`:

#### Ticket List Queries
- Uses selective field loading to minimize data transfer
- Implements efficient pagination
- Executes count and data queries in parallel
- Includes only necessary relations

#### Analytics Queries
- Uses database aggregation functions
- Executes multiple metrics queries in parallel
- Leverages raw SQL for complex calculations
- Implements efficient date range filtering

#### Batch Operations
- Batch fetches users with roles
- Batch fetches tickets
- Bulk notification operations

### Query Best Practices

1. **Use Selective Field Loading**
   ```typescript
   // Good: Only select needed fields
   const tickets = await prisma.ticket.findMany({
     select: {
       id: true,
       title: true,
       status: true,
     },
   });

   // Avoid: Loading all fields
   const tickets = await prisma.ticket.findMany();
   ```

2. **Implement Pagination**
   ```typescript
   const tickets = await prisma.ticket.findMany({
     skip: (page - 1) * limit,
     take: limit,
   });
   ```

3. **Use Parallel Queries**
   ```typescript
   const [tickets, total] = await Promise.all([
     prisma.ticket.findMany({ ... }),
     prisma.ticket.count({ ... }),
   ]);
   ```

## Caching Strategy

### Cache Implementation

The system implements a multi-layer caching strategy in `lib/cache/query-cache.ts`:

#### Cache Layers

1. **User Permissions Cache** (TTL: 10 minutes)
   - User role and permissions
   - Team assignments
   - Access control data

2. **Ticket Data Cache** (TTL: 1 minute)
   - Ticket counts
   - Ticket lists
   - Frequently accessed tickets

3. **Analytics Cache** (TTL: 5 minutes)
   - Organization metrics
   - Team metrics
   - Agent performance data

4. **Knowledge Base Cache** (TTL: 30 minutes)
   - Article content
   - Search results (5 minutes)
   - Category data

### Using the Cache

```typescript
import { queryCache, getCachedUserPermissions } from '@/lib/cache/query-cache';

// Cache a query result
const data = await queryCache.getOrSet(
  'unique-key',
  async () => {
    // Your query here
    return await prisma.ticket.findMany();
  },
  { ttl: 300 } // 5 minutes
);

// Invalidate cache
await queryCache.invalidate('unique-key');

// Invalidate by pattern
await queryCache.invalidatePattern('user:*');
```

### Cache Invalidation

Cache is automatically invalidated on:
- Ticket creation/update/deletion
- User role changes
- Team assignment changes
- Permission updates
- Analytics data changes

## Performance Monitoring

### Monitoring Tools

The system includes performance monitoring in `lib/monitoring/performance-metrics.ts`:

#### Tracked Metrics

1. **Slow Queries**
   - Queries exceeding 1 second
   - Query execution times
   - User context

2. **API Endpoint Performance**
   - Request duration
   - Throughput
   - Average/min/max response times

3. **Cache Performance**
   - Cache hit rate
   - Cache misses
   - Cache effectiveness

4. **Database Metrics**
   - Connection pool stats
   - Table sizes
   - Index usage
   - Cache hit ratio

### Using Performance Monitoring

```typescript
import { performanceMonitor } from '@/lib/monitoring/performance-metrics';

// Track a query
const result = await performanceMonitor.trackQuery(
  'getTickets',
  async () => {
    return await prisma.ticket.findMany();
  },
  userId
);

// Get metrics
const metrics = await performanceMonitor.getMetrics();
console.log('Cache Hit Rate:', metrics.cacheHitRate);
console.log('Slow Queries:', metrics.slowQueries);
```

### Database Performance Analysis

```bash
# Analyze database performance
npx ts-node -e "
  import { analyzeDatabasePerformance } from './lib/monitoring/performance-metrics';
  analyzeDatabasePerformance();
"
```

This will show:
- Largest tables
- Unused indexes
- Cache hit ratio
- Most accessed tables
- Slowest queries

## Performance Testing

### Running Performance Tests

```bash
# Run comprehensive performance tests
npx ts-node scripts/test-performance.ts
```

The test suite includes:
1. Ticket list query performance
2. Ticket detail query with relations
3. Search query performance
4. User permission queries
5. Team ticket queries
6. Notification queries
7. Knowledge base search
8. Analytics aggregations
9. Ticket history queries
10. Bulk insert operations
11. Complex join queries
12. Concurrent query handling

### Performance Targets

| Operation | Target Throughput | Notes |
|-----------|------------------|-------|
| Ticket List | 100 records/sec | With pagination |
| Ticket Detail | 5 records/sec | With all relations |
| Search | 50 records/sec | Full-text search |
| User Permissions | 50 records/sec | With role data |
| Notifications | 100 records/sec | User notifications |
| KB Search | 30 records/sec | Full-text search |
| Bulk Insert | 100 records/sec | Batch operations |
| Concurrent Queries | 50 records/sec | 10 parallel queries |

## Optimization Recommendations

### Short-term Improvements

1. **Enable Redis Caching**
   - Install Redis server
   - Configure Redis connection
   - Enable query result caching

2. **Database Connection Pooling**
   - Configure Prisma connection pool
   - Set appropriate pool size
   - Monitor connection usage

3. **Query Optimization**
   - Monitor slow queries
   - Add indexes as needed
   - Optimize N+1 queries

### Long-term Improvements

1. **Read Replicas**
   - Set up read replicas for analytics
   - Route read queries to replicas
   - Reduce load on primary database

2. **Data Partitioning**
   - Partition tickets by date
   - Archive old tickets
   - Implement hot/cold data separation

3. **Microservices Architecture**
   - Separate analytics service
   - Dedicated notification service
   - Event-driven architecture

4. **CDN for Static Assets**
   - Cache knowledge base articles
   - Serve attachments via CDN
   - Reduce server load

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Response Times**
   - API endpoint latency
   - Database query times
   - Cache response times

2. **Throughput**
   - Requests per second
   - Queries per second
   - Cache operations per second

3. **Resource Usage**
   - Database connections
   - Memory usage
   - CPU utilization

4. **Error Rates**
   - Failed queries
   - Cache errors
   - API errors

### Setting Up Alerts

Configure alerts for:
- Response time > 2 seconds
- Cache hit rate < 80%
- Database connection pool > 80% utilized
- Error rate > 1%
- Slow query count > 10 per minute

## Best Practices

### Development

1. **Always use indexes for filtered columns**
2. **Implement pagination for large result sets**
3. **Use selective field loading**
4. **Cache frequently accessed data**
5. **Monitor query performance**

### Production

1. **Enable query logging**
2. **Monitor slow queries**
3. **Track cache hit rates**
4. **Analyze database performance regularly**
5. **Review and optimize indexes**
6. **Implement connection pooling**
7. **Use read replicas for analytics**

## Troubleshooting

### Slow Queries

1. Check if indexes exist
2. Analyze query execution plan
3. Consider adding composite indexes
4. Optimize WHERE clauses
5. Reduce JOIN complexity

### Low Cache Hit Rate

1. Increase cache TTL
2. Warm up cache on startup
3. Review cache invalidation strategy
4. Monitor cache size
5. Consider cache preloading

### High Database Load

1. Enable connection pooling
2. Implement read replicas
3. Optimize slow queries
4. Increase cache usage
5. Consider data archival

## Conclusion

The performance optimizations implemented provide:
- Fast query execution with proper indexing
- Reduced database load through caching
- Comprehensive monitoring and alerting
- Scalability for large data volumes
- Tools for ongoing optimization

Regular monitoring and optimization are essential for maintaining optimal performance as the system grows.
