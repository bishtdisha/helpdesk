# Implementation Plan

- [x] 1. Extend database schema for ticket management system
  - Update Prisma schema to add ticket-related tables and relationships
  - Add ticket_followers, ticket_attachments, ticket_history tables
  - Add SLA policies, escalation rules, and feedback tables
  - Add indexes for performance optimization
  - _Requirements: 1.1, 6.1, 11.1, 12.1, 13.1_

- [x] 1.1 Update Prisma schema with ticket extensions
  - Extend Ticket model with teamId, createdBy, slaDueAt, resolvedAt, closedAt, category fields
  - Create TicketFollower model for follower relationships
  - Create TicketAttachment model for file uploads
  - Create TicketHistory model for audit trail
  - _Requirements: 1.1, 11.1, 12.1, 13.1_

- [x] 1.2 Create SLA and escalation models
  - Create SLAPolicy model with priority-based time configurations
  - Create EscalationRule model with condition and action configurations
  - Create TicketFeedback model for customer ratings
  - Add relationships between models
  - _Requirements: 3.1, 5.1_

- [x] 1.3 Add knowledge base extensions
  - Extend KnowledgeBaseArticle with teamId, category, viewCount, helpfulCount
  - Create KBCategory model for article categorization
  - Create KBArticleCategory junction table
  - Add indexes for search performance
  - _Requirements: 9.1, 15.1_

- [x] 1.4 Run database migration
  - Generate Prisma migration files
  - Review migration SQL for correctness
  - Apply migration to development database
  - Verify schema changes
  - _Requirements: 1.1, 3.1, 9.1, 11.1_

- [x] 2. Extend RBAC permission system for tickets
  - Update permission definitions in lib/rbac/permissions.ts
  - Add ticket-specific permission checks
  - Extend access control helpers
  - Update permission matrix for all roles
  - _Requirements: 1.1, 6.1, 11.1, 16.1_

- [x] 2.1 Add ticket permissions to permission matrix
  - Define TICKET_PERMISSIONS constant with role-based access rules
  - Add permissions for create, read, update, delete, assign, close operations
  - Define scope-based access (all, team, own, own_and_following)
  - Add knowledge base and follower permissions
  - _Requirements: 1.1, 6.1, 11.1, 16.1_

- [x] 2.2 Create ticket access control service
  - Implement TicketAccessControl class with canAccessTicket method
  - Implement getTicketFilters method for role-based query filtering
  - Implement canPerformAction method for operation validation
  - Add helper methods for team and follower checks
  - _Requirements: 1.1, 6.1, 11.1, 13.1, 16.1_

- [x] 2.3 Create knowledge base access control service
  - Implement KnowledgeBaseAccessControl class
  - Implement getArticleFilters method for role-based filtering
  - Implement canModifyArticle method for update permissions
  - Add access level validation logic
  - _Requirements: 9.1, 15.1, 16.1_

- [x] 2.4 Create analytics access control service
  - Implement AnalyticsAccessControl class
  - Implement getAnalyticsScope method for role-based scope determination
  - Implement filterAnalyticsData method for data filtering
  - Add export permission checks
  - _Requirements: 2.1, 7.1, 16.1_

- [x] 3. Implement core ticket management service

  - Create ticket service with CRUD operations
  - Implement role-based ticket filtering
  - Add ticket assignment logic
  - Implement ticket status management
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 11.1, 12.1_

- [x] 3.1 Create ticket service interface and base implementation
  - Define TicketService interface with all methods
  - Implement createTicket method with permission validation
  - Implement getTicket method with access control
  - Implement updateTicket method with role-based restrictions
  - Implement deleteTicket method (Admin only)
  - _Requirements: 1.1, 1.2, 6.1, 11.1, 12.1_

- [x] 3.2 Implement ticket listing and filtering
  - Implement listTickets method with pagination
  - Add role-based query filters (Admin: all, Team Leader: team, User: own+following)
  - Implement search functionality across title and description
  - Add filtering by status, priority, team, assignee
  - _Requirements: 1.1, 6.1, 11.1, 12.1_

