# Implementation Plan

## Overview

This implementation plan breaks down the frontend integration work into discrete, manageable tasks. Each task builds incrementally on previous work, ensuring the application remains functional throughout development. Tasks are organized into 6 phases following the migration strategy outlined in the design document.

## Phase 1: Core Ticket Management (Foundation)

- [x] 1. Set up project dependencies and configuration

  - Install required npm packages (SWR, React Hook Form, Zod, shadcn/ui components)
  - Configure TypeScript paths and aliases
  - Set up Tailwind CSS configuration with custom theme
  - Configure ESLint and Prettier for code quality
  - _Requirements: 2.1, 20.1_

- [x] 1.1 Install core dependencies
  - Install SWR for data fetching and caching
  - Install React Hook Form and Zod for form handling
  - Install date-fns for date manipulation
  - Install class-variance-authority and clsx for styling utilities
  - _Requirements: 2.1, 20.1_

- [x] 1.2 Set up shadcn/ui components
  - Initialize shadcn/ui in the project
  - Install base components (Button, Card, Dialog, Input, Select, Table)
  - Install form components (Form, Label, Textarea)
  - Install feedback components (Toast, Alert, Badge)
  - _Requirements: 2.1, 15.1_

- [x] 1.3 Configure TypeScript and build tools
  - Set up path aliases (@/components, @/lib, @/hooks)
  - Configure TypeScript strict mode
  - Set up type definitions for API responses
  - Configure Next.js for optimal performance
  - _Requirements: 2.1_

- [x] 2. Create authentication and authorization infrastructure
  - Implement AuthContext for global authentication state
  - Create useAuth hook for accessing auth state
  - Implement PermissionGuard component for conditional rendering
  - Create usePermissions hook with role-based permission checks
  - _Requirements: 17.1, 17.2, 21.1, 21.2, 21.3, 21.4_

- [x] 2.1 Implement AuthContext
  - Create AuthContext with user, role, and permissions state
  - Implement login and logout functions
  - Fetch user data from GET /api/auth/me on mount
  - Handle authentication errors and redirects
  - Store auth state in React Context
  - _Requirements: 17.1, 17.2, 65.1, 65.4_

- [x] 2.2 Create useAuth hook
  - Export useAuth hook to access AuthContext
  - Provide user, role, isLoading, and auth functions
  - Handle cases where hook is used outside AuthProvider
  - Add TypeScript types for auth state
  - _Requirements: 17.1, 17.2_

- [x] 2.3 Implement PermissionGuard component
  - Create component that conditionally renders children based on permissions
  - Support single permission or array of permissions
  - Provide fallback prop for unauthorized state
  - Use usePermissions hook internally
  - _Requirements: 17.3, 17.4, 17.5, 21.2_

- [x] 2.4 Create usePermissions hook
  - Implement permission checking functions (canAssignTicket, canViewAnalytics, canManageSLA)
  - Base permissions on user role from AuthContext
  - Memoize permission functions to prevent recalculations
  - Add hasRole helper function
  - _Requirements: 21.1, 21.3, 21.4, 21.5_

- [x] 3. Create API client and data fetching infrastructure


  - Implement API client wrapper with error handling
  - Create custom hooks for ticket operations (useTickets, useTicket, useTicketMutations)
  - Set up SWR configuration with caching and revalidation
  - Implement error handling for different HTTP status codes
  - _Requirements: 2.1, 2.2, 2.3, 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 3.1 Create API client wrapper
  - Implement APIClient class with get, post, put, delete methods
  - Add authentication header handling
  - Implement error parsing and transformation
  - Handle 401 (redirect to login), 403 (access denied), 404 (not found), 500 (server error)
  - Add request/response interceptors
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 3.2 Create useTickets hook
  - Implement hook using SWR for ticket list fetching
  - Support filters parameter (status, priority, team, assignee, search)
  - Enable 30-second polling for real-time updates
  - Return tickets, pagination, isLoading, error, and refresh function
  - _Requirements: 1.1, 1.2, 2.1, 2.4, 25.1_

- [x] 3.3 Create useTicket hook
  - Implement hook for single ticket fetching
  - Fetch from GET /api/tickets/:id
  - Enable 30-second polling
  - Return ticket, isLoading, error, and refresh function
  - _Requirements: 4.1, 4.3, 25.4_

- [x] 3.4 Create useTicketMutations hook
  - Implement createTicket function (POST /api/tickets)
  - Implement updateTicket function (PUT /api/tickets/:id)
  - Implement assignTicket function (POST /api/tickets/:id/assign)
  - Implement closeTicket function (PUT /api/tickets/:id with status=CLOSED)
  - Trigger ticket list refresh after mutations
  - _Requirements: 3.1, 5.4, 14.2, 14.3_

- [x] 4. Build core ticket list component

  - Create TicketList component with table/card view
  - Implement pagination controls
  - Add search and filter UI
  - Display loading skeletons during fetch
  - Handle empty states
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4.1 Create TicketList component structure
  - Set up component with useTickets hook
  - Create table layout with columns (ID, Title, Status, Priority, Assignee, Created)
  - Add responsive card view for mobile
  - Implement role-based column visibility
  - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3, 7.4_

- [x] 4.2 Implement pagination
  - Add pagination controls (Previous, Next, Page numbers)
  - Update URL query params with page number
  - Fetch tickets with page and limit parameters
  - Display total count and current page info
  - _Requirements: 2.4, 18.5_

- [x] 4.3 Add search and filter UI
  - Create search input with debouncing (300ms)
  - Add status filter dropdown
  - Add priority filter dropdown
  - Add team filter (Admin_Manager and Team_Leader only)
  - Add assignee filter (Admin_Manager and Team_Leader only)
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 22.1, 23.1, 24.2_

