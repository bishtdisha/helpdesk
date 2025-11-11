# Ticket Management System with RBAC Design

## Overview

This design extends the existing RBAC user management system to implement a comprehensive ticket management platform with role-based access control. The system enforces hierarchical permissions across three user roles (Admin/Manager, Team Leader, User/Employee) for ticket operations, analytics, reporting, knowledge base access, and notifications. The design leverages the existing authentication, permission engine, and caching infrastructure while adding ticket-specific components.

## Architecture

### Core Components

1. **Ticket Management Service**: Handles CRUD operations for tickets with role-based filtering
2. **Ticket Assignment Engine**: Manages ticket routing to teams and individual agents
3. **Follower Management System**: Handles ticket follower relationships and notifications
4. **Analytics Service**: Provides role-scoped performance metrics and reporting
5. **Knowledge Base Service**: Manages article access based on user roles and team context
6. **Notification Service**: Delivers real-time updates for ticket events
7. **Audit Service**: Tracks all ticket operations for compliance and accountability
8. **SLA Management System**: Monitors and enforces service level agreements
9. **Escalation Engine**: Automates ticket escalation based on configurable rules

### Integration with Existing RBAC

The design builds upon the existing RBAC infrastructure:
- Uses existing `Permission Engine` for authorization checks
- Extends `ROLE_PERMISSIONS` matrix with ticket-specific permissions
- Leverages existing `User`, `Role`, `Team`, and `TeamLeader` models
- Utilizes existing session management and caching systems
- Extends existing API middleware patterns for ticket endpoints

## Database Schema Extensions

### Ticket Management Tables


```sql
-- Extend existing Ticket table
ALTER TABLE tickets ADD COLUMN team_id VARCHAR REFERENCES teams(id);
ALTER TABLE tickets ADD COLUMN created_by VARCHAR REFERENCES users(id);
ALTER TABLE tickets ADD COLUMN sla_due_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN resolved_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN closed_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN category VARCHAR(100);

-- Ticket Followers (many-to-many relationship)
CREATE TABLE ticket_followers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_by VARCHAR REFERENCES users(id),
  added_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);

-- Ticket Attachments
CREATE TABLE ticket_attachments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  uploaded_by VARCHAR NOT NULL REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ticket History (audit trail)
CREATE TABLE ticket_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SLA Configurations
CREATE TABLE sla_policies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL,
  response_time_hours INTEGER NOT NULL,
  resolution_time_hours INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Escalation Rules
CREATE TABLE escalation_rules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  condition_type VARCHAR(50) NOT NULL,
  condition_value JSONB NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer Feedback
CREATE TABLE ticket_feedback (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  customer_id VARCHAR NOT NULL REFERENCES customers(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tickets_team_id ON tickets(team_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_sla_due_at ON tickets(sla_due_at);
CREATE INDEX idx_ticket_followers_user_id ON ticket_followers(user_id);
CREATE INDEX idx_ticket_followers_ticket_id ON ticket_followers(ticket_id);
CREATE INDEX idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_user_id ON ticket_history(user_id);
```

### Knowledge Base Extensions

```sql
-- Extend KnowledgeBaseArticle table
ALTER TABLE knowledge_base_articles ADD COLUMN team_id VARCHAR REFERENCES teams(id);
ALTER TABLE knowledge_base_articles ADD COLUMN category VARCHAR(100);
ALTER TABLE knowledge_base_articles ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE knowledge_base_articles ADD COLUMN helpful_count INTEGER DEFAULT 0;

-- Knowledge Base Categories
CREATE TABLE kb_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id VARCHAR REFERENCES kb_categories(id),
  access_level VARCHAR(20) DEFAULT 'PUBLIC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Article-Category relationship
CREATE TABLE kb_article_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id VARCHAR NOT NULL REFERENCES knowledge_base_articles(id) ON DELETE CASCADE,
  category_id VARCHAR NOT NULL REFERENCES kb_categories(id) ON DELETE CASCADE,
  UNIQUE(article_id, category_id)
);
```

## Components and Interfaces

### Ticket Management Service