- [x] 3.3 Implement ticket assignment functionality
  - Implement assignTicket method with permission checks
  - Add team-based assignment validation for Team Leaders
  - Implement ticket reassignment logic
  - Add assignment history tracking
  - Send assignment notifications
  - _Requirements: 1.2, 1.3, 6.2, 6.3_

- [x] 3.4 Implement ticket status management
  - Implement closeTicket method with permission validation
  - Add status transition validation logic
  - Track status change timestamps (resolvedAt, closedAt)
  - Create ticket history entries for status changes
  - _Requirements: 1.4, 6.1, 12.1_

- [x] 3.5 Write unit tests for ticket service
  - Test ticket creation with different roles
  - Test ticket access control for each role
  - Test ticket filtering logic
  - Test assignment permission validation
  - Test status transition logic
  - _Requirements: 1.1, 6.1, 11.1_

- [x] 4. Implement follower management system


  - Create follower service for managing ticket followers
  - Implement add/remove follower operations
  - Add follower-based access control
  - Integrate with notification system
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 4.1 Create follower service
  - Implement addFollower method with permission checks
  - Implement removeFollower method (Team Leaders can remove from team tickets, users can remove self)
  - Implement getFollowers method with access control
  - Implement getFollowedTickets method for user's followed tickets
  - Implement isFollower helper method
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 4.2 Integrate follower access into ticket service
  - Update ticket access control to check follower status
  - Modify getTicketFilters to include followed tickets for User/Employee
  - Update ticket detail queries to include follower information
  - Add follower count to ticket responses
  - _Requirements: 13.2, 13.3, 13.5_

- [x] 4.3 Write unit tests for follower service
  - Test follower addition with different roles
  - Test follower removal permissions
  - Test follower-based ticket access
  - Test followed tickets retrieval
  - _Requirements: 13.1, 13.2_

- [x] 5. Create ticket management API endpoints


  - Implement REST API endpoints for ticket operations
  - Add role-based middleware protection
  - Implement request validation
  - Add error handling
  - _Requirements: 1.1, 6.1, 11.1, 12.1, 16.1_

- [x] 5.1 Create ticket CRUD endpoints
  - Implement POST /api/tickets for ticket creation
  - Implement GET /api/tickets for listing with role-based filtering
  - Implement GET /api/tickets/:id for ticket details
  - Implement PUT /api/tickets/:id for updates
  - Implement DELETE /api/tickets/:id (Admin only)
  - _Requirements: 1.1, 6.1, 11.1, 12.1_

- [x] 5.2 Create ticket operation endpoints
  - Implement POST /api/tickets/:id/assign for assignment
  - Implement POST /api/tickets/:id/close for closing tickets
  - Implement GET /api/tickets/:id/history for audit trail
  - Add request validation for all endpoints
  - _Requirements: 1.2, 1.4, 6.2, 17.1_

- [x] 5.3 Create follower management endpoints
  - Implement POST /api/tickets/:id/followers for adding followers
  - Implement DELETE /api/tickets/:id/followers/:userId for removing followers
  - Implement GET /api/tickets/:id/followers for listing followers
  - Implement GET /api/users/:id/followed-tickets for user's followed tickets
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 5.4 Create comment and attachment endpoints
  - Implement POST /api/tickets/:id/comments for adding comments
  - Implement PUT /api/tickets/:id/comments/:commentId for updating comments
  - Implement DELETE /api/tickets/:id/comments/:commentId for deleting comments
  - Implement POST /api/tickets/:id/attachments for file uploads
  - Implement DELETE /api/tickets/:id/attachments/:attachmentId for file deletion
  - Implement GET /api/tickets/:id/attachments/:attachmentId for file downloads
  - _Requirements: 11.4, 12.3, 13.3_

- [x] 5.5 Write integration tests for ticket APIs
  - Test ticket creation API with different roles
  - Test ticket listing with role-based filtering
  - Test ticket assignment API
  - Test follower management APIs
  - Test error responses for unauthorized access
  - _Requirements: 1.1, 6.1, 11.1, 16.1_


