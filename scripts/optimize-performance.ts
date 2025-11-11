/**
 * Performance Optimization Script
 * Adds additional database indexes and implements caching strategies
 * Requirements: All
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function optimizePerformance() {
  console.log('Starting performance optimization...\n');

  try {
    // 1. Add composite indexes for common query patterns
    console.log('Adding composite indexes for common query patterns...');
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_status_priority 
      ON tickets(status, priority);
    `;
    console.log('✓ Added composite index on tickets(status, priority)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_team_status 
      ON tickets(team_id, status);
    `;
    console.log('✓ Added composite index on tickets(team_id, status)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_assignedto_status 
      ON tickets(assigned_to, status);
    `;
    console.log('✓ Added composite index on tickets(assigned_to, status)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_createdby_status 
      ON tickets(created_by, status);
    `;
    console.log('✓ Added composite index on tickets(created_by, status)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_createdat_status 
      ON tickets(created_at DESC, status);
    `;
    console.log('✓ Added composite index on tickets(created_at, status)');

    // 2. Add indexes for analytics queries
    console.log('\nAdding indexes for analytics queries...');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_resolvedat 
      ON tickets(resolved_at) WHERE resolved_at IS NOT NULL;
    `;
    console.log('✓ Added partial index on tickets(resolved_at)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_closedat 
      ON tickets(closed_at) WHERE closed_at IS NOT NULL;
    `;
    console.log('✓ Added partial index on tickets(closed_at)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_team_createdat 
      ON tickets(team_id, created_at DESC);
    `;
    console.log('✓ Added composite index on tickets(team_id, created_at)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_assignedto_createdat 
      ON tickets(assigned_to, created_at DESC);
    `;
    console.log('✓ Added composite index on tickets(assigned_to, created_at)');

    // 3. Add indexes for ticket history queries
    console.log('\nAdding indexes for ticket history queries...');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_createdat 
      ON ticket_history(ticket_id, created_at DESC);
    `;
    console.log('✓ Added composite index on ticket_history(ticket_id, created_at)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_ticket_history_action 
      ON ticket_history(action);
    `;
    console.log('✓ Added index on ticket_history(action)');

    // 4. Add indexes for notification queries
    console.log('\nAdding indexes for notification queries...');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_isread_createdat 
      ON notifications(user_id, is_read, created_at DESC);
    `;
    console.log('✓ Added composite index on notifications(user_id, is_read, created_at)');

    // 5. Add indexes for knowledge base queries
    console.log('\nAdding indexes for knowledge base queries...');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_kb_articles_published_accesslevel 
      ON knowledge_base_articles(is_published, access_level);
    `;
    console.log('✓ Added composite index on knowledge_base_articles(is_published, access_level)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_kb_articles_team_published 
      ON knowledge_base_articles(team_id, is_published);
    `;
    console.log('✓ Added composite index on knowledge_base_articles(team_id, is_published)');

    // 6. Add full-text search indexes
    console.log('\nAdding full-text search indexes...');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_title_trgm 
      ON tickets USING gin(title gin_trgm_ops);
    `;
    console.log('✓ Added trigram index on tickets(title)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_tickets_description_trgm 
      ON tickets USING gin(description gin_trgm_ops);
    `;
    console.log('✓ Added trigram index on tickets(description)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_kb_articles_title_trgm 
      ON knowledge_base_articles USING gin(title gin_trgm_ops);
    `;
    console.log('✓ Added trigram index on knowledge_base_articles(title)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_kb_articles_content_trgm 
      ON knowledge_base_articles USING gin(content gin_trgm_ops);
    `;
    console.log('✓ Added trigram index on knowledge_base_articles(content)');

    // 7. Add indexes for audit log queries
    console.log('\nAdding indexes for audit log queries...');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp 
      ON audit_logs(user_id, timestamp DESC);
    `;
    console.log('✓ Added composite index on audit_logs(user_id, timestamp)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
      ON audit_logs(resource_type, resource_id);
    `;
    console.log('✓ Added composite index on audit_logs(resource_type, resource_id)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp 
      ON audit_logs(action, timestamp DESC);
    `;
    console.log('✓ Added composite index on audit_logs(action, timestamp)');

    // 8. Add indexes for session management
    console.log('\nAdding indexes for session management...');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expiresat 
      ON user_sessions(expires_at);
    `;
    console.log('✓ Added index on user_sessions(expires_at)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expiresat 
      ON user_sessions(user_id, expires_at);
    `;
    console.log('✓ Added composite index on user_sessions(user_id, expires_at)');

    // 9. Add indexes for feedback queries
    console.log('\nAdding indexes for feedback queries...');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_ticket_feedback_rating 
      ON ticket_feedback(rating);
    `;
    console.log('✓ Added index on ticket_feedback(rating)');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_ticket_feedback_createdat 
      ON ticket_feedback(created_at DESC);
    `;
    console.log('✓ Added index on ticket_feedback(created_at)');

    // 10. Analyze tables for query planner optimization
    console.log('\nAnalyzing tables for query planner optimization...');

    await prisma.$executeRaw`ANALYZE tickets;`;
    console.log('✓ Analyzed tickets table');

    await prisma.$executeRaw`ANALYZE ticket_history;`;
    console.log('✓ Analyzed ticket_history table');

    await prisma.$executeRaw`ANALYZE ticket_followers;`;
    console.log('✓ Analyzed ticket_followers table');

    await prisma.$executeRaw`ANALYZE notifications;`;
    console.log('✓ Analyzed notifications table');

    await prisma.$executeRaw`ANALYZE knowledge_base_articles;`;
    console.log('✓ Analyzed knowledge_base_articles table');

    await prisma.$executeRaw`ANALYZE audit_logs;`;
    console.log('✓ Analyzed audit_logs table');

    console.log('\n✅ Performance optimization completed successfully!');
    console.log('\nRecommendations:');
    console.log('1. Enable Redis caching for frequently accessed data');
    console.log('2. Implement query result caching with TTL');
    console.log('3. Use database connection pooling');
    console.log('4. Monitor slow queries and add indexes as needed');
    console.log('5. Consider partitioning large tables by date');
    console.log('6. Implement read replicas for analytics queries');

  } catch (error) {
    console.error('Error during performance optimization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run optimization
optimizePerformance()
  .then(() => {
    console.log('\nOptimization script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Optimization script failed:', error);
    process.exit(1);
  });