- [x] 4.4 Implement loading and empty states
  - Create skeleton loader for table rows
  - Display loading spinner during initial fetch
  - Show empty state message when no tickets found
  - Display error message on fetch failure with retry button
  - _Requirements: 2.2, 15.1, 15.2, 15.4, 1.5_

- [x] 4.5 Add visual indicators
  - Implement TicketStatusBadge component with color coding
  - Implement PriorityBadge component with color coding
  - Add SLA countdown timer to each row
  - Highlight overdue tickets
  - _Requirements: 31.1, 31.2, 31.3, 36.1, 36.2, 36.3, 36.4, 36.5_

- [x] 5. Build ticket detail component

  - Create TicketDetail component with full ticket information
  - Display ticket metadata (status, priority, assignee, team, SLA)
  - Show ticket description
  - Add action buttons based on permissions
  - Implement real-time updates
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 14.1, 14.4_

- [x] 5.1 Create TicketDetail component structure
  - Set up component with useTicket hook
  - Create layout with header, metadata, and content sections
  - Display ticket title, description, and timestamps
  - Show customer information
  - _Requirements: 4.1, 4.3_

- [x] 5.2 Display ticket metadata
  - Show status badge with color coding
  - Show priority badge with color coding
  - Display assigned user with avatar
  - Display team information
  - Show SLA countdown timer with detailed info
  - _Requirements: 4.3, 31.5, 36.3_

- [x] 5.3 Add action buttons based on permissions
  - Show "Assign" button for Admin_Manager and Team_Leader
  - Show "Edit" button for users with edit permission
  - Show "Close" button for users with close permission
  - Hide all action buttons for User_Employee (except on own tickets)
  - _Requirements: 5.1, 5.2, 5.3, 14.1, 17.3, 17.4_

- [x] 5.4 Implement status and priority updates
  - Add status dropdown with available transitions
  - Add priority dropdown
  - Send PUT request to /api/tickets/:id on change
  - Show success/error toast notifications
  - Refresh ticket data after update
  - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [x] 6. Build ticket creation form

  - Create TicketCreateForm component with validation
  - Implement form fields (title, description, priority, category, customer)
  - Add file upload support
  - Integrate with POST /api/tickets
  - Show validation errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6.1 Create form structure with React Hook Form
  - Set up form with useForm hook
  - Add Zod schema for validation
  - Create form fields (title, description, priority, category, customerId)
  - Implement controlled inputs
  - _Requirements: 3.1, 3.2_

- [x] 6.2 Implement form validation
  - Validate title (required, max 200 characters)
  - Validate description (required)
  - Validate priority (required, valid enum value)
  - Validate customerId (required, valid UUID)
  - Display inline validation errors
  - _Requirements: 3.2, 3.5_

- [x] 6.3 Add customer selection
  - Create customer search/select component
  - Fetch customers from API
  - Display customer name and email
  - Handle customer not found case
  - _Requirements: 57.1, 57.5_

- [x] 6.4 Implement form submission
  - Handle form submit event
  - Send POST request to /api/tickets
  - Show loading state during submission
  - Display success message on creation
  - Redirect to ticket detail page
  - Display error message on failure
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 46.1_

- [x] 7. Replace mock data in existing tickets.tsx
  - Remove mock ticket data
  - Integrate TicketList component
  - Connect to real API endpoints
  - Test with different user roles
  - Verify RBAC filtering works correctly
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 49.1_


## Phase 2: Collaboration Features

- [x] 8. Implement comment system



  - Create CommentList component
  - Create CommentEditor component with rich text support
  - Integrate with POST /api/tickets/:id/comments
  - Display comments with author info and timestamps
  - Support internal notes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 40.1, 40.2, 40.3, 40.4, 40.5_

- [x] 8.1 Create CommentList component
  - Fetch comments from ticket data
  - Display comments in chronological order
  - Show author avatar, name, and timestamp
  - Display internal notes with distinct styling
  - Hide internal notes from customers
  - _Requirements: 6.4, 40.2, 40.3, 40.5, 49.3_

- [x] 8.2 Create CommentEditor component
  - Implement rich text editor using Tiptap
  - Add formatting toolbar (bold, italic, lists, links)
  - Add internal note toggle
  - Implement @mentions support
  - Add code block support
  - _Requirements: 32.1, 32.2, 32.3, 32.4, 32.5, 40.1_

- [x] 8.3 Implement comment submission
  - Handle comment form submission
  - Send POST request to /api/tickets/:id/comments
  - Include isInternal flag based on toggle
  - Display new comment immediately (optimistic update)
  - Show success/error notifications
  - _Requirements: 6.2, 6.3, 46.3_

- [x] 8.4 Add comment editing and deletion
  - Show edit/delete buttons for own comments
  - Implement edit mode with pre-filled content
  - Send PUT request to /api/tickets/:id/comments/:commentId
  - Send DELETE request for deletion
  - Update comment list after operations
  - _Requirements: 6.5_

- [x] 9. Implement follower management
  - Create FollowerManager component
  - Display current followers
  - Add user search to add followers
  - Integrate with POST/DELETE /api/tickets/:id/followers
  - Update follower list in real-time
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 54.1, 54.2, 54.3, 54.5_

- [x] 9.1 Create FollowerManager component
  - Display list of current followers with avatars
  - Show follower names and roles
  - Add "Add Follower" button
  - Show remove button for each follower (based on permissions)
  - _Requirements: 8.1, 54.2, 54.5_

- [x] 9.2 Implement user search for adding followers
  - Create user search input with autocomplete
  - Fetch users from API based on search query
  - Filter users based on role (Team_Leader sees only team members)
  - Display user results with avatar and name
  - _Requirements: 8.2_