- [x] 6. Implement notification service


  - Create notification service for ticket events
  - Implement notification preferences
  - Add email notification support
  - Integrate with ticket operations
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 6.1 Create notification service and data models
  - Create Notification model in Prisma schema
  - Create NotificationPreferences model
  - Implement NotificationService interface
  - Add notification type definitions
  - _Requirements: 14.1, 14.5_

- [x] 6.2 Implement notification creation methods
  - Implement sendTicketCreatedNotification method
  - Implement sendTicketAssignedNotification method
  - Implement sendTicketStatusChangedNotification method
  - Implement sendTicketCommentNotification method
  - Implement sendTicketResolvedNotification method
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 6.3 Implement notification preferences
  - Implement getUserNotificationPreferences method
  - Implement updateNotificationPreferences method
  - Add default preferences for new users
  - Implement preference-based notification filtering
  - _Requirements: 14.5_

- [x] 6.4 Integrate notifications with ticket operations
  - Add notification calls to ticket creation
  - Add notification calls to ticket assignment
  - Add notification calls to status changes
  - Add notification calls to comment creation
  - Send notifications to ticket creator and all followers
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 6.5 Create notification API endpoints
  - Implement GET /api/notifications for listing user notifications
  - Implement PUT /api/notifications/:id/read for marking as read
  - Implement GET /api/notifications/preferences for getting preferences
  - Implement PUT /api/notifications/preferences for updating preferences
  - _Requirements: 14.5_

- [x] 6.6 Write unit tests for notification service
  - Test notification creation for different events
  - Test notification preference filtering
  - Test follower notification distribution
  - Test notification API endpoints
  - _Requirements: 14.1, 14.5_

- [x] 7. Implement analytics service
  - Create analytics service for performance metrics
  - Implement role-scoped analytics
  - Add report generation
  - Implement export functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3_

- [x] 7.1 Create analytics service with organization-wide metrics
  - Implement getOrganizationMetrics method (Admin only)
  - Calculate total tickets, open, resolved counts
  - Calculate average resolution and response times
  - Calculate customer satisfaction scores
  - Calculate SLA compliance rates
  - Generate ticket distribution by priority and status
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7.2 Implement team-specific analytics
  - Implement getTeamMetrics method with team access validation
  - Calculate team-level ticket counts and averages
  - Generate agent performance summaries within team
  - Calculate workload distribution across team members
  - Restrict access to Team Leader's assigned teams only
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7.3 Implement agent performance metrics
  - Implement getAgentMetrics method with access control
  - Calculate agent-specific ticket counts
  - Calculate agent resolution and response times
  - Calculate agent customer satisfaction scores
  - Restrict access based on role (Admin: all, Team Leader: team members only)
  - _Requirements: 7.2, 7.3_

- [x] 7.4 Implement comparative analysis
  - Implement getComparativeAnalysis method (Admin only)
  - Generate cross-team performance comparisons
  - Calculate team rankings by key metrics
  - Identify performance trends and outliers
  - Generate executive summary data
  - _Requirements: 2.2, 2.4_

- [x] 7.5 Implement report export functionality
  - Implement exportReport method with role-based access
  - Support multiple export formats (CSV, PDF, Excel)
  - Generate organization-wide reports for Admin
  - Generate team-specific reports for Team Leaders
  - Add scheduled report generation capability
  - _Requirements: 2.5_

- [x] 7.6 Create analytics API endpoints
  - Implement GET /api/analytics/organization (Admin only)
  - Implement GET /api/analytics/teams/:id (Team Leader/Admin)
  - Implement GET /api/analytics/agents/:id (Team Leader/Admin)
  - Implement GET /api/analytics/comparative (Admin only)
  - Implement POST /api/analytics/export with format selection
  - Implement GET /api/analytics/dashboard for role-specific dashboard data
  - _Requirements: 2.1, 2.2, 7.1, 7.2_

