import { prisma } from '../db';
import { SLAPolicy, TicketPriority, Ticket, TicketStatus } from '@prisma/client';
import { PermissionError } from '../rbac/errors';
import { RoleType } from '../types/rbac';
import { ROLE_TYPES } from '../rbac/permissions';

// Types for SLA operations
export interface CreateSLAPolicyData {
  name: string;
  description?: string;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
}

export interface UpdateSLAPolicyData {
  name?: string;
  description?: string;
  responseTimeHours?: number;
  resolutionTimeHours?: number;
  isActive?: boolean;
}

export interface SLAComplianceStatus {
  isCompliant: boolean;
  dueAt: Date | null;
  remainingTime: number; // in milliseconds
  breachRisk: 'low' | 'medium' | 'high';
}

export interface SLAViolation {
  ticketId: string;
  ticket: Ticket;
  policy: SLAPolicy | null;
  violationType: 'response' | 'resolution';
  dueAt: Date | null;
  actualTime: Date | null;
  delayHours: number;
}

export interface SLAFilters {
  teamId?: string;
  priority?: TicketPriority;
  startDate?: Date;
  endDate?: Date;
}

// Custom errors
export class SLAPolicyNotFoundError extends Error {
  constructor(policyId: string) {
    super(`SLA policy not found: ${policyId}`);
    this.name = 'SLAPolicyNotFoundError';
  }
}

export class SLAAccessDeniedError extends PermissionError {
  constructor(action: string) {
    super(
      `Access denied: Only Admin/Manager can ${action} SLA policies`,
      'SLA_ACCESS_DENIED',
      'sla:manage',
      403
    );
  }
}

/**
 * SLA Service
 * Handles SLA policy management, calculation, and monitoring
 */