```typescript
interface TicketService {
  createTicket(data: CreateTicketData, userId: string): Promise<Ticket>;
  getTicket(ticketId: string, userId: string): Promise<Ticket | null>;
  updateTicket(ticketId: string, data: UpdateTicketData, userId: string): Promise<Ticket>;
  deleteTicket(ticketId: string, userId: string): Promise<void>;
  listTickets(filters: TicketFilters, userId: string): Promise<PaginatedTickets>;
  assignTicket(ticketId: string, assigneeId: string, userId: string): Promise<Ticket>;
  closeTicket(ticketId: string, userId: string): Promise<Ticket>;
}

interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  category?: string;
  customerId: string;
  attachments?: File[];
}

interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedTo?: string;
  teamId?: string;
}

interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  teamId?: string;
  assignedTo?: string;
  createdBy?: string;
  customerId?: string;
  search?: string;
  page: number;
  limit: number;
}

interface PaginatedTickets {
  data: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```


### Follower Management System

```typescript
interface FollowerService {
  addFollower(ticketId: string, userId: string, addedBy: string): Promise<void>;
  removeFollower(ticketId: string, userId: string, removedBy: string): Promise<void>;
  getFollowers(ticketId: string, requesterId: string): Promise<User[]>;
  getFollowedTickets(userId: string): Promise<Ticket[]>;
  isFollower(ticketId: string, userId: string): Promise<boolean>;
}

interface TicketFollower {
  id: string;
  ticketId: string;
  userId: string;
  addedBy: string;
  addedAt: Date;
  user: User;
}
```

### Analytics Service

```typescript
interface AnalyticsService {
  getOrganizationMetrics(userId: string, dateRange: DateRange): Promise<OrganizationMetrics>;
  getTeamMetrics(teamId: string, userId: string, dateRange: DateRange): Promise<TeamMetrics>;
  getAgentMetrics(agentId: string, userId: string, dateRange: DateRange): Promise<AgentMetrics>;
  getComparativeAnalysis(userId: string, dateRange: DateRange): Promise<ComparativeAnalysis>;
  exportReport(reportType: ReportType, filters: ReportFilters, userId: string): Promise<Buffer>;
}

interface OrganizationMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  averageResponseTime: number;
  customerSatisfactionScore: number;
  slaComplianceRate: number;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByStatus: Record<TicketStatus, number>;
  teamPerformance: TeamPerformanceSummary[];
  trendData: TrendDataPoint[];
}

interface TeamMetrics {
  teamId: string;
  teamName: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  averageResponseTime: number;
  slaComplianceRate: number;
  agentPerformance: AgentPerformanceSummary[];
  workloadDistribution: WorkloadData[];
}

interface AgentMetrics {
  agentId: string;
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  averageResponseTime: number;
  customerSatisfactionScore: number;
  slaComplianceRate: number;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

type ReportType = 'organization' | 'team' | 'agent' | 'customer' | 'sla' | 'quality';
```

### Knowledge Base Service

```typescript
interface KnowledgeBaseService {
  createArticle(data: CreateArticleData, userId: string): Promise<KBArticle>;
  updateArticle(articleId: string, data: UpdateArticleData, userId: string): Promise<KBArticle>;
  deleteArticle(articleId: string, userId: string): Promise<void>;
  getArticle(articleId: string, userId: string): Promise<KBArticle | null>;
  searchArticles(query: string, userId: string, filters?: KBFilters): Promise<KBArticle[]>;
  getArticlesByCategory(categoryId: string, userId: string): Promise<KBArticle[]>;
  suggestArticles(ticketContent: string, userId: string): Promise<KBArticle[]>;
  recordView(articleId: string, userId: string): Promise<void>;
  recordHelpful(articleId: string, userId: string): Promise<void>;
}

interface CreateArticleData {
  title: string;
  content: string;
  summary?: string;
  accessLevel: KnowledgeAccessLevel;
  teamId?: string;
  categoryIds: string[];
}

interface UpdateArticleData {
  title?: string;
  content?: string;
  summary?: string;
  accessLevel?: KnowledgeAccessLevel;
  teamId?: string;
  categoryIds?: string[];
  isPublished?: boolean;
}

interface KBFilters {
  accessLevel?: KnowledgeAccessLevel;
  teamId?: string;
  categoryId?: string;
  isPublished?: boolean;
}

interface KBArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  accessLevel: KnowledgeAccessLevel;
  teamId?: string;
  isPublished: boolean;
  authorId?: string;
  viewCount: number;
  helpfulCount: number;
  categories: KBCategory[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Notification Service

```typescript
interface NotificationService {
  sendTicketCreatedNotification(ticket: Ticket): Promise<void>;
  sendTicketAssignedNotification(ticket: Ticket, assignee: User): Promise<void>;
  sendTicketStatusChangedNotification(ticket: Ticket, oldStatus: TicketStatus): Promise<void>;
  sendTicketCommentNotification(ticket: Ticket, comment: Comment): Promise<void>;
  sendTicketResolvedNotification(ticket: Ticket): Promise<void>;
  sendSLABreachNotification(ticket: Ticket): Promise<void>;
  sendEscalationNotification(ticket: Ticket, escalationRule: EscalationRule): Promise<void>;
  getUserNotificationPreferences(userId: string): Promise<NotificationPreferences>;
  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
}

interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  notifyOnCreation: boolean;
  notifyOnAssignment: boolean;
  notifyOnStatusChange: boolean;
  notifyOnComment: boolean;
  notifyOnResolution: boolean;
  notifyOnSLABreach: boolean;
}

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
  isRead: boolean;
  createdAt: Date;
}

type NotificationType = 
  | 'ticket_created'
  | 'ticket_assigned'
  | 'ticket_status_changed'
  | 'ticket_comment'
  | 'ticket_resolved'
  | 'sla_breach'
  | 'escalation';
```

### SLA Management System

```typescript
interface SLAService {
  createPolicy(data: CreateSLAPolicyData, userId: string): Promise<SLAPolicy>;
  updatePolicy(policyId: string, data: UpdateSLAPolicyData, userId: string): Promise<SLAPolicy>;
  deletePolicy(policyId: string, userId: string): Promise<void>;
  getPolicies(userId: string): Promise<SLAPolicy[]>;
  calculateSLADueDate(ticket: Ticket): Promise<Date>;
  checkSLACompliance(ticket: Ticket): Promise<SLAComplianceStatus>;
  getSLAViolations(filters: SLAFilters, userId: string): Promise<SLAViolation[]>;
}

interface CreateSLAPolicyData {
  name: string;
  description?: string;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
}

interface UpdateSLAPolicyData {
  name?: string;
  description?: string;
  responseTimeHours?: number;
  resolutionTimeHours?: number;
  isActive?: boolean;
}