- [x] 9.3 Implement add follower functionality
  - Handle follower selection from search results
  - Send POST request to /api/tickets/:id/followers
  - Verify API response confirms record creation
  - Update follower list immediately
  - Show success notification
  - _Requirements: 8.3, 54.1, 54.4_

- [x] 9.4 Implement remove follower functionality
  - Handle remove button click
  - Send DELETE request to /api/tickets/:id/followers/:userId
  - Verify API response confirms deletion
  - Update follower list immediately
  - Show success notification
  - _Requirements: 8.4, 54.3_

- [x] 10. Implement notification system
  - Create NotificationCenter component
  - Create NotificationBadge component
  - Implement notification preferences
  - Integrate with GET /api/notifications
  - Add real-time polling
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10.1 Create NotificationBadge component
  - Display unread notification count in header
  - Fetch count from GET /api/notifications/unread-count
  - Update count every 30 seconds
  - Show dropdown on click with recent notifications
  - _Requirements: 9.2_

- [x] 10.2 Create NotificationCenter component
  - Fetch notifications from GET /api/notifications
  - Display notifications grouped by type
  - Show notification icon, title, message, and timestamp
  - Implement mark as read functionality
  - Add click-through to related tickets
  - _Requirements: 9.1, 9.3, 9.4_

- [x] 10.3 Implement mark as read functionality
  - Handle notification click event
  - Send PUT request to /api/notifications/:id/read
  - Update notification state immediately
  - Navigate to related ticket
  - _Requirements: 9.3, 9.4_

- [x] 10.4 Create NotificationPreferences component
  - Fetch preferences from GET /api/notifications/preferences
  - Display toggle switches for each notification type
  - Add email vs in-app preference toggles
  - Send PUT request to /api/notifications/preferences on change
  - Show success message after save
  - _Requirements: 56.1, 56.2, 56.4_

- [x] 10.5 Add browser notifications
  - Request browser notification permission
  - Send browser notifications for high-priority tickets
  - Send notifications for SLA breach warnings
  - Respect user's notification preferences
  - Handle permission denied gracefully
  - _Requirements: 37.1, 37.2, 37.3, 37.4, 37.5_

- [x] 11. Implement real-time updates
  - Add polling mechanism for ticket list
  - Add polling for ticket details
  - Highlight newly updated tickets
  - Show "New Updates" badge
  - Add manual refresh button
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

- [x] 11.1 Implement ticket list polling
  - Configure SWR with 30-second refresh interval
  - Compare new data with cached data
  - Highlight tickets with updates
  - Show notification badge for new changes
  - _Requirements: 25.1, 25.2, 25.3_

- [x] 11.2 Implement ticket detail polling
  - Configure SWR with 30-second refresh interval for ticket details
  - Detect changes in ticket data
  - Update UI automatically when changes detected
  - Show toast notification for updates
  - _Requirements: 25.4_

- [x] 11.3 Add manual refresh controls
  - Add refresh button to ticket list
  - Add refresh button to ticket detail
  - Trigger immediate data revalidation on click
  - Show loading indicator during refresh
  - _Requirements: 25.5_


## Phase 3: Analytics & Reporting

- [x] 12. Create organization dashboard (Admin_Manager only)
  - Build OrganizationDashboard component
  - Fetch data from GET /api/analytics/organization
  - Display system-wide KPIs
  - Show team performance comparison
  - Add date range selector
  - _Requirements: 10.1, 10.3, 10.4, 10.5, 22.2, 22.3_

- [x] 12.1 Create OrganizationDashboard component structure
  - Set up component with permission guard (Admin_Manager only)
  - Create layout with KPI cards and charts
  - Add date range selector
  - Fetch analytics data with selected date range
  - _Requirements: 10.5, 22.2_

- [x] 12.2 Display system-wide KPIs
  - Show total tickets count
  - Show open tickets count
  - Show resolved tickets count
  - Display average resolution time
  - Display SLA compliance rate
  - Display customer satisfaction score
  - _Requirements: 10.3_

- [x] 12.3 Create ticket distribution charts
  - Implement pie chart for tickets by status
  - Implement pie chart for tickets by priority
  - Implement bar chart for tickets by team
  - Use Recharts library for visualizations
  - Make charts responsive
  - _Requirements: 10.4_

- [x] 12.4 Display team performance comparison
  - Create table showing team metrics
  - Display team names, ticket counts, resolution times
  - Add sorting by different metrics
  - Highlight top and bottom performers
  - _Requirements: 10.3, 22.2_

- [x] 12.5 Implement trend analysis
  - Create line chart showing ticket trends over time
  - Display resolution time trends
  - Show SLA compliance trends
  - Add comparison with previous period
  - _Requirements: 10.3_

- [x] 13. Create team dashboard (Team_Leader)
  - Build TeamDashboard component
  - Fetch data from GET /api/analytics/teams/:id
  - Display team-specific KPIs
  - Show agent performance within team
  - Display workload distribution
  - _Requirements: 10.2, 10.3, 10.4, 10.5, 23.2, 50.1, 50.2_

- [x] 13.1 Create TeamDashboard component structure
  - Set up component with permission guard (Team_Leader)
  - Validate team ID against user's assigned teams
  - Create layout with team KPIs and charts
  - Add date range selector
  - _Requirements: 10.5, 23.2, 50.1, 50.5_

- [x] 13.2 Display team-specific KPIs
  - Show team total tickets
  - Show team open tickets
  - Show team resolved tickets
  - Display team average resolution time
  - Display team SLA compliance rate
  - _Requirements: 10.3, 50.2_

- [x] 13.3 Display agent performance within team
  - Create table showing agent metrics
  - Display agent names, assigned tickets, resolved tickets
  - Show agent resolution times
  - Add sorting by different metrics
  - _Requirements: 10.3, 50.2_


