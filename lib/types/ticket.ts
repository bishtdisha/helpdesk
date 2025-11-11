import { Ticket, TicketStatus, TicketPriority, Customer, User, Team, Comment, TicketAttachment, TicketFollower, TicketHistory, TicketFeedback } from '@prisma/client';

// Re-export Prisma types
export type { Ticket, TicketStatus, TicketPriority, Customer, Comment, TicketAttachment, TicketFollower, TicketHistory, TicketFeedback } from '@prisma/client';

// Extended ticket with relationships
export interface TicketWithRelations extends Ticket {
  customer: Customer;
  creator: Pick<User, 'id' | 'name' | 'email'>;
  assignedUser?: Pick<User, 'id' | 'name' | 'email'> | null;
  team?: Team | null;
  comments?: (Comment & {
    author: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  attachments?: (TicketAttachment & {
    uploader: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  followers?: (TicketFollower & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  history?: (TicketHistory & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  feedback?: TicketFeedback | null;
}

// Ticket list item (lighter version for list views)
export interface TicketListItem {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string | null;
  customerId: string;
  customerName: string;
  assignedTo?: string | null;
  assigneeName?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  createdBy: string;
  creatorName: string;
  slaDueAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  commentCount?: number;
  followerCount?: number;
}

// Pagination result
export interface PaginatedTickets {
  data: TicketWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Ticket filters
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  teamId?: string;
  assignedTo?: string;
  createdBy?: string;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Ticket creation data
export interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  category?: string;
  customerId: string;
  teamId?: string;
}

// Ticket update data
export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedTo?: string;
  teamId?: string;
}

// Ticket assignment data
export interface AssignTicketData {
  assignedTo: string;
  teamId?: string;
}

// Ticket statistics
export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byPriority: Record<TicketPriority, number>;
}