interface SLAPolicy {
  id: string;
  name: string;
  description?: string;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SLAComplianceStatus {
  isCompliant: boolean;
  dueAt: Date;
  remainingTime: number;
  breachRisk: 'low' | 'medium' | 'high';
}

interface SLAViolation {
  ticketId: string;
  ticket: Ticket;
  policy: SLAPolicy;
  violationType: 'response' | 'resolution';
  dueAt: Date;
  actualTime: Date;
  delayHours: number;
}
```


### Escalation Engine

```typescript
interface EscalationService {
  createRule(data: CreateEscalationRuleData, userId: string): Promise<EscalationRule>;
  updateRule(ruleId: string, data: UpdateEscalationRuleData, userId: string): Promise<EscalationRule>;
  deleteRule(ruleId: string, userId: string): Promise<void>;
  getRules(userId: string): Promise<EscalationRule[]>;
  evaluateTicket(ticket: Ticket): Promise<EscalationAction[]>;
  executeEscalation(ticket: Ticket, rule: EscalationRule): Promise<void>;
}

interface CreateEscalationRuleData {
  name: string;
  description?: string;
  conditionType: EscalationConditionType;
  conditionValue: any;
  actionType: EscalationActionType;
  actionConfig: any;
}

interface UpdateEscalationRuleData {
  name?: string;
  description?: string;
  conditionValue?: any;
  actionConfig?: any;
  isActive?: boolean;
}

interface EscalationRule {
  id: string;
  name: string;
  description?: string;
  conditionType: EscalationConditionType;
  conditionValue: any;
  actionType: EscalationActionType;
  actionConfig: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type EscalationConditionType = 
  | 'sla_breach'
  | 'time_in_status'
  | 'priority_level'
  | 'no_response'
  | 'customer_rating';

type EscalationActionType = 
  | 'notify_manager'
  | 'reassign_ticket'
  | 'increase_priority'
  | 'add_follower'
  | 'send_email';

interface EscalationAction {
  rule: EscalationRule;
  ticket: Ticket;
  executedAt: Date;
  result: string;
}
```

## Data Models

### Extended Ticket Model

```typescript
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  customerId: string;
  customer: Customer;
  createdBy: string;
  creator: User;
  assignedTo?: string;
  assignee?: User;
  teamId?: string;
  team?: Team;
  slaDueAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
  attachments: TicketAttachment[];
  followers: TicketFollower[];
  history: TicketHistory[];
  feedback?: TicketFeedback;
}

interface TicketAttachment {
  id: string;
  ticketId: string;
  uploadedBy: string;
  uploader: User;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
  createdAt: Date;
}

interface TicketHistory {
  id: string;
  ticketId: string;
  userId: string;
  user: User;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}

interface TicketFeedback {
  id: string;
  ticketId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}
```

### Permission Extensions

```typescript
// Extend existing ROLE_PERMISSIONS in lib/rbac/permissions.ts
export const TICKET_PERMISSIONS = {
  'Admin/Manager': {
    tickets: {
      create: true,
      read: 'all',
      update: 'all',
      delete: 'all',
      assign: 'all',
      close: 'all',
      viewAnalytics: 'organization',
      exportReports: true,
      manageSLA: true,
      manageEscalation: true,
    },
    knowledgeBase: {
      create: true,
      read: 'all',
      update: 'all',
      delete: true,
      publish: true,
    },
    followers: {
      add: 'all',
      remove: 'all',
    },
  },
  'Team Leader': {
    tickets: {
      create: true,
      read: 'team',
      update: 'team',
      delete: false,
      assign: 'team',
      close: 'team',
      viewAnalytics: 'team',
      exportReports: 'team',
      manageSLA: false,
      manageEscalation: false,
    },
    knowledgeBase: {
      create: 'team',
      read: 'team',
      update: 'own',
      delete: false,
      publish: false,
    },
    followers: {
      add: 'team',
      remove: 'team',
    },
  },
  'User/Employee': {
    tickets: {
      create: true,
      read: 'own_and_following',
      update: 'own',
      delete: false,
      assign: false,
      close: false,
      viewAnalytics: false,
      exportReports: false,
      manageSLA: false,
      manageEscalation: false,
    },
    knowledgeBase: {
      create: false,
      read: 'public',
      update: false,
      delete: false,
      publish: false,
    },
    followers: {
      add: false,
      remove: 'self',
    },
  },
};
```

## API Endpoints

### Ticket Management Endpoints

```typescript
// Ticket CRUD
POST   /api/tickets                          // Create ticket
GET    /api/tickets                          // List tickets (role-filtered)
GET    /api/tickets/:id                      // Get ticket details
PUT    /api/tickets/:id                      // Update ticket
DELETE /api/tickets/:id                      // Delete ticket (Admin only)
POST   /api/tickets/:id/assign               // Assign ticket
POST   /api/tickets/:id/close                // Close ticket
GET    /api/tickets/:id/history              // Get ticket history

// Ticket Followers
POST   /api/tickets/:id/followers            // Add follower
DELETE /api/tickets/:id/followers/:userId    // Remove follower
GET    /api/tickets/:id/followers            // List followers
GET    /api/users/:id/followed-tickets       // Get tickets user is following

// Ticket Attachments
POST   /api/tickets/:id/attachments          // Upload attachment
DELETE /api/tickets/:id/attachments/:attachmentId  // Delete attachment
GET    /api/tickets/:id/attachments/:attachmentId  // Download attachment

// Ticket Comments
POST   /api/tickets/:id/comments             // Add comment
PUT    /api/tickets/:id/comments/:commentId  // Update comment
DELETE /api/tickets/:id/comments/:commentId  // Delete comment

// Ticket Feedback
POST   /api/tickets/:id/feedback             // Submit feedback
GET    /api/tickets/:id/feedback             // Get feedback
```

### Analytics Endpoints

```typescript
GET    /api/analytics/organization           // Organization-wide metrics (Admin only)
GET    /api/analytics/teams/:id              // Team metrics (Team Leader/Admin)
GET    /api/analytics/agents/:id             // Agent metrics (Team Leader/Admin)
GET    /api/analytics/comparative            // Comparative analysis (Admin only)
POST   /api/analytics/export                 // Export report
GET    /api/analytics/dashboard              // Role-specific dashboard data
```

### Knowledge Base Endpoints

```typescript
POST   /api/knowledge-base/articles          // Create article
GET    /api/knowledge-base/articles          // List articles (role-filtered)
GET    /api/knowledge-base/articles/:id      // Get article
PUT    /api/knowledge-base/articles/:id      // Update article
DELETE /api/knowledge-base/articles/:id      // Delete article
POST   /api/knowledge-base/articles/:id/view // Record view
POST   /api/knowledge-base/articles/:id/helpful // Mark as helpful
GET    /api/knowledge-base/search            // Search articles
GET    /api/knowledge-base/suggest           // Suggest articles for ticket
GET    /api/knowledge-base/categories        // List categories
```

### SLA Management Endpoints

```typescript
POST   /api/sla/policies                     // Create SLA policy (Admin only)
GET    /api/sla/policies                     // List SLA policies
PUT    /api/sla/policies/:id                 // Update SLA policy (Admin only)
DELETE /api/sla/policies/:id                 // Delete SLA policy (Admin only)
GET    /api/sla/violations                   // Get SLA violations
GET    /api/sla/compliance                   // Get SLA compliance metrics
```

### Escalation Endpoints

```typescript
POST   /api/escalation/rules                 // Create escalation rule (Admin only)
GET    /api/escalation/rules                 // List escalation rules
PUT    /api/escalation/rules/:id             // Update escalation rule (Admin only)
DELETE /api/escalation/rules/:id             // Delete escalation rule (Admin only)
POST   /api/escalation/evaluate/:ticketId    // Manually evaluate ticket
```


## Access Control Implementation

### Ticket Access Control Logic

```typescript
class TicketAccessControl {
  /**
   * Determine if user can access a specific ticket
   */
  async canAccessTicket(userId: string, ticketId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const ticket = await this.getTicket(ticketId);
    
    if (!user || !ticket) return false;
    
    switch (user.role?.name) {
      case 'Admin/Manager':
        return true; // Full access
      
      case 'Team Leader':
        // Can access if ticket belongs to their team
        if (!ticket.teamId) return false;
        const leaderTeams = await this.getUserTeamIds(userId);
        return leaderTeams.includes(ticket.teamId);
      
      case 'User/Employee':
        // Can access if they created it or are a follower
        if (ticket.createdBy === userId) return true;
        const isFollower = await this.isTicketFollower(ticketId, userId);
        return isFollower;
      
      default:
        return false;
    }
  }
  