- [x] 7.7 Write unit tests for analytics service
  - Test organization metrics calculation
  - Test team metrics with access control
  - Test agent metrics filtering
  - Test comparative analysis
  - Test role-based analytics access
  - _Requirements: 2.1, 7.1_

- [x] 8. Implement knowledge base service
  - Create knowledge base service with role-based access
  - Implement article CRUD operations
  - Add article search functionality
  - Implement article suggestion engine
  - _Requirements: 9.1, 9.2, 9.3, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 8.1 Create knowledge base service
  - Implement createArticle method (Admin/Team Leader)
  - Implement updateArticle method with ownership validation
  - Implement deleteArticle method (Admin only)
  - Implement getArticle method with access level filtering
  - Add access level validation (PUBLIC, INTERNAL, RESTRICTED)
  - _Requirements: 9.1, 9.2, 15.4_

- [x] 8.2 Implement article search and filtering
  - Implement searchArticles method with role-based filtering
  - Add full-text search across title and content
  - Implement getArticlesByCategory method
  - Filter articles by access level based on user role
  - Restrict RESTRICTED articles to specific teams
  - _Requirements: 9.1, 15.2, 15.3_

- [x] 8.3 Implement article suggestion engine
  - Implement suggestArticles method based on ticket content
  - Use keyword matching between ticket and article content
  - Rank suggestions by relevance
  - Filter suggestions by user's access level
  - Display relevant articles during ticket creation
  - _Requirements: 15.5_

- [x] 8.4 Implement article engagement tracking
  - Implement recordView method to track article views
  - Implement recordHelpful method for helpful votes
  - Update viewCount and helpfulCount fields
  - Use engagement metrics for article ranking
  - _Requirements: 15.5_

- [x] 8.5 Create knowledge base API endpoints
  - Implement POST /api/knowledge-base/articles (Admin/Team Leader)
  - Implement GET /api/knowledge-base/articles with role-based filtering
  - Implement GET /api/knowledge-base/articles/:id
  - Implement PUT /api/knowledge-base/articles/:id
  - Implement DELETE /api/knowledge-base/articles/:id (Admin only)
  - Implement POST /api/knowledge-base/articles/:id/view
  - Implement POST /api/knowledge-base/articles/:id/helpful
  - Implement GET /api/knowledge-base/search
  - Implement GET /api/knowledge-base/suggest with ticket context
  - Implement GET /api/knowledge-base/categories
  - _Requirements: 9.1, 15.1, 15.2, 15.3, 15.5_

- [x] 8.6 Write unit tests for knowledge base service
  - Test article creation with different roles
  - Test article access filtering by role
  - Test article search functionality
  - Test article suggestion engine
  - Test access level restrictions
  - _Requirements: 9.1, 15.1, 15.4_

- [x] 9. Implement SLA management system
  - Create SLA service for policy management
  - Implement SLA calculation logic
  - Add SLA monitoring
  - Implement SLA breach detection
  - _Requirements: 3.1, 3.2, 5.1_

- [x] 9.1 Create SLA service and policy management
  - Implement createPolicy method (Admin only)
  - Implement updatePolicy method (Admin only)
  - Implement deletePolicy method (Admin only)
  - Implement getPolicies method
  - Add priority-based policy selection logic
  - _Requirements: 3.1_

- [x] 9.2 Implement SLA calculation and monitoring
  - Implement calculateSLADueDate method based on ticket priority
  - Implement checkSLACompliance method for ticket status
  - Calculate remaining time until SLA breach
  - Determine breach risk level (low, medium, high)
  - Update ticket slaDueAt field on creation and priority changes
  - _Requirements: 3.1, 5.1_

- [x] 9.3 Implement SLA violation tracking
  - Implement getSLAViolations method with role-based filtering
  - Track response time violations
  - Track resolution time violations
  - Calculate delay hours for violations
  - Generate SLA compliance reports
  - _Requirements: 2.5, 5.1_

- [x] 9.4 Integrate SLA monitoring with ticket operations
  - Calculate SLA due date on ticket creation
  - Recalculate SLA on priority changes
  - Track first response time
  - Track resolution time
  - Send notifications on SLA breach risk
  - _Requirements: 3.1, 5.1_