export class SLAService {
  /**
   * Check if user is Admin/Manager
   */
  private async isAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    return user?.role?.name === ROLE_TYPES.ADMIN_MANAGER;
  }

  /**
   * Get user's role name
   */
  private async getUserRole(userId: string): Promise<RoleType | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    return (user?.role?.name as RoleType) || null;
  }

  /**
   * Get team IDs for a user (including teams they lead)
   */
  private async getUserTeamIds(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teamLeaderships: true,
      },
    });

    if (!user) return [];

    const teamIds: string[] = [];
    
    // Add user's own team
    if (user.teamId) {
      teamIds.push(user.teamId);
    }

    // Add teams the user leads
    if (user.teamLeaderships && user.teamLeaderships.length > 0) {
      teamIds.push(...user.teamLeaderships.map(tl => tl.teamId));
    }

    return [...new Set(teamIds)]; // Remove duplicates
  }

  /**
   * Create a new SLA policy (Admin only)
   */
  async createPolicy(data: CreateSLAPolicyData, userId: string): Promise<SLAPolicy> {
    // Check if user is Admin
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      throw new SLAAccessDeniedError('create');
    }

    // Validate input
    if (data.responseTimeHours <= 0 || data.resolutionTimeHours <= 0) {
      throw new Error('Response and resolution times must be positive numbers');
    }

    if (data.responseTimeHours > data.resolutionTimeHours) {
      throw new Error('Response time cannot be greater than resolution time');
    }

    // Create the policy
    const policy = await prisma.sLAPolicy.create({
      data: {
        name: data.name,
        description: data.description,
        priority: data.priority,
        responseTimeHours: data.responseTimeHours,
        resolutionTimeHours: data.resolutionTimeHours,
        isActive: true,
      },
    });

    return policy;
  }

  /**
   * Update an SLA policy (Admin only)
   */
  async updatePolicy(
    policyId: string,
    data: UpdateSLAPolicyData,
    userId: string
  ): Promise<SLAPolicy> {
    // Check if user is Admin
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      throw new SLAAccessDeniedError('update');
    }

    // Check if policy exists
    const existingPolicy = await prisma.sLAPolicy.findUnique({
      where: { id: policyId },
    });

    if (!existingPolicy) {
      throw new SLAPolicyNotFoundError(policyId);
    }

    // Validate input if times are being updated
    const responseTime = data.responseTimeHours ?? existingPolicy.responseTimeHours;
    const resolutionTime = data.resolutionTimeHours ?? existingPolicy.resolutionTimeHours;

    if (responseTime <= 0 || resolutionTime <= 0) {
      throw new Error('Response and resolution times must be positive numbers');
    }

    if (responseTime > resolutionTime) {
      throw new Error('Response time cannot be greater than resolution time');
    }

    // Update the policy
    const policy = await prisma.sLAPolicy.update({
      where: { id: policyId },
      data: {
        name: data.name,
        description: data.description,
        responseTimeHours: data.responseTimeHours,
        resolutionTimeHours: data.resolutionTimeHours,
        isActive: data.isActive,
      },
    });

    return policy;
  }

  /**
   * Delete an SLA policy (Admin only)
   */
  async deletePolicy(policyId: string, userId: string): Promise<void> {
    // Check if user is Admin
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      throw new SLAAccessDeniedError('delete');
    }

    // Check if policy exists
    const existingPolicy = await prisma.sLAPolicy.findUnique({
      where: { id: policyId },
    });

    if (!existingPolicy) {
      throw new SLAPolicyNotFoundError(policyId);
    }

    // Delete the policy
    await prisma.sLAPolicy.delete({
      where: { id: policyId },
    });
  }

  /**
   * Get all SLA policies
   */
  async getPolicies(userId: string): Promise<SLAPolicy[]> {
    // All authenticated users can view policies
    const policies = await prisma.sLAPolicy.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: 'desc' }, // URGENT first, then HIGH, MEDIUM, LOW
        { createdAt: 'asc' },
      ],
    });

    return policies;
  }

  /**
   * Get a specific SLA policy by ID
   */
  async getPolicy(policyId: string, userId: string): Promise<SLAPolicy> {
    const policy = await prisma.sLAPolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new SLAPolicyNotFoundError(policyId);
    }

    return policy;
  }

  /**
   * Get SLA policy for a specific ticket priority
   */
  async getPolicyForPriority(priority: TicketPriority): Promise<SLAPolicy | null> {
    const policy = await prisma.sLAPolicy.findFirst({
      where: {
        priority,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent policy for this priority
      },
    });

    return policy;
  }

  /**
   * Calculate SLA due date for a ticket based on its priority
   */
  async calculateSLADueDate(ticket: Ticket): Promise<Date | null> {
    // Get the SLA policy for this ticket's priority
    const policy = await this.getPolicyForPriority(ticket.priority);
    
    if (!policy) {
      return null; // No SLA policy defined for this priority
    }

    // Calculate due date based on ticket creation time + resolution time
    const createdAt = ticket.createdAt;
    const resolutionTimeMs = policy.resolutionTimeHours * 60 * 60 * 1000;
    const dueDate = new Date(createdAt.getTime() + resolutionTimeMs);

    return dueDate;
  }

  /**
   * Get effective SLA due date for a ticket (custom SLA takes priority)
   */
  async getEffectiveSLADueDate(ticket: Ticket): Promise<Date | null> {
    // If custom SLA is set, use it (user override)
    if (ticket.customSlaDueAt) {
      return ticket.customSlaDueAt;
    }
    
    // Otherwise use default SLA
    return ticket.slaDueAt || await this.calculateSLADueDate(ticket);
  }

  /**
   * Check SLA compliance for a ticket
   */
  async checkSLACompliance(ticket: Ticket): Promise<SLAComplianceStatus> {
    // Get the SLA policy for this ticket's priority
    const policy = await this.getPolicyForPriority(ticket.priority);
    
    if (!policy) {
      // No SLA policy, consider it compliant
      return {
        isCompliant: true,
        dueAt: null,
        remainingTime: 0,
        breachRisk: 'low',
      };
    }

    // Get effective SLA due date (custom SLA takes priority over default)
    const dueAt = await this.getEffectiveSLADueDate(ticket);
    
    if (!dueAt) {
      return {
        isCompliant: true,
        dueAt: null,
        remainingTime: 0,
        breachRisk: 'low',
      };
    }

    const now = new Date();
    const remainingTime = dueAt.getTime() - now.getTime();

    // Check if ticket is resolved or closed
    const isResolved = ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED;
    
    if (isResolved) {
      // Check if it was resolved before the due date
      const resolvedAt = ticket.resolvedAt || ticket.closedAt;
      if (resolvedAt) {
        const isCompliant = resolvedAt.getTime() <= dueAt.getTime();
        return {
          isCompliant,
          dueAt,
          remainingTime: 0,
          breachRisk: 'low',
        };
      }
    }

    // For open tickets, check remaining time
    const isCompliant = remainingTime > 0;
    
    // Calculate breach risk based on remaining time
    let breachRisk: 'low' | 'medium' | 'high' = 'low';
    
    if (remainingTime < 0) {
      breachRisk = 'high'; // Already breached
    } else {
      const totalTime = policy.resolutionTimeHours * 60 * 60 * 1000;
      const percentRemaining = (remainingTime / totalTime) * 100;
      
      if (percentRemaining < 10) {
        breachRisk = 'high'; // Less than 10% time remaining
      } else if (percentRemaining < 25) {
        breachRisk = 'medium'; // Less than 25% time remaining
      } else {
        breachRisk = 'low';
      }
    }

    return {
      isCompliant,
      dueAt,
      remainingTime,
      breachRisk,
    };
  }

  /**
   * Update ticket SLA due date
   * Should be called when ticket is created or priority changes
   */
  async updateTicketSLADueDate(ticketId: string): Promise<void> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const dueDate = await this.calculateSLADueDate(ticket);

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        slaDueAt: dueDate,
      },
    });
  }

  /**
   * Get SLA violations with role-based filtering
   */
  async getSLAViolations(filters: SLAFilters, userId: string): Promise<SLAViolation[]> {
    const userRole = await this.getUserRole(userId);
    
    if (!userRole) {
      throw new Error('User role not found');
    }

    // Build where clause based on filters
    // Note: We need to check both slaDueAt and customSlaDueAt
    const where: any = {
      OR: [
        {
          // Tickets with default or custom SLA set
          OR: [
            { slaDueAt: { not: null } },
            { customSlaDueAt: { not: null } },
          ],
        },
      ],
    };

    // Apply role-based filtering
    if (userRole === ROLE_TYPES.TEAM_LEADER) {
      const teamIds = await this.getUserTeamIds(userId);
      if (teamIds.length > 0) {
        where.teamId = { in: teamIds };
      } else {
        // Team leader with no teams sees no violations
        return [];
      }
    }

    // Apply additional filters
    if (filters.teamId) {
      where.teamId = filters.teamId;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Get tickets with violations
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        slaDueAt: 'asc',
      },
    });

    // Build violation objects
    const violations: SLAViolation[] = [];

    for (const ticket of tickets) {
      const policy = await this.getPolicyForPriority(ticket.priority);
      const effectiveDueDate = await this.getEffectiveSLADueDate(ticket);
      
      if (!effectiveDueDate) continue;
      
      // Determine violation type and actual time
      let violationType: 'response' | 'resolution' = 'resolution';
      let actualTime: Date | null = null;
      
      if (ticket.resolvedAt) {
        actualTime = ticket.resolvedAt;
      } else if (ticket.closedAt) {
        actualTime = ticket.closedAt;
      } else {
        // Still open, use current time
        actualTime = new Date();
      }

      // Check if there's actually a violation
      if (actualTime.getTime() <= effectiveDueDate.getTime()) {
        continue; // No violation
      }

      // Calculate delay in hours
      const delayMs = actualTime.getTime() - effectiveDueDate.getTime();
      const delayHours = Math.max(0, delayMs / (1000 * 60 * 60));

      violations.push({
        ticketId: ticket.id,
        ticket,
        policy,
        violationType,
        dueAt: effectiveDueDate,
        actualTime,
        delayHours,
      });
    }

    return violations;
  }

  /**
   * Get SLA compliance metrics
   */
  async getSLAComplianceMetrics(filters: SLAFilters, userId: string): Promise<{
    totalTickets: number;
    compliantTickets: number;
    violatedTickets: number;
    complianceRate: number;
    averageResolutionTime: number;
    violations: SLAViolation[];
  }> {
    const userRole = await this.getUserRole(userId);
    
    if (!userRole) {
      throw new Error('User role not found');
    }

    // Build base where clause
    const where: any = {
      slaDueAt: { not: null },
    };

    // Apply role-based filtering
    if (userRole === ROLE_TYPES.TEAM_LEADER) {
      const teamIds = await this.getUserTeamIds(userId);
      if (teamIds.length > 0) {
        where.teamId = { in: teamIds };
      } else {
        // Team leader with no teams
        return {
          totalTickets: 0,
          compliantTickets: 0,
          violatedTickets: 0,
          complianceRate: 0,
          averageResolutionTime: 0,
          violations: [],
        };
      }
    }

    // Apply additional filters
    if (filters.teamId) {
      where.teamId = filters.teamId;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Get all tickets with SLA
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        customer: true,
        creator: true,
        assignedUser: true,
        team: true,
      },
    });

    const totalTickets = tickets.length;
    let compliantTickets = 0;
    let violatedTickets = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    const violations: SLAViolation[] = [];

    for (const ticket of tickets) {
      const compliance = await this.checkSLACompliance(ticket);
      
      if (compliance.isCompliant) {
        compliantTickets++;
      } else {
        violatedTickets++;
        
        // Add to violations list
        const policy = await this.getPolicyForPriority(ticket.priority);
        const actualTime = ticket.resolvedAt || ticket.closedAt || new Date();
        const delayMs = ticket.slaDueAt 
          ? actualTime.getTime() - ticket.slaDueAt.getTime()
          : 0;
        const delayHours = Math.max(0, delayMs / (1000 * 60 * 60));

        violations.push({
          ticketId: ticket.id,
          ticket,
          policy,
          violationType: 'resolution',
          dueAt: ticket.slaDueAt,
          actualTime,
          delayHours,
        });
      }

      // Calculate resolution time for resolved/closed tickets
      if (ticket.resolvedAt || ticket.closedAt) {
        const resolvedAt = ticket.resolvedAt || ticket.closedAt!;
        const resolutionTime = resolvedAt.getTime() - ticket.createdAt.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    }

    const complianceRate = totalTickets > 0 
      ? (compliantTickets / totalTickets) * 100 
      : 100;

    const averageResolutionTime = resolvedCount > 0 
      ? totalResolutionTime / resolvedCount / (1000 * 60 * 60) // Convert to hours
      : 0;

    return {
      totalTickets,
      compliantTickets,
      violatedTickets,
      complianceRate,
      averageResolutionTime,
      violations,
    };
  }
}

// Export singleton instance
export const slaService = new SLAService();