- [x] 13.4 Display workload distribution
  - Create bar chart showing tickets per agent
  - Display active ticket counts
  - Show workload balance across team
  - Highlight overloaded agents
  - _Requirements: 10.4_

- [x] 13.5 Hide organization-wide metrics
  - Ensure no cross-team data is displayed
  - Hide comparative team analysis
  - Show "Access Denied" if attempting to access other teams
  - _Requirements: 23.3, 50.3, 50.4_

- [x] 14. Create user dashboard (User_Employee)
  - Build UserDashboard component
  - Display personal ticket statistics
  - Show my open tickets
  - Show tickets I'm following
  - Display recent activity
  - _Requirements: 24.1, 24.3, 39.1, 39.2, 39.3, 39.4_

- [x] 14.1 Create UserDashboard component structure
  - Set up component for User_Employee role
  - Create layout with personal stats and ticket lists
  - Fetch user's tickets and statistics
  - _Requirements: 24.1, 24.3_

- [x] 14.2 Display personal ticket statistics
  - Show count of tickets created by user
  - Show count of open tickets
  - Show count of tickets being followed
  - Display average resolution time for user's tickets
  - _Requirements: 39.1, 39.3, 39.4_

- [x] 14.3 Display my tickets section
  - List tickets created by user
  - Show ticket status, priority, and age
  - Add quick filters (open, in progress, resolved)
  - Link to ticket detail pages
  - _Requirements: 24.1_

- [x] 14.4 Display followed tickets section
  - List tickets user is following
  - Show ticket status and recent activity
  - Highlight tickets with new updates
  - Link to ticket detail pages
  - _Requirements: 24.1_

- [x] 15. Implement export functionality
  - Add export button to ticket list
  - Support CSV format export
  - Allow column selection
  - Respect RBAC when exporting
  - Show export progress
  - _Requirements: 34.1, 34.2, 34.3, 34.4, 34.5_

- [x] 15.1 Create export dialog
  - Add "Export" button to ticket list
  - Create dialog with export options
  - Add column selection checkboxes
  - Add format selection (CSV)
  - Add date range selection
  - _Requirements: 34.1, 34.3_

- [x] 15.2 Implement export functionality
  - Send GET request to /api/analytics/export with filters
  - Include selected columns in request
  - Respect user's RBAC scope (only export accessible tickets)
  - Download file with appropriate filename
  - _Requirements: 34.2, 34.4_

- [x] 15.3 Show export progress
  - Display progress indicator for large exports
  - Show estimated time remaining
  - Allow canceling export
  - Show success message on completion
  - _Requirements: 34.5, 44.1, 44.3_


## Phase 4: Advanced Features

- [x] 16. Implement knowledge base components
  - Create KBArticleList component
  - Create KBArticleDetail component
  - Create KBArticleSuggestions component
  - Integrate with GET /api/knowledge-base/articles
  - Implement article search
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 60.1, 60.2_

- [x] 16.1 Create KBArticleList component
  - Fetch articles from GET /api/knowledge-base/articles
  - Display articles with role-based filtering
  - Show article title, summary, and metadata
  - Add category navigation
  - Implement pagination
  - _Requirements: 11.1, 60.1, 60.2_

- [x] 16.2 Implement article search
  - Create search input with debouncing
  - Send queries to GET /api/knowledge-base/search
  - Display search results
  - Highlight search terms in results
  - Show "No results" message
  - _Requirements: 11.2_

- [x] 16.3 Create KBArticleDetail component
  - Fetch article from GET /api/knowledge-base/articles/:id
  - Display article content with formatting
  - Show article metadata (author, views, helpful count)
  - Track article view via POST /api/knowledge-base/articles/:id/view
  - Add "Was this helpful?" feedback
  - _Requirements: 11.4, 11.5, 60.3_

- [x] 16.4 Create KBArticleSuggestions component
  - Fetch suggestions from GET /api/knowledge-base/suggest
  - Display suggested articles during ticket creation
  - Show article summaries
  - Add quick preview functionality
  - Link to full article details
  - _Requirements: 11.3, 33.1_

- [x] 16.5 Implement article categories
  - Fetch categories from GET /api/knowledge-base/categories
  - Display category tree navigation
  - Filter articles by selected category
  
  - Show article count per category
  - _Requirements: 60.4_

- [x] 17. Implement SLA management (Admin_Manager only)
  - Create SLAPolicyManager component
  - Create SLAViolationList component
  - Integrate with GET/POST/PUT/DELETE /api/sla/policies
  - Display SLA violations
  - Add SLA countdown timers
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 31.1, 31.2, 31.3, 31.4, 31.5, 53.1, 53.3, 53.4_

- [x] 17.1 Create SLAPolicyManager component
  - Set up component with permission guard (Admin_Manager only)
  - Fetch SLA policies from GET /api/sla/policies
  - Display policies in a table
  - Add "Create Policy" button
  - Show edit/delete buttons for each policy
  - _Requirements: 12.1, 12.5_

- [x] 17.2 Implement SLA policy creation
  - Create form for new SLA policy
  - Add fields (name, description, priority, response time, resolution time)
  - Validate form inputs
  - Send POST request to /api/sla/policies
  - Verify API response confirms storage
  - Refresh policy list after creation
  - _Requirements: 12.2, 53.1, 53.5_

- [x] 17.3 Implement SLA policy editing
  - Create edit form with pre-filled values
  - Allow updating policy fields
  - Send PUT request to /api/sla/policies/:id
  - Verify API response confirms update
  - Refresh policy list after update
  - _Requirements: 12.3, 53.5_

- [x] 17.4 Create SLAViolationList component
  - Fetch violations from GET /api/sla/violations
  - Display violations in a table
  - Show ticket info, policy, due date, delay
  - Add filters (team, priority, violation type)
  - Add export functionality
  - _Requirements: 12.4, 53.4_