  /**
   * Get ticket list filters based on user role
   */
  async getTicketFilters(userId: string): Promise<TicketQueryFilter> {
    const user = await this.getUserWithRole(userId);
    
    if (!user?.role) {
      throw new Error('User role not found');
    }
    
    switch (user.role.name) {
      case 'Admin/Manager':
        return {}; // No filters - see all tickets
      
      case 'Team Leader':
        const teamIds = await this.getUserTeamIds(userId);
        return { teamId: { in: teamIds } };
      
      case 'User/Employee':
        // Only tickets they created or are following
        const followedTicketIds = await this.getFollowedTicketIds(userId);
        return {
          OR: [
            { createdBy: userId },
            { id: { in: followedTicketIds } }
          ]
        };
      
      default:
        return { id: 'impossible' }; // Return no results
    }
  }
  
  /**
   * Check if user can perform action on ticket
   */
  async canPerformAction(
    userId: string,
    ticketId: string,
    action: TicketAction
  ): Promise<boolean> {
    const canAccess = await this.canAccessTicket(userId, ticketId);
    if (!canAccess) return false;
    
    const user = await this.getUserWithRole(userId);
    const ticket = await this.getTicket(ticketId);
    
    if (!user?.role || !ticket) return false;
    
    const permissions = TICKET_PERMISSIONS[user.role.name as RoleType];
    
    switch (action) {
      case 'update':
        if (permissions.tickets.update === 'all') return true;
        if (permissions.tickets.update === 'team') {
          return ticket.teamId ? await this.isUserInTeam(userId, ticket.teamId) : false;
        }
        if (permissions.tickets.update === 'own') {
          return ticket.createdBy === userId;
        }
        return false;
      
      case 'assign':
        if (permissions.tickets.assign === 'all') return true;
        if (permissions.tickets.assign === 'team') {
          return ticket.teamId ? await this.isUserInTeam(userId, ticket.teamId) : false;
        }
        return false;
      
      case 'close':
        if (permissions.tickets.close === 'all') return true;
        if (permissions.tickets.close === 'team') {
          return ticket.teamId ? await this.isUserInTeam(userId, ticket.teamId) : false;
        }
        return false;
      
      case 'delete':
        return permissions.tickets.delete === 'all' || permissions.tickets.delete === true;
      
      default:
        return false;
    }
  }
}

type TicketAction = 'update' | 'assign' | 'close' | 'delete' | 'addFollower' | 'removeFollower';
```

### Knowledge Base Access Control

```typescript
class KnowledgeBaseAccessControl {
  /**
   * Filter articles based on user role and team
   */
  async getArticleFilters(userId: string): Promise<KBQueryFilter> {
    const user = await this.getUserWithRole(userId);
    
    if (!user?.role) {
      return { accessLevel: 'PUBLIC', isPublished: true };
    }
    
    switch (user.role.name) {
      case 'Admin/Manager':
        return {}; // See all articles
      
      case 'Team Leader':
        const teamIds = await this.getUserTeamIds(userId);
        return {
          OR: [
            { accessLevel: 'PUBLIC' },
            { accessLevel: 'INTERNAL' },
            { teamId: { in: teamIds } }
          ],
          isPublished: true
        };
      
      case 'User/Employee':
        return {
          OR: [
            { accessLevel: 'PUBLIC' },
            { accessLevel: 'INTERNAL' }
          ],
          isPublished: true
        };
      
      default:
        return { accessLevel: 'PUBLIC', isPublished: true };
    }
  }
  
