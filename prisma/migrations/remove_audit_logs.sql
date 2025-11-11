-- Remove audit log functionality
-- This migration removes the audit_logs table and related functionality

-- Drop dependent views first
DROP VIEW IF EXISTS "audit_log_summary_view";
DROP VIEW IF EXISTS "team_performance_view";
DROP VIEW IF EXISTS "role_usage_view";

-- Drop the audit_logs table
DROP TABLE IF EXISTS "audit_logs";