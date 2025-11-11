-- Performance optimization indexes for session validation
-- These indexes will significantly improve query performance

-- Composite index for session token lookup with expiry check
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_token_expires" 
ON "user_sessions" ("token", "expiresAt") 
WHERE "expiresAt" > NOW();

-- Index for user active status lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_id_active" 
ON "users" ("id", "isActive") 
WHERE "isActive" = true;

-- Index for role lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roles_id" 
ON "roles" ("id");

-- Index for team lookups  
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_teams_id" 
ON "teams" ("id");

-- Composite index for user sessions by userId and expiry (for cleanup operations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_userid_expires" 
ON "user_sessions" ("userId", "expiresAt");

-- Index for expired session cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_expires_cleanup" 
ON "user_sessions" ("expiresAt") 
WHERE "expiresAt" < NOW();