  /**
   * Check if user can modify article
   */
  async canModifyArticle(userId: string, articleId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const article = await this.getArticle(articleId);
    
    if (!user?.role || !article) return false;
    
    const permissions = TICKET_PERMISSIONS[user.role.name as RoleType];
    
    if (permissions.knowledgeBase.update === 'all') return true;
    if (permissions.knowledgeBase.update === 'own') {
      return article.authorId === userId;
    }
    if (permissions.knowledgeBase.update === 'team') {
      if (!article.teamId) return false;
      return await this.isUserInTeam(userId, article.teamId);
    }
    
    return false;
  }
}
```

### Analytics Access Control

```typescript
class AnalyticsAccessControl {
  /**
   * Get analytics scope for user
   */
  async getAnalyticsScope(userId: string): Promise<AnalyticsScope> {
    const user = await this.getUserWithRole(userId);
    
    if (!user?.role) {
      throw new Error('User role not found');
    }
    
    switch (user.role.name) {
      case 'Admin/Manager':
        return {
          level: 'organization',
          teamIds: [],
          canExport: true,
          canViewComparative: true
        };
      
      case 'Team Leader':
        const teamIds = await this.getUserTeamIds(userId);
        return {
          level: 'team',
          teamIds,
          canExport: true,
          canViewComparative: false
        };
      
      case 'User/Employee':
        return {
          level: 'none',
          teamIds: [],
          canExport: false,
          canViewComparative: false
        };
      
      default:
        return {
          level: 'none',
          teamIds: [],
          canExport: false,
          canViewComparative: false
        };
    }
  }
  