- [x] 9.5 Create SLA management API endpoints
  - Implement POST /api/sla/policies (Admin only)
  - Implement GET /api/sla/policies
  - Implement PUT /api/sla/policies/:id (Admin only)
  - Implement DELETE /api/sla/policies/:id (Admin only)
  - Implement GET /api/sla/violations with role-based filtering
  - Implement GET /api/sla/compliance for compliance metrics
  - _Requirements: 3.1, 5.1_

- [x] 9.6 Write unit tests for SLA service
  - Test SLA policy CRUD operations
  - Test SLA due date calculation
  - Test SLA compliance checking
  - Test violation tracking
  - Test Admin-only access restrictions
  - _Requirements: 3.1, 5.1_

- [x] 10. Implement escalation engine
  - Create escalation service for rule management
  - Implement escalation rule evaluation
  - Add automated escalation execution
  - Integrate with notification system
  - _Requirements: 3.2, 3.3_

- [x] 10.1 Create escalation service and rule management
  - Implement createRule method (Admin only)
  - Implement updateRule method (Admin only)
  - Implement deleteRule method (Admin only)
  - Implement getRules method
  - Define escalation condition types (sla_breach, time_in_status, priority_level, no_response, customer_rating)
  - Define escalation action types (notify_manager, reassign_ticket, increase_priority, add_follower, send_email)
  - _Requirements: 3.2, 3.3_

- [x] 10.2 Implement escalation rule evaluation
  - Implement evaluateTicket method to check all active rules
  - Evaluate SLA breach conditions
  - Evaluate time in status conditions
  - Evaluate priority level conditions
  - Evaluate no response conditions
  - Evaluate customer rating conditions
  - Return applicable escalation actions
  - _Requirements: 3.2_

- [x] 10.3 Implement escalation action execution
  - Implement executeEscalation method for rule actions
  - Execute notify_manager action (send notification to team leader/admin)
  - Execute reassign_ticket action (reassign to specified user/team)
  - Execute increase_priority action (escalate ticket priority)
  - Execute add_follower action (add specified users as followers)
  - Execute send_email action (send custom email notification)
  - Log escalation actions in ticket history
  - _Requirements: 3.2, 3.3_

- [x] 10.4 Create background job for escalation monitoring
  - Create scheduled job to evaluate tickets periodically
  - Check all open tickets against escalation rules
  - Execute applicable escalation actions
  - Log escalation execution results
  - Handle escalation errors gracefully
  - _Requirements: 3.2_

- [x] 10.5 Create escalation API endpoints
  - Implement POST /api/escalation/rules (Admin only)
  - Implement GET /api/escalation/rules
  - Implement PUT /api/escalation/rules/:id (Admin only)
  - Implement DELETE /api/escalation/rules/:id (Admin only)
  - Implement POST /api/escalation/evaluate/:ticketId for manual evaluation
  - _Requirements: 3.2, 3.3_

- [x] 10.6 Write unit tests for escalation service
  - Test escalation rule CRUD operations
  - Test rule evaluation logic for each condition type
  - Test action execution for each action type
  - Test Admin-only access restrictions
  - Test escalation logging
  - _Requirements: 3.2, 3.3_

- [x] 11. Implement customer feedback system
  - Create feedback service for ticket ratings
  - Add feedback submission
  - Integrate feedback with analytics
  - Display feedback in quality metrics
  - _Requirements: 5.1, 5.2_

- [x] 11.1 Create feedback service
  - Implement submitFeedback method for customers
  - Implement getFeedback method with access control
  - Validate rating values (1-5)
  - Associate feedback with resolved/closed tickets only
  - Store feedback comments
  - _Requirements: 5.1_

- [x] 11.2 Integrate feedback with analytics
  - Calculate customer satisfaction scores in organization metrics
  - Calculate customer satisfaction scores in team metrics
  - Calculate customer satisfaction scores in agent metrics
  - Include feedback in quality reports
  - Filter feedback by role scope (Admin: all, Team Leader: team)
  - _Requirements: 5.1, 5.2_

