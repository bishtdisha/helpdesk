-- Create database views for complex RBAC permission queries

-- View: User permissions with role and team information
CREATE OR REPLACE VIEW "user_permissions_view" AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u."isActive" as is_active,
    r.id as role_id,
    r.name as role_name,
    r.permissions as role_permissions,
    t.id as team_id,
    t.name as team_name,
    -- Team leadership information
    CASE WHEN tl.id IS NOT NULL THEN true ELSE false END as is_team_leader,
    array_agg(DISTINCT tl_teams.id) FILTER (WHERE tl_teams.id IS NOT NULL) as led_team_ids,
    array_agg(DISTINCT tl_teams.name) FILTER (WHERE tl_teams.name IS NOT NULL) as led_team_names,
    u."createdAt",
    u."updatedAt"
FROM users u
LEFT JOIN roles r ON u."roleId" = r.id
LEFT JOIN teams t ON u."teamId" = t.id
LEFT JOIN team_leaders tl ON u.id = tl."userId"
LEFT JOIN teams tl_teams ON tl."teamId" = tl_teams.id
GROUP BY u.id, u.email, u.name, u."isActive", r.id, r.name, r.permissions, 
         t.id, t.name, tl.id, u."createdAt", u."updatedAt";

-- View: Team members with role information
CREATE OR REPLACE VIEW "team_members_view" AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.description as team_description,
    u.id as user_id,
    u.email as user_email,
    u.name as user_name,
    u."isActive" as user_is_active,
    r.id as role_id,
    r.name as role_name,
    -- Check if user is a leader of this team
    CASE WHEN tl.id IS NOT NULL THEN true ELSE false END as is_leader,
    tl."assignedAt" as leader_assigned_at,
    COUNT(u.id) OVER (PARTITION BY t.id) as total_team_members,
    COUNT(tl.id) OVER (PARTITION BY t.id) as total_team_leaders
FROM teams t
LEFT JOIN users u ON t.id = u."teamId" AND u."isActive" = true
LEFT JOIN roles r ON u."roleId" = r.id
LEFT JOIN team_leaders tl ON u.id = tl."userId" AND t.id = tl."teamId"
ORDER BY t.name, r.name, u.name;

-- View: User access scope summary
CREATE OR REPLACE VIEW "user_access_scope_view" AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    r.name as role_name,
    -- Access scope based on role
    CASE 
        WHEN r.name = 'Admin/Manager' THEN 'organization'
        WHEN r.name = 'Team Leader' THEN 'team'
        WHEN r.name = 'User/Employee' THEN 'self'
        ELSE 'none'
    END as access_scope,
    -- Team access
    u."teamId" as primary_team_id,
    t.name as primary_team_name,
    array_agg(DISTINCT tl."teamId") FILTER (WHERE tl."teamId" IS NOT NULL) as led_team_ids,
    -- Permission flags based on role
    CASE WHEN r.name = 'Admin/Manager' THEN true ELSE false END as can_manage_users,
    CASE WHEN r.name IN ('Admin/Manager', 'Team Leader') THEN true ELSE false END as can_view_team_users,
    CASE WHEN r.name = 'Admin/Manager' THEN true ELSE false END as can_manage_teams,
    CASE WHEN r.name IN ('Admin/Manager', 'Team Leader') THEN true ELSE false END as can_view_team_data,
    -- Audit permissions
    CASE WHEN r.name = 'Admin/Manager' THEN true ELSE false END as can_view_audit_logs,
    CASE WHEN r.name IN ('Admin/Manager', 'Team Leader') THEN true ELSE false END as can_view_team_analytics
FROM users u
LEFT JOIN roles r ON u."roleId" = r.id
LEFT JOIN teams t ON u."teamId" = t.id
LEFT JOIN team_leaders tl ON u.id = tl."userId"
WHERE u."isActive" = true
GROUP BY u.id, u.email, u.name, r.name, u."teamId", t.name;

-- View: Audit log summary with user and resource information
CREATE OR REPLACE VIEW "audit_log_summary_view" AS
SELECT 
    al.id as audit_id,
    al.action,
    al."resourceType" as resource_type,
    al."resourceId" as resource_id,
    al.success,
    al.timestamp,
    al."ipAddress" as ip_address,
    -- User information
    u.id as user_id,
    u.email as user_email,
    u.name as user_name,
    r.name as user_role,
    t.name as user_team,
    -- Additional context
    al.details,
    -- Time-based grouping for analytics
    DATE(al.timestamp) as audit_date,
    EXTRACT(hour FROM al.timestamp) as audit_hour,
    EXTRACT(dow FROM al.timestamp) as day_of_week
FROM audit_logs al
LEFT JOIN users u ON al."userId" = u.id
LEFT JOIN roles r ON u."roleId" = r.id
LEFT JOIN teams t ON u."teamId" = t.id
ORDER BY al.timestamp DESC;

-- View: Team performance metrics
CREATE OR REPLACE VIEW "team_performance_view" AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.description as team_description,
    -- Member counts
    COUNT(DISTINCT u.id) as total_members,
    COUNT(DISTINCT tl.id) as total_leaders,
    COUNT(DISTINCT CASE WHEN u."isActive" = true THEN u.id END) as active_members,
    -- Ticket metrics (if tickets are assigned to team members)
    COUNT(DISTINCT tk.id) as total_assigned_tickets,
    COUNT(DISTINCT CASE WHEN tk.status = 'OPEN' THEN tk.id END) as open_tickets,
    COUNT(DISTINCT CASE WHEN tk.status = 'IN_PROGRESS' THEN tk.id END) as in_progress_tickets,
    COUNT(DISTINCT CASE WHEN tk.status = 'RESOLVED' THEN tk.id END) as resolved_tickets,
    -- Activity metrics
    COUNT(DISTINCT al.id) as total_audit_entries,
    MAX(al.timestamp) as last_activity,
    -- Team creation info
    t."createdAt" as team_created_at,
    t."updatedAt" as team_updated_at
FROM teams t
LEFT JOIN users u ON t.id = u."teamId"
LEFT JOIN team_leaders tl ON t.id = tl."teamId"
LEFT JOIN tickets tk ON u.id = tk."assignedTo"
LEFT JOIN audit_logs al ON u.id = al."userId"
GROUP BY t.id, t.name, t.description, t."createdAt", t."updatedAt"
ORDER BY t.name;

-- View: Role usage statistics
CREATE OR REPLACE VIEW "role_usage_view" AS
SELECT 
    r.id as role_id,
    r.name as role_name,
    r.description as role_description,
    -- User counts
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u."isActive" = true THEN u.id END) as active_users,
    -- Team distribution
    COUNT(DISTINCT u."teamId") as teams_with_role,
    -- Activity metrics
    COUNT(DISTINCT al.id) as total_audit_entries,
    MAX(al.timestamp) as last_activity,
    -- Role creation info
    r."createdAt" as role_created_at,
    r."updatedAt" as role_updated_at
FROM roles r
LEFT JOIN users u ON r.id = u."roleId"
LEFT JOIN audit_logs al ON u.id = al."userId"
GROUP BY r.id, r.name, r.description, r."createdAt", r."updatedAt"
ORDER BY total_users DESC;