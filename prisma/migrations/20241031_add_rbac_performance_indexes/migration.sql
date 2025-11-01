-- Add performance indexes for RBAC operations

-- User table indexes for role and team lookups
CREATE INDEX IF NOT EXISTS "idx_users_role_id" ON "users"("roleId");
CREATE INDEX IF NOT EXISTS "idx_users_team_id" ON "users"("teamId");
CREATE INDEX IF NOT EXISTS "idx_users_is_active" ON "users"("isActive");
CREATE INDEX IF NOT EXISTS "idx_users_role_team" ON "users"("roleId", "teamId");

-- User sessions indexes for active session lookups
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "user_sessions"("userId");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires_at" ON "user_sessions"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_expires" ON "user_sessions"("userId", "expiresAt");

-- Team leaders indexes for team management queries
CREATE INDEX IF NOT EXISTS "idx_team_leaders_user_id" ON "team_leaders"("userId");
CREATE INDEX IF NOT EXISTS "idx_team_leaders_team_id" ON "team_leaders"("teamId");

-- User roles indexes for many-to-many role assignments
CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id" ON "user_roles"("userId");
CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id" ON "user_roles"("roleId");

-- Role permissions indexes for permission lookups
CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions"("roleId");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions"("permissionId");

-- Audit logs indexes for security monitoring and reporting
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_timestamp" ON "audit_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_resource" ON "audit_logs"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_action_time" ON "audit_logs"("userId", "action", "timestamp");

-- Tickets indexes for assignment and team-based filtering
CREATE INDEX IF NOT EXISTS "idx_tickets_assigned_to" ON "tickets"("assignedTo");
CREATE INDEX IF NOT EXISTS "idx_tickets_status" ON "tickets"("status");
CREATE INDEX IF NOT EXISTS "idx_tickets_priority" ON "tickets"("priority");
CREATE INDEX IF NOT EXISTS "idx_tickets_customer_status" ON "tickets"("customerId", "status");

-- Comments indexes for ticket-based queries
CREATE INDEX IF NOT EXISTS "idx_comments_ticket_id" ON "comments"("ticketId");
CREATE INDEX IF NOT EXISTS "idx_comments_author_id" ON "comments"("authorId");
CREATE INDEX IF NOT EXISTS "idx_comments_created_at" ON "comments"("createdAt");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_users_active_role_team" ON "users"("isActive", "roleId", "teamId");
CREATE INDEX IF NOT EXISTS "idx_tickets_assigned_status_priority" ON "tickets"("assignedTo", "status", "priority");