- [x] 11.3 Create feedback API endpoints
  - Implement POST /api/tickets/:id/feedback for submission
  - Implement GET /api/tickets/:id/feedback for retrieval
  - Implement GET /api/feedback/summary for aggregated feedback (Admin/Team Leader)
  - Add access control for feedback viewing
  - _Requirements: 5.1, 5.2_

- [x] 11.4 Write unit tests for feedback service
  - Test feedback submission
  - Test feedback access control
  - Test feedback integration with analytics
  - Test rating validation
  - _Requirements: 5.1_

- [x] 12. Create ticket management UI components
  - Build ticket list component with role-based filtering
  - Create ticket detail component
  - Add ticket creation form
  - Implement ticket assignment UI
  - _Requirements: 1.1, 6.1, 11.1, 12.1, 18.1_

- [x] 12.1 Create ticket list component
  - Build TicketList component with data table
  - Add role-based filtering (Admin: all, Team Leader: team, User: own+following)
  - Implement search functionality
  - Add filters for status, priority, team, assignee
  - Add pagination controls
  - Display ticket counts and summaries
  - _Requirements: 1.1, 6.1, 12.1, 18.1_

- [x] 12.2 Create ticket detail component
  - Build TicketDetail component with full ticket information
  - Display ticket metadata (status, priority, assignee, team, SLA)
  - Show ticket description and comments
  - Display attachments with download links
  - Show follower list
  - Display ticket history timeline
  - Add role-based action buttons (assign, close, edit)
  - _Requirements: 1.1, 12.1, 12.5, 18.1_

- [x] 12.3 Create ticket creation form
  - Build CreateTicket form component
  - Add fields for title, description, priority, category
  - Add customer selection
  - Add file upload for attachments
  - Implement form validation
  - Show knowledge base article suggestions based on content
  - _Requirements: 11.1, 11.3, 11.4, 15.5_

- [x] 12.4 Create ticket assignment UI
  - Build ticket assignment modal/dialog
  - Show available team members for Team Leaders
  - Show all users for Admins
  - Add team selection for Admins
  - Implement assignment confirmation
  - _Requirements: 1.2, 1.3, 6.2_

- [x] 12.5 Create follower management UI
  - Build follower management component
  - Display current followers
  - Add user search for adding followers
  - Implement add/remove follower actions
  - Show follower permissions based on role
  - _Requirements: 13.1, 13.2_

- [x] 13. Create analytics dashboard components
  - Build organization dashboard for Admins
  - Create team dashboard for Team Leaders
  - Add performance charts and metrics
  - Implement report export UI
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 18.5_

- [x] 13.1 Create organization dashboard component
  - Build OrganizationDashboard component (Admin only)
  - Display system-wide KPIs (total tickets, resolution time, SLA compliance)
  - Add ticket distribution charts (by status, priority, team)
  - Show team performance comparison table
  - Display trend analysis charts
  - Add date range selector
  - _Requirements: 2.1, 2.3, 2.4, 18.5_

- [x] 13.2 Create team dashboard component
  - Build TeamDashboard component (Team Leader)
  - Display team-specific KPIs
  - Show agent performance within team
  - Display workload distribution chart
  - Add team ticket trends
  - Restrict to assigned teams only
  - _Requirements: 7.1, 7.2, 7.3, 18.5_

- [x] 13.3 Create report export UI
  - Build report export dialog
  - Add report type selection (organization, team, agent, SLA, quality)
  - Add format selection (CSV, PDF, Excel)
  - Add date range selection
  - Implement download functionality
  - Show role-based report options
  - _Requirements: 2.5_

- [x] 13.4 Create comparative analysis component
  - Build ComparativeAnalysis component (Admin only)
  - Display cross-team performance metrics
  - Show team ranking tables
  - Add performance trend comparisons
  - Display outlier identification
  - _Requirements: 2.2_

- [x] 14. Create knowledge base UI components
  - Build knowledge base article list
  - Create article detail viewer
  - Add article search interface
  - Implement article suggestion display
  - _Requirements: 9.1, 15.1, 15.2, 15.3, 15.5_

