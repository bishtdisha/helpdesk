-- Seed initial data for testing the helpdesk system
-- This script creates sample organizations, users, teams, and tickets

-- Insert sample organization
INSERT INTO organizations (id, name, domain, email, timezone) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Acme Corporation', 'acme.com', 'admin@acme.com', 'America/New_York')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users with different roles
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, status, email_verified_at) VALUES 
-- Admin user
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'admin@acme.com', 'hashed_password', 'John', 'Admin', 'admin', 'active', NOW()),
-- Manager user
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'manager@acme.com', 'hashed_password', 'Jane', 'Manager', 'manager', 'active', NOW()),
-- Team leader
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'teamlead@acme.com', 'hashed_password', 'Bob', 'Leader', 'team_leader', 'active', NOW()),
-- Regular users
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'user1@acme.com', 'hashed_password', 'Alice', 'Smith', 'user', 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'user2@acme.com', 'hashed_password', 'Charlie', 'Brown', 'user', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample teams
INSERT INTO teams (id, organization_id, name, description, team_leader_id) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Support Team', 'Customer support and technical assistance', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Development Team', 'Software development and maintenance', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO NOTHING;

-- Insert team members
INSERT INTO team_members (team_id, user_id) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (id, organization_id, email, first_name, last_name, company) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', 'customer1@example.com', 'David', 'Wilson', 'Example Corp'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', 'customer2@example.com', 'Sarah', 'Johnson', 'Test Industries')
ON CONFLICT (id) DO NOTHING;

-- Insert ticket categories
INSERT INTO ticket_categories (id, organization_id, name, description, color) VALUES 
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'Technical Support', 'Technical issues and troubleshooting', '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', 'Bug Report', 'Software bugs and issues', '#EF4444'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', 'Feature Request', 'New feature requests', '#10B981')
ON CONFLICT (id) DO NOTHING;

-- Insert SLA policies
INSERT INTO sla_policies (id, organization_id, name, description, response_time_hours, resolution_time_hours, priority) VALUES 
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', 'Standard SLA', 'Standard response and resolution times', 24, 72, 'medium'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', 'Priority SLA', 'Fast response for high priority tickets', 4, 24, 'high'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440000', 'Urgent SLA', 'Immediate response for urgent issues', 1, 8, 'urgent')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tickets
INSERT INTO tickets (id, organization_id, subject, description, priority, status, category_id, sla_policy_id, customer_id, assigned_to_user_id, assigned_to_team_id, created_by_user_id) VALUES 
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', 'Login Issues', 'Customer cannot log into the system', 'high', 'open', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440000', 'Feature Request: Dark Mode', 'Please add dark mode to the application', 'low', 'new', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440021', NULL, '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440000', 'System Crash', 'Application crashes when uploading files', 'urgent', 'pending', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO NOTHING;

-- Insert sample ticket comments
INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal) VALUES 
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440004', 'I have started investigating this issue. Will update soon.', true),
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440004', 'Hi, we are looking into your login issue. Can you please try clearing your browser cache?', false),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440005', 'This appears to be related to file size limits. Investigating further.', true);

-- Insert knowledge base categories
INSERT INTO kb_categories (id, organization_id, name, description) VALUES 
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440000', 'Getting Started', 'Basic setup and configuration guides'),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440000', 'Troubleshooting', 'Common issues and solutions'),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440000', 'Advanced Features', 'Advanced functionality and customization')
ON CONFLICT (id) DO NOTHING;

-- Insert sample knowledge base articles
INSERT INTO kb_articles (id, organization_id, category_id, title, content, summary, status, author_id, published_at) VALUES 
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440060', 'How to Reset Your Password', 'Step-by-step guide to reset your password...', 'Learn how to reset your password', 'published', '550e8400-e29b-41d4-a716-446655440002', NOW()),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440061', 'Common Login Issues', 'Solutions for common login problems...', 'Troubleshoot login problems', 'published', '550e8400-e29b-41d4-a716-446655440003', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (organization_id, setting_key, setting_value, setting_type, description) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'company_name', 'Acme Corporation', 'string', 'Company display name'),
('550e8400-e29b-41d4-a716-446655440000', 'default_sla_policy', '550e8400-e29b-41d4-a716-446655440040', 'uuid', 'Default SLA policy for new tickets'),
('550e8400-e29b-41d4-a716-446655440000', 'auto_assign_tickets', 'true', 'boolean', 'Automatically assign tickets to team members')
ON CONFLICT (organization_id, setting_key) DO NOTHING;