- [x] 17.5 Implement SLA countdown timers
  - Create SLACountdownTimer component
  - Calculate time remaining until SLA breach
  - Color-code timer (green/yellow/red)
  - Update timer every second
  - Display "SLA Breached" badge for overdue tickets
  - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 53.3_

- [x] 18. Implement escalation management (Admin_Manager only)
  - Create EscalationRuleManager component
  - Integrate with GET/POST/PUT/DELETE /api/escalation/rules
  - Implement rule creation and editing
  - Add manual escalation evaluation
  - Display escalation history
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 59.1, 59.2, 59.3, 59.4, 59.5_

- [x] 18.1 Create EscalationRuleManager component
  - Set up component with permission guard (Admin_Manager only)
  - Fetch escalation rules from GET /api/escalation/rules
  - Display rules in a table
  - Add "Create Rule" button
  - Show edit/delete buttons for each rule
  - _Requirements: 13.1, 13.5_

- [x] 18.2 Implement escalation rule creation
  - Create form for new escalation rule
  - Add fields (name, description, condition type, condition value, action type, action config)
  - Provide dropdowns for condition and action types
  - Validate form inputs
  - Send POST request to /api/escalation/rules
  - Verify API response confirms storage with JSON configuration
  - _Requirements: 13.2, 59.1_

- [x] 18.3 Implement escalation rule editing
  - Create edit form with pre-filled values
  - Allow updating rule fields
  - Send PUT request to /api/escalation/rules/:id
  - Verify API response confirms update
  - Refresh rule list after update
  - _Requirements: 13.3_

- [x] 18.4 Implement manual escalation evaluation
  - Add "Evaluate" button on ticket detail page
  - Send POST request to /api/escalation/evaluate/:ticketId
  - Display evaluation results
  - Show which rules were triggered
  - Display actions taken
  - _Requirements: 13.4_

- [x] 18.5 Display escalation history
  - Fetch escalation history from ticket history
  - Display escalation events in activity timeline
  - Show rule name, action taken, and timestamp
  - Verify API response includes escalation actions
  - _Requirements: 59.3, 59.5_

- [x] 19. Implement bulk actions


  - Add checkbox selection to ticket list
  - Create bulk action toolbar
  - Implement bulk status update
  - Implement bulk assignment
  - Show confirmation dialogs
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_

- [x] 19.1 Add bulk selection to ticket list
  - Add checkbox column to ticket table
  - Add "Select All" checkbox in header
  - Track selected ticket IDs in state
  - Show selection count
  - _Requirements: 26.1_

- [x] 19.2 Create bulk action toolbar
  - Display toolbar when tickets are selected
  - Show available actions (Update Status, Assign, Close)
  - Hide toolbar when no tickets selected
  - Restrict actions based on user role
  - _Requirements: 26.2_

- [x] 19.3 Implement bulk status update
  - Add status dropdown to bulk toolbar
  - Send multiple PUT requests for selected tickets
  - Show progress indicator
  - Display success/failure count
  - Refresh ticket list after completion
  - _Requirements: 26.3, 44.2_

- [x] 19.4 Implement bulk assignment
  - Add assignee selector to bulk toolbar
  - Send multiple POST requests to assign tickets
  - Show progress indicator
  - Display success/failure count
  - Refresh ticket list after completion
  - _Requirements: 26.4, 44.2_

- [x] 19.5 Add confirmation dialogs
  - Show confirmation dialog before bulk operations
  - Display count of affected tickets
  - Allow canceling operation
  - Show warning for irreversible actions
  - _Requirements: 26.5_


## Phase 5: UX Enhancements

- [x] 20. Implement keyboard shortcuts
  - Add keyboard shortcut handler
  - Implement 'N' for new ticket
  - Implement '/' for search focus
  - Implement 'Escape' for closing dialogs
  - Create keyboard shortcuts help dialog
  - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_

- [x] 20.1 Create keyboard shortcut handler
  - Set up global keyboard event listener
  - Implement shortcut registry
  - Handle modifier keys (Ctrl, Cmd, Shift)
  - Prevent conflicts with browser shortcuts
  - _Requirements: 27.1, 27.2, 27.3_

- [x] 20.2 Implement common shortcuts
  - Add 'N' shortcut to open new ticket dialog
  - Add '/' shortcut to focus search input
  - Add '1-5' shortcuts for priority filters
  - Add 'Escape' to close modals and dialogs
  - _Requirements: 27.1, 27.2, 27.3, 27.4_

- [x] 20.3 Create keyboard shortcuts help dialog
  - Add '?' shortcut to open help dialog
  - Display list of available shortcuts
  - Group shortcuts by category
  - Show keyboard key visuals
  - _Requirements: 27.5_

- [x] 21. Implement filter presets

  - Add "Save Filter" button
  - Store presets in localStorage
  - Display saved presets dropdown
  - Allow renaming and deleting presets
  - Apply presets with one click
  - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 47.1_

- [x] 21.1 Implement save filter functionality
  - Add "Save Filter" button when filters are applied
  - Create dialog to name the preset
  - Store preset in localStorage with user ID prefix
  - Show success message after save
  - _Requirements: 28.1, 28.2, 47.1_

- [x] 21.2 Display saved filter presets
  - Create dropdown menu for saved presets
  - Display preset names
  - Show preset count
  - Add "Manage Presets" option
  - _Requirements: 28.3_

- [x] 21.3 Implement preset application
  - Apply preset filters on selection
  - Update URL query params
  - Fetch tickets with preset filters
  - Show active preset indicator
  - _Requirements: 28.5_

- [x] 21.4 Implement preset management
  - Create dialog to manage presets
  - Allow renaming presets
  - Allow deleting presets
  - Update localStorage after changes
  - _Requirements: 28.4_