- [x] 14.1 Create knowledge base article list
  - Build KBArticleList component
  - Display articles with role-based filtering
  - Add category navigation
  - Implement search functionality
  - Show article metadata (views, helpful count)
  - Add create article button for Admin/Team Leader
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 14.2 Create article detail viewer                                                                               
  - Build KBArticleDetail component
  - Display article content with formatting
  - Show article metadata
  - Add "Was this helpful?" feedback
  - Track article views
  - Show related articles
  - _Requirements: 15.1, 15.5_

- [x] 14.3 Create article editor component
  - Build KBArticleEditor component (Admin/Team Leader)
  - Add rich text editor for content
  - Add fields for title, summary, category
  - Add access level selection
  - Add team selection for RESTRICTED articles
  - Implement publish/unpublish toggle
  - _Requirements: 9.1, 9.2_

- [x] 14.4 Create article suggestion component
  - Build ArticleSuggestion component
  - Display suggested articles during ticket creation
  - Show article summaries
  - Add quick view functionality
  - Link to full article details
  - _Requirements: 15.5_

- [x] 15. Implement notification UI components
  - Create notification center
  - Add notification preferences UI
  - Implement real-time notification updates
  - Add notification badges
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 15.1 Create notification center component
  - Build NotificationCenter component
  - Display list of user notifications
  - Group notifications by type
  - Add mark as read functionality
  - Show notification timestamps
  - Add click-through to related tickets
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 15.2 Create notification preferences UI
  - Build NotificationPreferences component
  - Add toggles for email and in-app notifications
  - Add event-specific notification settings
  - Implement save preferences functionality
  - Show current preference status
  - _Requirements: 14.5_

- [x] 15.3 Implement notification badge
  - Add notification badge to header/navigation
  - Show unread notification count
  - Update count in real-time
  - Add dropdown for quick notification view
  - _Requirements: 14.1_

- [x] 16. Implement role-based navigation and UI adaptation
  - Update navigation based on user role
  - Hide/show features by permissions
  - Add role-specific dashboard routing
  - Implement permission-based component rendering
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 16.1 Create role-based navigation component
  - Update main navigation to show role-appropriate menu items
  - Hide admin features from Team Leader and User/Employee
  - Hide team management from User/Employee
  - Show ticket creation for all roles
  - Show analytics only for Admin and Team Leader
  - _Requirements: 18.1, 18.2, 18.3_

- [x] 16.2 Implement permission-based component wrapper
  - Create PermissionGuard component for conditional rendering
  - Add role checking logic
  - Add permission checking logic
  - Hide components when user lacks permission
  - Show appropriate fallback messages
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [x] 16.3 Create role-specific dashboard routing
  - Route Admin users to organization dashboard
  - Route Team Leader users to team dashboard
  - Route User/Employee to ticket list (own tickets)
  - Add dashboard selection for users with multiple roles
  - _Requirements: 18.5_

- [x] 17. Implement audit logging and history
  - Create audit service for tracking operations
  - Implement ticket history tracking
  - Add audit log viewing UI
  - Implement audit log export
  - _Requirements: 16.3, 16.4, 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 17.1 Create audit service
  - Implement logTicketOperation method
  - Implement logPermissionDenial method
  - Implement logUserAction method
  - Store user context, action, resource, and timestamp
  - Add IP address and user agent tracking
  - _Requirements: 16.3, 16.4, 17.1_

- [x] 17.2 Implement ticket history tracking
  - Create ticket history entries on all ticket changes
  - Track field-level changes (old value, new value)
  - Log assignment changes
  - Log status transitions
  - Log follower additions/removals
  - _Requirements: 17.2, 17.3, 17.4_

- [x] 17.3 Create audit log viewing UI
  - Build AuditLog component (Admin only)
  - Display audit log entries with filtering
  - Add search by user, action, resource
  - Add date range filtering
  - Show detailed audit information
  - _Requirements: 17.5_

