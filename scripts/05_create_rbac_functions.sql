-- Creating RBAC functions and triggers
-- Role-based access control functions and security policies

-- Function to check if user has access to organization
CREATE OR REPLACE FUNCTION user_has_org_access(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_uuid 
        AND organization_id = org_uuid 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has team access
CREATE OR REPLACE FUNCTION user_has_team_access(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Get user role
    SELECT role INTO user_role_val FROM users WHERE id = user_uuid;
    
    -- Admin and Manager have access to all teams
    IF user_role_val IN ('admin', 'manager') THEN
        RETURN TRUE;
    END IF;
    
    -- Team leaders have access to their own teams
    IF user_role_val = 'team_leader' THEN
        RETURN EXISTS (
            SELECT 1 FROM teams 
            WHERE id = team_uuid 
            AND team_leader_id = user_uuid
        );
    END IF;
    
    -- Regular users have access to teams they're members of
    RETURN EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_id = team_uuid 
        AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access ticket
CREATE OR REPLACE FUNCTION user_can_access_ticket(user_uuid UUID, ticket_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
    ticket_assigned_user UUID;
    ticket_assigned_team UUID;
    ticket_org UUID;
    user_org UUID;
BEGIN
    -- Get user role and organization
    SELECT role, organization_id INTO user_role_val, user_org 
    FROM users WHERE id = user_uuid;
    
    -- Get ticket details
    SELECT assigned_to_user_id, assigned_to_team_id, organization_id 
    INTO ticket_assigned_user, ticket_assigned_team, ticket_org
    FROM tickets WHERE id = ticket_uuid;
    
    -- Check if user belongs to same organization
    IF user_org != ticket_org THEN
        RETURN FALSE;
    END IF;
    
    -- Admin and Manager have access to all tickets in their org
    IF user_role_val IN ('admin', 'manager') THEN
        RETURN TRUE;
    END IF;
    
    -- Team leaders have access to tickets assigned to their teams
    IF user_role_val = 'team_leader' AND ticket_assigned_team IS NOT NULL THEN
        RETURN user_has_team_access(user_uuid, ticket_assigned_team);
    END IF;
    
    -- Users have access to tickets assigned to them
    IF ticket_assigned_user = user_uuid THEN
        RETURN TRUE;
    END IF;
    
    -- Users have access to tickets assigned to their teams
    IF ticket_assigned_team IS NOT NULL THEN
        RETURN user_has_team_access(user_uuid, ticket_assigned_team);
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number(org_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    org_prefix VARCHAR(10);
    ticket_count INTEGER;
    ticket_number VARCHAR(50);
BEGIN
    -- Get organization prefix (first 3 chars of name, uppercase)
    SELECT UPPER(LEFT(REPLACE(name, ' ', ''), 3)) INTO org_prefix
    FROM organizations WHERE id = org_uuid;
    
    -- Get current ticket count for organization
    SELECT COUNT(*) + 1 INTO ticket_count
    FROM tickets WHERE organization_id = org_uuid;
    
    -- Generate ticket number: ORG-YYYYMMDD-NNNN
    ticket_number := org_prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(ticket_count::TEXT, 4, '0');
    
    RETURN ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number(NEW.organization_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ticket number generation
DROP TRIGGER IF EXISTS trigger_set_ticket_number ON tickets;
CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables with updated_at
CREATE TRIGGER trigger_update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
