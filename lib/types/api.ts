// API Response Types for Frontend Integration

import { 
  TicketWithRelations, 
  PaginatedTickets, 
  TicketListItem,
  TicketStats 
} from './ticket';
import { User } from '@prisma/client';

// Generic API Response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generic Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error Response
export interface APIError {
  error: string;
  code?: string;
  message?: string;
  details?: any;
  statusCode?: number;
}

// Ticket API Responses
export type GetTicketsResponse = PaginatedResponse<TicketWithRelations>;

export interface GetTicketResponse {
  ticket: TicketWithRelations;
}

export interface CreateTicketResponse {
  ticket: TicketWithRelations;
  message: string;
}

export interface UpdateTicketResponse {
  ticket: TicketWithRelations;
  message: string;
}

export interface AssignTicketResponse {
  ticket: TicketWithRelations;
  message: string;
}

// Comment API Responses
export interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  ticketId: string;
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentResponse {
  comment: Comment;
  message: string;
}

// Attachment API Responses
export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  ticketId: string;
  uploaderId: string;
  uploader: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: Date;
}

export interface UploadAttachmentResponse {
  attachment: Attachment;
  message: string;
}

// Follower API Responses
export interface Follower {
  id: string;
  userId: string;
  ticketId: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  createdAt: Date;
}

export interface AddFollowerResponse {
  follower: Follower;
  message: string;
}

// Notification API Responses
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  ticketId?: string | null;
  createdAt: Date;
}

export type GetNotificationsResponse = PaginatedResponse<Notification>;

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  ticketAssigned: boolean;
  ticketUpdated: boolean;
  ticketCommented: boolean;
  slaWarning: boolean;
  escalation: boolean;
}

// Analytics API Responses
export interface AnalyticsData {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTime: number;
  slaComplianceRate: number;
  customerSatisfactionScore?: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByTeam?: Record<string, number>;
  trends?: {
    date: string;
    count: number;
  }[];
}

export interface OrganizationAnalyticsResponse {
  analytics: AnalyticsData;
  teamPerformance: {
    teamId: string;
    teamName: string;
    ticketCount: number;
    averageResolutionTime: number;
    slaComplianceRate: number;
  }[];
}

export interface TeamAnalyticsResponse {
  analytics: AnalyticsData;
  agentPerformance: {
    userId: string;
    userName: string;
    assignedTickets: number;
    resolvedTickets: number;
    averageResolutionTime: number;
  }[];
}

// Knowledge Base API Responses
export interface KBArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  visibility: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'email'>;
  views: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type GetKBArticlesResponse = PaginatedResponse<KBArticle>;

export interface KBArticleSuggestion {
  article: KBArticle;
  relevanceScore: number;
}

export interface GetKBSuggestionsResponse {
  suggestions: KBArticleSuggestion[];
}

// SLA API Responses
export interface SLAPolicy {
  id: string;
  name: string;
  description?: string;
  priority: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SLAViolation {
  id: string;
  ticketId: string;
  ticket: TicketListItem;
  policyId: string;
  policy: SLAPolicy;
  violationType: 'RESPONSE' | 'RESOLUTION';
  dueAt: Date;
  violatedAt: Date;
  delayMinutes: number;
}

export interface GetSLAPoliciesResponse {
  policies: SLAPolicy[];
}

export type GetSLAViolationsResponse = PaginatedResponse<SLAViolation>;

// Escalation API Responses
export interface EscalationRule {
  id: string;
  name: string;
  description?: string;
  conditionType: string;
  conditionValue: any;
  actionType: string;
  actionConfig: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetEscalationRulesResponse {
  rules: EscalationRule[];
}

export interface EvaluateEscalationResponse {
  triggered: boolean;
  rules: {
    ruleId: string;
    ruleName: string;
    action: string;
  }[];
  message: string;
}

// Auth API Responses
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin/Manager' | 'Team Leader' | 'User/Employee';
  teamIds?: string[];
}

export interface GetCurrentUserResponse {
  user: AuthUser;
}

export interface LoginResponse {
  user: AuthUser;
  message: string;
}

// Export API Response
export interface ExportResponse {
  fileUrl: string;
  fileName: string;
  message: string;
}

// Ticket History
export interface TicketHistoryItem {
  id: string;
  ticketId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'email'>;
  action: string;
  changes: any;
  createdAt: Date;
}

export interface GetTicketHistoryResponse {
  history: TicketHistoryItem[];
}

// Feedback
export interface TicketFeedback {
  id: string;
  ticketId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface SubmitFeedbackResponse {
  feedback: TicketFeedback;
  message: string;
}