  /**
   * Filter analytics data based on scope
   */
  async filterAnalyticsData<T>(
    userId: string,
    data: T[],
    getTeamId: (item: T) => string | undefined
  ): Promise<T[]> {
    const scope = await this.getAnalyticsScope(userId);
    
    if (scope.level === 'organization') {
      return data; // No filtering
    }
    
    if (scope.level === 'team') {
      return data.filter(item => {
        const teamId = getTeamId(item);
        return teamId && scope.teamIds.includes(teamId);
      });
    }
    
    return []; // No access
  }
}

interface AnalyticsScope {
  level: 'organization' | 'team' | 'none';
  teamIds: string[];
  canExport: boolean;
  canViewComparative: boolean;
}
```

## Error Handling

### Ticket-Specific Errors

```typescript
export class TicketNotFoundError extends PermissionError {
  constructor(ticketId: string) {
    super(
      `Ticket not found: ${ticketId}`,
      'TICKET_NOT_FOUND',
      'tickets:read',
      404
    );
  }
}

export class TicketAccessDeniedError extends PermissionError {
  constructor(ticketId: string, userId: string) {
    super(
      `Access denied to ticket ${ticketId} for user ${userId}`,
      'TICKET_ACCESS_DENIED',
      'tickets:read',
      403
    );
  }
}

export class TicketAssignmentDeniedError extends PermissionError {
  constructor(ticketId: string, reason: string) {
    super(
      `Cannot assign ticket ${ticketId}: ${reason}`,
      'TICKET_ASSIGNMENT_DENIED',
      'tickets:assign',
      403
    );
  }
}

export class InvalidTicketStatusTransitionError extends Error {
  constructor(from: TicketStatus, to: TicketStatus) {
    super(`Invalid status transition from ${from} to ${to}`);
    this.name = 'InvalidTicketStatusTransitionError';
  }
}

export class SLAPolicyNotFoundError extends Error {
  constructor(policyId: string) {
    super(`SLA policy not found: ${policyId}`);
    this.name = 'SLAPolicyNotFoundError';
  }
}

export class KnowledgeBaseAccessDeniedError extends PermissionError {
  constructor(articleId: string, userId: string) {
    super(
      `Access denied to knowledge base article ${articleId} for user ${userId}`,
      'KB_ACCESS_DENIED',
      'knowledge_base:read',
      403
    );
  }
}
```


## Testing Strategy

### Unit Tests

1. **Ticket Access Control Tests**
   - Test ticket visibility for each role
   - Verify follower-based access for User/Employee
   - Test team-based access for Team Leader
   - Verify organization-wide access for Admin/Manager

2. **Permission Validation Tests**
   - Test ticket creation permissions
   - Test ticket update permissions by role
   - Test ticket assignment permissions
   - Test ticket closure permissions
   - Test follower management permissions

3. **Analytics Access Tests**
   - Test organization-wide analytics access (Admin only)
   - Test team-specific analytics access (Team Leader)
   - Verify analytics denial for User/Employee
   - Test data filtering by role scope

4. **Knowledge Base Access Tests**
   - Test article visibility by access level
   - Test team-specific article access
   - Verify public article access for all roles
   - Test article modification permissions

5. **SLA and Escalation Tests**
   - Test SLA calculation logic
   - Test escalation rule evaluation
   - Verify SLA breach detection
   - Test escalation action execution

### Integration Tests

1. **End-to-End Ticket Workflows**
   - Test complete ticket lifecycle from creation to closure
   - Verify role-based ticket assignment flows
   - Test follower addition and notification flows
   - Verify cross-team ticket reassignment (Admin only)

2. **Analytics and Reporting Flows**
   - Test organization-wide report generation
   - Test team-specific report generation
   - Verify data isolation between teams
   - Test report export functionality

3. **Knowledge Base Integration**
   - Test article suggestion based on ticket content
   - Verify article access during ticket resolution
   - Test article creation and publishing workflow
   - Verify team-specific article visibility

4. **Notification Flows**
   - Test ticket creation notifications
   - Test assignment notifications
   - Test status change notifications
   - Test SLA breach notifications
   - Verify notification preference handling

### Security Tests

1. **Authorization Bypass Tests**
   - Attempt to access tickets outside role scope
   - Test for privilege escalation vulnerabilities
   - Verify team boundary enforcement
   - Test follower-based access controls

2. **Data Isolation Tests**
   - Ensure Team Leaders cannot access other team tickets
   - Verify User/Employee cannot access non-followed tickets
   - Test customer data isolation by team
   - Verify analytics data filtering by role

3. **API Security Tests**
   - Test authentication requirements on all endpoints
   - Verify CSRF protection on state-changing operations
   - Test rate limiting on ticket creation
   - Verify input validation and sanitization

## Performance Optimization

### Database Optimization

1. **Indexing Strategy**
   - Index ticket status, priority, and team_id for fast filtering
   - Index ticket_followers for quick follower lookups
   - Index ticket_history for audit trail queries
   - Composite indexes for common query patterns

2. **Query Optimization**
   - Use database views for complex role-based queries
   - Implement pagination for large result sets
   - Use select projections to limit data transfer
   - Optimize JOIN operations with proper indexes

3. **Caching Strategy**
   - Cache user permissions and team assignments
   - Cache ticket counts and analytics aggregations
   - Cache knowledge base articles with high view counts
   - Implement cache invalidation on ticket updates

### Application Optimization

1. **Lazy Loading**
   - Load ticket comments and attachments on demand
   - Lazy load ticket history for performance
   - Defer analytics calculations until requested
   - Load knowledge base articles progressively

2. **Batch Operations**
   - Batch notification sending for multiple followers
   - Batch ticket assignment operations
   - Batch analytics calculations for reports
   - Batch SLA compliance checks

3. **Background Processing**
   - Process SLA checks asynchronously
   - Execute escalation rules in background jobs
   - Generate reports asynchronously
   - Send notifications via message queue

## Security Measures

### Authentication and Authorization

1. **Session Security**
   - Leverage existing session management system
   - Validate session on every ticket operation
   - Implement session timeout for inactive users
   - Invalidate sessions on role changes

2. **Permission Enforcement**
   - Enforce permissions at API layer
   - Validate permissions at service layer
   - Implement UI-level permission checks
   - Log all permission denials for audit

3. **Data Protection**
   - Encrypt sensitive ticket data at rest
   - Sanitize user input to prevent XSS
   - Use parameterized queries to prevent SQL injection
   - Implement file upload validation and scanning

### Audit and Compliance

1. **Audit Logging**
   - Log all ticket operations with user context
   - Track ticket assignment changes
   - Record status transitions with timestamps
   - Log permission denials and access attempts

2. **Compliance Features**
   - Maintain complete ticket history
   - Provide audit trail export functionality
   - Implement data retention policies
   - Support GDPR data deletion requests

## Scalability Considerations

### Horizontal Scaling

1. **Stateless API Design**
   - Design APIs to be stateless for load balancing
   - Store session data in Redis for shared access
   - Use database connection pooling
   - Implement API rate limiting per user

2. **Microservices Readiness**
   - Design services with clear boundaries
   - Use event-driven architecture for notifications
   - Implement message queues for async operations
   - Design for eventual consistency where appropriate

### Data Partitioning

1. **Ticket Partitioning**
   - Consider partitioning tickets by date for large volumes
   - Implement archival strategy for closed tickets
   - Use read replicas for analytics queries
   - Separate hot and cold data storage

2. **Team-Based Sharding**
   - Consider sharding by team for very large organizations
   - Implement cross-shard queries for Admin users
   - Design for team data locality
   - Plan for team reorganization scenarios

## Implementation Phases

### Phase 1: Core Ticket Management (Weeks 1-2)
- Extend database schema for tickets
- Implement ticket CRUD operations
- Add role-based ticket access control
- Create ticket list and detail APIs
- Implement basic ticket assignment

### Phase 2: Follower System and Notifications (Week 3)
- Implement follower management
- Create notification service
- Add notification preferences
- Implement real-time notifications
- Add email notification support

### Phase 3: Analytics and Reporting (Week 4)
- Implement analytics service
- Create role-scoped dashboards
- Add report generation
- Implement export functionality
- Add comparative analysis (Admin)

### Phase 4: Knowledge Base Integration (Week 5)
- Extend knowledge base schema
- Implement role-based article access
- Add article suggestion engine
- Create article management APIs
- Implement article search

### Phase 5: SLA and Escalation (Week 6)
- Implement SLA management
- Create escalation engine
- Add SLA monitoring
- Implement escalation rules
- Add automated escalation execution

### Phase 6: Testing and Optimization (Week 7)
- Comprehensive testing
- Performance optimization
- Security hardening
- Documentation
- Deployment preparation

## Monitoring and Observability

### Key Metrics

1. **Performance Metrics**
   - API response times by endpoint
   - Database query performance
   - Cache hit rates
   - Background job processing times

2. **Business Metrics**
   - Ticket creation rate
   - Average resolution time
   - SLA compliance rate
   - Customer satisfaction scores
   - Team performance metrics

3. **Security Metrics**
   - Failed authentication attempts
   - Permission denial rate
   - Suspicious access patterns
   - API rate limit violations

### Logging Strategy

1. **Application Logs**
   - Log all ticket operations
   - Log permission checks and denials
   - Log API errors and exceptions
   - Log background job execution

2. **Audit Logs**
   - Maintain separate audit log table
   - Log user actions with context
   - Track data modifications
   - Support audit log export

3. **Performance Logs**
   - Log slow queries
   - Track API latency
   - Monitor cache performance
   - Log resource utilization