- [x] 22. Implement activity timeline
  - Create TicketTimeline component
  - Display all ticket activities chronologically
  - Show user avatars and names
  - Display relative timestamps
  - Group activities by date
  - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5_

- [x] 22.1 Create TicketTimeline component
  - Fetch ticket history from GET /api/tickets/:id/history
  - Combine history, comments, and attachments
  - Sort activities chronologically
  - Create timeline layout with vertical line
  - _Requirements: 29.1, 29.2, 52.3_

- [x] 22.2 Display activity details
  - Show activity type icon (status change, comment, attachment, assignment)
  - Display user avatar and name
  - Show activity description
  - Display relative timestamps with absolute time on hover
  - _Requirements: 29.3, 29.4, 52.4_

- [x] 22.3 Group activities by date
  - Add date headers (Today, Yesterday, specific dates)
  - Group activities under date headers
  - Improve readability with spacing
  - _Requirements: 29.5_

- [x] 23. Implement drag-and-drop file upload
  - Create FileUpload component with drag-and-drop
  - Display drop zone visual
  - Validate file types and sizes
  - Show upload progress
  - Allow canceling uploads
  - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 7.2, 7.3_

- [x] 23.1 Create FileUpload component
  - Use react-dropzone for drag-and-drop
  - Create drop zone with visual feedback
  - Handle file selection via click or drag
  - Support multiple file uploads
  - _Requirements: 30.1, 30.2_

- [x] 23.2 Implement file validation
  - Validate file types (documents, images)
  - Validate file sizes (max 10MB per file)
  - Show validation errors
  - Prevent invalid files from uploading
  - _Requirements: 30.3, 7.3_

- [x] 23.3 Implement file upload with progress
  - Send POST request to /api/tickets/:id/attachments
  - Track upload progress
  - Display progress bar with percentage
  - Show file name during upload
  - _Requirements: 30.4, 7.2, 7.3_

- [x] 23.4 Add upload cancellation
  - Provide cancel button during upload
  - Abort fetch request on cancel
  - Remove file from upload queue
  - Show cancellation message
  - _Requirements: 30.5, 44.4_

- [x] 24. Implement rich text editor for comments
  - Integrate Tiptap editor
  - Add formatting toolbar
  - Implement @mentions
  - Add code block support
  - Render formatted comments
  - _Requirements: 32.1, 32.2, 32.3, 32.4, 32.5_

- [x] 24.1 Integrate Tiptap editor
  - Install Tiptap and extensions
  - Create TiptapEditor component
  - Configure editor with basic extensions
  - Style editor to match design
  - _Requirements: 32.1_

- [x] 24.2 Add formatting toolbar
  - Create toolbar with formatting buttons
  - Add bold, italic, underline buttons
  - Add list buttons (bullet, numbered)
  - Add link button
  - _Requirements: 32.2_

- [x] 24.3 Implement @mentions
  - Add mention extension to Tiptap
  - Create mention suggestion dropdown
  - Fetch users for mention suggestions
  - Insert mention on selection
  - _Requirements: 32.3_

- [x] 24.4 Add code block support
  - Add code block extension
  - Create code block button in toolbar
  - Style code blocks with syntax highlighting
  - Support multiple languages
  - _Requirements: 32.4_

- [x] 24.5 Render formatted comments
  - Parse comment HTML safely
  - Render with proper styling
  - Display mentions as clickable links
  - Display code blocks with highlighting
  - _Requirements: 32.5_

- [ ] 25. Implement mobile optimizations
  - Make all components responsive
  - Add touch-friendly controls
  - Optimize table views for mobile
  - Add swipe gestures
  - Test on various screen sizes
  - _Requirements: 41.1, 41.2, 41.3, 41.4, 41.5_

- [ ] 25.1 Make components responsive
  - Update layouts to use responsive breakpoints
  - Stack elements vertically on mobile
  - Adjust font sizes for mobile
  - Optimize spacing for small screens
  - _Requirements: 41.1, 41.5_

- [ ] 25.2 Add touch-friendly controls
  - Increase button sizes to 44x44px minimum
  - Add adequate padding to interactive elements
  - Implement touch feedback (active states)
  - Optimize dropdown menus for touch
  - _Requirements: 41.2_

- [ ] 25.3 Optimize table views for mobile
  - Convert tables to card view on mobile
  - Make columns collapsible
  - Add horizontal scroll for wide tables
  - Show most important columns first
  - _Requirements: 41.3_

- [ ] 25.4 Add swipe gestures
  - Implement swipe to refresh on ticket list
  - Add swipe actions on ticket cards (archive, delete)
  - Provide visual feedback for swipes
  - Make gestures optional (also provide buttons)
  - _Requirements: 41.4_


## Phase 6: Polish & Optimization

- [x] 26. Implement advanced search

  - Create advanced search dialog
  - Add multiple filter fields
  - Support date range filtering
  - Save recent searches
  - Display search results
  - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5_


- [x] 26.1 Create advanced search dialog
  - Add "Advanced Search" button
  - Create dialog with multiple filter fields
  - Add fields for status, priority, assignee, team, customer
  - Add date range pickers (created, updated, resolved)
  - _Requirements: 35.1, 35.2_

- [x] 26.2 Implement customer search
  - Add customer name/email search field
  - Fetch customers with autocomplete
  - Filter tickets by selected customer
  - _Requirements: 35.3_

- [x] 26.3 Implement ticket ID search
  - Add ticket ID search field
  - Support partial ID matching
  - Navigate directly to ticket if exact match
  - _Requirements: 35.4_


- [x] 26.4 Save recent searches
  - Store recent searches in localStorage
  - Display recent searches dropdown
  - Allow selecting recent search to reapply
  - Limit to last 10 searches
  - _Requirements: 35.5_