- [x] 17.4 Implement audit log export
  - Add export functionality for audit logs
  - Support CSV and JSON formats
  - Add date range selection
  - Filter by user, action, resource type
  - Restrict to Admin users only
  - _Requirements: 17.5_

- [x] 18. Add file upload and attachment handling
  - Implement file upload service
  - Add attachment storage
  - Implement file download
  - Add file type validation
  - _Requirements: 11.4, 12.3, 13.4_

- [x] 18.1 Create file upload service
  - Implement uploadFile method with file validation
  - Add file type restrictions (documents, images)
  - Add file size limits
  - Store files in secure location
  - Generate unique file paths
  - _Requirements: 11.4, 12.3_

- [x] 18.2 Implement attachment management
  - Create ticket attachment records in database
  - Link attachments to tickets
  - Track uploader information
  - Implement attachment deletion with permission checks
  - _Requirements: 11.4, 12.3, 13.4_

- [x] 18.3 Create file download endpoint
  - Implement GET /api/tickets/:id/attachments/:attachmentId
  - Validate user has access to ticket
  - Stream file content
  - Set appropriate content-type headers
  - Add download filename
  - _Requirements: 12.3, 13.4_

- [x] 18.4 Create file upload UI component
  - Build FileUpload component
  - Add drag-and-drop support
  - Show upload progress
  - Display uploaded files
  - Add file removal option
  - Show file size and type
  - _Requirements: 11.4_

- [x] 19. Implement SLA and escalation background jobs
  - Create scheduled job for SLA monitoring
  - Create scheduled job for escalation evaluation
  - Add job scheduling configuration
  - Implement job error handling
  - _Requirements: 3.1, 3.2, 5.1_

- [x] 19.1 Create SLA monitoring background job
  - Create scheduled job to check SLA compliance
  - Identify tickets approaching SLA breach
  - Send breach risk notifications
  - Update ticket SLA status
  - Run job every 15 minutes
  - _Requirements: 3.1, 5.1_

- [x] 19.2 Create escalation evaluation background job
  - Create scheduled job to evaluate escalation rules
  - Check all open tickets against active rules
  - Execute applicable escalation actions
  - Log escalation executions
  - Run job every 30 minutes
  - _Requirements: 3.2_

- [x] 19.3 Configure job scheduling
  - Set up job scheduler (node-cron or similar)
  - Configure job intervals
  - Add job monitoring and logging
  - Implement job error handling and retry logic
  - _Requirements: 3.1, 3.2_

- [x] 20. Integration testing and bug fixes
  - Test complete ticket workflows
  - Test role-based access across all features
  - Fix identified bugs
  - Optimize performance
  - _Requirements: All_

- [x] 20.1 Test end-to-end ticket workflows
  - Test ticket creation by User/Employee
  - Test ticket assignment by Team Leader
  - Test ticket reassignment by Admin
  - Test follower addition and notifications
  - Test ticket resolution and closure
  - Test feedback submission
  - _Requirements: 11.1, 12.1, 13.1, 14.1_

- [x] 20.2 Test role-based access control
  - Verify Admin can access all tickets
  - Verify Team Leader can only access team tickets
  - Verify User/Employee can only access own and followed tickets
  - Test permission denials return appropriate errors
  - Test UI hides unauthorized features
  - _Requirements: 1.1, 6.1, 11.1, 16.1, 18.1_

- [x] 20.3 Test analytics and reporting
  - Test organization dashboard with Admin user
  - Test team dashboard with Team Leader user
  - Verify data isolation between teams
  - Test report export functionality
  - Test comparative analysis
  - _Requirements: 2.1, 7.1_

- [x] 20.4 Test knowledge base access
  - Test article visibility by access level
  - Test team-specific article access
  - Test article suggestion engine
  - Test article creation by Team Leader
  - _Requirements: 9.1, 15.1_

- [x] 20.5 Performance optimization
  - Optimize database queries with proper indexes
  - Implement caching for frequently accessed data
  - Optimize ticket list queries
  - Optimize analytics calculations
  - Test with large data volumes
  - _Requirements: All_