- [x] 27. Implement suggested actions
  - Display KB article suggestions on ticket detail
  - Show similar resolved tickets
  - Add quick action buttons
  - Suggest team assignment
  - Suggest priority based on keywords
  - _Requirements: 33.1, 33.2, 33.3, 33.4, 33.5_

- [x] 27.1 Display KB article suggestions
  - Fetch suggestions based on ticket content
  - Display suggested articles in sidebar
  - Show article titles and summaries
  - Add "View Article" links
  - _Requirements: 33.1_

- [x] 27.2 Show similar resolved tickets
  - Fetch similar tickets from API
  - Display ticket titles and resolution summaries
  - Add links to similar tickets
  - Show resolution time
  - _Requirements: 33.2_

- [x] 27.3 Add quick action buttons
  - Create quick action bar on ticket detail
  - Add "Assign", "Close", "Escalate" buttons
  - Show buttons based on permissions
  - Execute actions with one click
  - _Requirements: 33.3_

- [x] 27.4 Implement smart suggestions
  - Suggest team assignment based on ticket category
  - Suggest priority based on keywords (urgent, critical, etc.)
  - Display suggestions as hints
  - Allow accepting or dismissing suggestions
  - _Requirements: 33.4, 33.5_

- [x] 28. Implement ticket templates

  - Create template selector
  - Pre-fill form fields from template
  - Allow Admin_Manager to create templates
  - Categorize templates by issue type
  - Support personal templates
  - _Requirements: 38.1, 38.2, 38.3, 38.4, 38.5, 48.1, 48.2, 48.3, 48.4, 48.5_

- [x] 28.1 Create template selector
  - Add template dropdown to ticket creation form
  - Fetch templates from API
  - Display template names and descriptions
  - Show template categories
  - _Requirements: 38.1, 38.4, 48.2_


- [x] 28.2 Implement template application
  - Pre-fill form fields when template selected
  - Populate title, description, priority, category
  - Allow editing pre-filled values
  - Clear template selection if user changes fields
  - _Requirements: 38.2_

- [x] 28.3 Create template management (Admin_Manager)
  - Add "Manage Templates" page
  - Display list of templates
  - Add "Create Template" button
  - Show edit/delete buttons for each template
  - _Requirements: 38.3, 48.1_

- [x] 28.4 Implement template creation
  - Create form for new template
  - Add fields (name, description, category, default values)
  - Send POST request to store template
  - Verify API response confirms storage with creator ID
  - _Requirements: 48.1, 48.3_

- [x] 28.5 Support personal templates
  - Allow users to save their own templates
  - Store personal templates separately from global
  - Display personal templates in dropdown
  - Allow editing/deleting own templates
  - _Requirements: 38.5_

- [x] 29. Implement contextual help and tooltips


  - Add tooltips to all action buttons
  - Provide contextual help for form fields
  - Display inline help messages
  - Create help sidebar
  - Add onboarding tooltips
  - _Requirements: 42.1, 42.2, 42.3, 42.4, 42.5_

- [x] 29.1 Add tooltips to action buttons
  - Use Radix UI Tooltip component
  - Add descriptive tooltips to all buttons
  - Show keyboard shortcuts in tooltips
  - Position tooltips appropriately
  - _Requirements: 42.1_

- [x] 29.2 Add contextual help for forms
  - Add help text below form fields
  - Show validation requirements
  - Display examples for complex fields
  - Add info icons with detailed help
  - _Requirements: 42.2_

- [x] 29.3 Display inline help messages
  - Show help messages for complex features
  - Add collapsible help sections
  - Provide links to documentation
  - Make help dismissible
  - _Requirements: 42.3_

- [x] 29.4 Create help sidebar
  - Add help icon in header
  - Open sidebar with documentation
  - Organize help by topic
  - Add search functionality
  - _Requirements: 42.4_

- [x] 29.5 Implement onboarding tooltips
  - Detect first-time users
  - Show guided tour of key features
  - Add "Next" and "Skip" buttons
  - Store completion state in localStorage
  - _Requirements: 42.5_

- [x] 30. Implement undo functionality   
  - Add undo notification after actions
  - Allow undoing status changes
  - Allow undoing assignments
  - Allow undoing ticket closures
  - Display confirmation on undo
  - _Requirements: 43.1, 43.2, 43.3, 43.4, 43.5_

- [x] 30.1 Create undo notification system
  - Show toast notification after state-changing actions
  - Add "Undo" button to notification
  - Set 10-second timeout for undo
  - Store previous state for rollback
  - _Requirements: 43.1_

- [x] 30.2 Implement undo for status changes
  - Store previous status before update
  - Send PUT request to revert status on undo
  - Update UI immediately
  - Show confirmation message
  - _Requirements: 43.1, 43.3_

- [x] 30.3 Implement undo for assignments
  - Store previous assignee before update
  - Send POST request to revert assignment on undo
  - Update UI immediately
  - Show confirmation message
  - _Requirements: 43.2, 43.3_

- [x] 30.4 Implement undo for closures
  - Store previous status before closing
  - Send PUT request to reopen ticket on undo
  - Update UI immediately
  - Show confirmation message
  - _Requirements: 43.3, 43.5_

- [x] 31. Implement customizable dashboard
  - Allow rearranging widgets via drag-and-drop
  - Allow showing/hiding widgets
  - Save layout preferences
  - Provide preset layouts
  - Add reset to default option
  - _Requirements: 45.1, 45.2, 45.3, 45.4, 45.5, 47.2_

- [x] 31.1 Implement widget drag-and-drop
  - Use react-grid-layout for dashboard
  - Make widgets draggable
  - Allow resizing widgets
  - Show drop zones during drag
  - _Requirements: 45.1_

- [x] 31.2 Implement widget visibility controls
  - Add settings menu to dashboard
  - Show list of available widgets
  - Add toggle switches for each widget
  - Update dashboard when widgets toggled
  - _Requirements: 45.2_

- [x] 31.3 Save dashboard layout preferences
  - Store layout in localStorage with user ID
  - Save widget positions and sizes
  - Save widget visibility state
  - Load preferences on dashboard mount
  - _Requirements: 45.3, 47.2_

- [x] 31.4 Provide preset layouts
  - Create preset layouts for different roles
  - Add "Load Preset" dropdown
  - Apply preset layout on selection
  - Show preview of preset layouts
  - _Requirements: 45.4_


- [x] 31.5 Add reset to default
  - Add "Reset to Default" button
  - Show confirmation dialog
  - Clear saved preferences
  - Load default layout
  - _Requirements: 45.5_

- [x] 32. Performance optimization
  - Implement code splitting
  - Add memoization to expensive computations
  - Implement virtual scrolling for large lists
  - Optimize images and assets
  - Measure and improve performance metrics
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 64.1, 64.2, 64.3, 64.4, 64.5_

- [x] 32.1 Implement code splitting
  - Lazy load heavy components (Analytics, KB, TicketDetail)
  - Use React.lazy and Suspense
  - Add loading fallbacks
  - Measure bundle size reduction
  - _Requirements: 20.1_

- [x] 32.2 Add memoization
  - Use useMemo for filtered/sorted data
  - Use useCallback for event handlers
  - Memoize expensive permission checks
  - Profile and optimize re-renders
  - _Requirements: 20.2, 20.4_

- [x] 32.3 Implement virtual scrolling
  - Use @tanstack/react-virtual for large lists
  - Implement for ticket list (>100 items)
  - Implement for comment list
  - Measure scroll performance improvement
  - _Requirements: 20.3, 64.3_

- [x] 32.4 Optimize caching strategy
  - Configure SWR cache times appropriately
  - Implement cache invalidation on mutations
  - Use optimistic updates for better UX
  - Avoid redundant API calls
  - _Requirements: 20.5, 64.5_

- [x] 32.5 Measure performance metrics
  - Set up Web Vitals monitoring
  - Track page load times
  - Monitor API response times
  - Identify and fix performance bottlenecks
  - _Requirements: 64.4_

- [-] 33. Accessibility audit and fixes


  - Ensure WCAG 2.1 AA compliance
  - Test keyboard navigation
  - Add ARIA labels
  - Implement focus management
  - Test with screen readers
  - _Requirements: All accessibility requirements_

- [x] 33.1 Audit keyboard navigation


  - Test all interactive elements with keyboard
  - Ensure logical tab order
  - Add skip links
  - Fix any keyboard traps
  - _Requirements: Accessibility requirements_

- [ ] 33.2 Add ARIA labels
  - Add aria-label to icon buttons
  - Add aria-describedby for complex controls
  - Add aria-live regions for dynamic content
  - Add role attributes where needed
  - _Requirements: Accessibility requirements_

- [ ] 33.3 Implement focus management
  - Trap focus in modals
  - Return focus after modal closes
  - Highlight focused elements
  - Ensure visible focus indicators
  - _Requirements: Accessibility requirements_

- [ ] 33.4 Test with screen readers
  - Test with NVDA/JAWS on Windows
  - Test with VoiceOver on Mac
  - Fix any screen reader issues
  - Ensure all content is accessible
  - _Requirements: Accessibility requirements_

- [ ] 34. Browser compatibility testing
  - Test on Chrome, Firefox, Safari, Edge
  - Fix browser-specific issues
  - Add polyfills if needed
  - Display compatibility warnings
  - Document supported browsers
  - _Requirements: Browser compatibility requirements_

- [ ] 35. Final integration testing and bug fixes
  - Test complete user flows
  - Test with different user roles
  - Fix identified bugs
  - Optimize performance
  - Prepare for deployment
  - _Requirements: All requirements_

- [ ] 35.1 Test Admin_Manager flows
  - Test full ticket management
  - Test organization analytics
  - Test SLA management
  - Test escalation management
  - Test user management
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ] 35.2 Test Team_Leader flows
  - Test team ticket management
  - Test team analytics
  - Test team member assignment
  - Verify no access to other teams
  - Verify no access to admin features
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

- [ ] 35.3 Test User_Employee flows
  - Test ticket creation
  - Test viewing own tickets
  - Test viewing followed tickets
  - Test commenting
  - Verify no access to other tickets
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ] 35.4 Cross-browser testing
  - Test on latest Chrome
  - Test on latest Firefox
  - Test on latest Safari
  - Test on latest Edge
  - Fix any browser-specific issues
  - _Requirements: Browser compatibility requirements_

- [ ] 35.5 Performance testing
  - Test with large datasets (1000+ tickets)
  - Measure page load times
  - Test API response times
  - Optimize slow operations
  - Verify caching works correctly
  - _Requirements: Performance requirements_

- [ ] 35.6 Security testing
  - Verify RBAC enforcement
  - Test for XSS vulnerabilities
  - Test CSRF protection
  - Verify secure data storage
  - Test authentication flows
  - _Requirements: Security requirements_

- [ ] 35.7 Mobile testing
  - Test on iOS devices
  - Test on Android devices
  - Test various screen sizes
  - Verify touch interactions
  - Fix mobile-specific issues
  - _Requirements: Responsiveness requirements_

- [ ] 35.8 Final bug fixes and polish
  - Fix all identified bugs
  - Polish UI/UX details
  - Optimize performance
  - Update documentation
  - Prepare deployment checklist
  - _Requirements: All requirements_

## Notes

- Tasks marked with "*" are optional and can be skipped for MVP
- Each task should be completed and tested before moving to the next
- RBAC compliance must be verified at every step
- All API integrations should handle errors gracefully
- Performance should be monitored throughout development
