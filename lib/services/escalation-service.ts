import { prisma } from '../db';
import { EscalationRule, Ticket, TicketPriority, TicketStatus, User } from '@prisma/client';
import { PermissionError } from '../rbac/errors';
import { RoleType } from '../types/rbac';
import { ROLE_TYPES } from '../rbac/permissions';
import { notificationService } from './notification-service';
import { followerService } from './follower-service';

// Escalation condition types
export type EscalationConditionType = 
  | 'sla_breach'
  | 'time_in_status'
  | 'priority_level'
  | 'no_response'
  | 'customer_rating';

// Escalation action types
export type EscalationActionType = 
  | 'notify_manager'
  | 'reassign_ticket'
  | 'increase_priority'
  | 'add_follower'
  | 'send_email';

// Types for escalation operations
export interface CreateEscalationRuleData {
  name: string;
  description?: string;
  conditionType: EscalationConditionType;
  conditionValue: any;
  actionType: EscalationActionType;
  actionConfig: any;
}

export interface UpdateEscalationRuleData {
  name?: string;
  description?: string;
  conditionValue?: any;
  actionConfig?: any;
  isActive?: boolean;
}

export interface EscalationAction {
  rule: EscalationRule;
  ticket: Ticket;
  executedAt: Date;
  result: string;
}

// Custom errors
export class EscalationRuleNotFoundError extends Error {
  constructor(ruleId: string) {
    super(`Escalation rule not found: ${ruleId}`);
    this.name = 'EscalationRuleNotFoundError';
  }
}

export class EscalationAccessDeniedError extends PermissionError {
  constructor(action: string) {
    super(
      `Access denied: Only Admin/Manager can ${action} escalation rules`,
      'ESCALATION_ACCESS_DENIED',
      'escalation:manage',
      403
    );
  }
}

/**
 * Escalation Service
 * Handles escalation rule management, evaluation, and execution
 */
export class EscalationService {
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
   * Create a new escalation rule (Admin only)
   */
  async createRule(data: CreateEscalationRuleData, userId: string): Promise<EscalationRule> {
    // Check if user is Admin
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      throw new EscalationAccessDeniedError('create');
    }

    // Validate condition type
    const validConditionTypes: EscalationConditionType[] = [
      'sla_breach',
      'time_in_status',
      'priority_level',
      'no_response',
      'customer_rating',
    ];

    if (!validConditionTypes.includes(data.conditionType)) {
      throw new Error(`Invalid condition type: ${data.conditionType}`);
    }

    // Validate action type
    const validActionTypes: EscalationActionType[] = [
      'notify_manager',
      'reassign_ticket',
      'increase_priority',
      'add_follower',
      'send_email',
    ];

    if (!validActionTypes.includes(data.actionType)) {
      throw new Error(`Invalid action type: ${data.actionType}`);
    }

    // Create the rule
    const rule = await prisma.escalationRule.create({
      data: {
        name: data.name,
        description: data.description,
        conditionType: data.conditionType,
        conditionValue: data.conditionValue,
        actionType: data.actionType,
        actionConfig: data.actionConfig,
        isActive: true,
      },
    });

    return rule;
  }

  /**
   * Update an escalation rule (Admin only)
   */
  async updateRule(
    ruleId: string,
    data: UpdateEscalationRuleData,
    userId: string
  ): Promise<EscalationRule> {
    // Check if user is Admin
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      throw new EscalationAccessDeniedError('update');
    }

    // Check if rule exists
    const existingRule = await prisma.escalationRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule) {
      throw new EscalationRuleNotFoundError(ruleId);
    }

    // Update the rule
    const rule = await prisma.escalationRule.update({
      where: { id: ruleId },
      data: {
        name: data.name,
        description: data.description,
        conditionValue: data.conditionValue,
        actionConfig: data.actionConfig,
        isActive: data.isActive,
      },
    });

    return rule;
  }

  /**
   * Delete an escalation rule (Admin only)
   */
  async deleteRule(ruleId: string, userId: string): Promise<void> {
    // Check if user is Admin
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      throw new EscalationAccessDeniedError('delete');
    }

    // Check if rule exists
    const existingRule = await prisma.escalationRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule) {
      throw new EscalationRuleNotFoundError(ruleId);
    }

    // Delete the rule
    await prisma.escalationRule.delete({
      where: { id: ruleId },
    });
  }

  /**
   * Get all escalation rules
   */
  async getRules(userId: string): Promise<EscalationRule[]> {
    // All authenticated users can view rules
    const rules = await prisma.escalationRule.findMany({
      where: { isActive: true },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return rules;
  }

  /**
   * Get a specific escalation rule by ID
   */
  async getRule(ruleId: string, userId: string): Promise<EscalationRule> {
    const rule = await prisma.escalationRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new EscalationRuleNotFoundError(ruleId);
    }

    return rule;
  }

  /**
   * Evaluate a ticket against all active escalation rules
   * Returns applicable escalation actions
   */
  async evaluateTicket(ticket: Ticket): Promise<EscalationAction[]> {
    // Get all active rules
    const rules = await prisma.escalationRule.findMany({
      where: { isActive: true },
    });

    const applicableActions: EscalationAction[] = [];

    for (const rule of rules) {
      const shouldEscalate = await this.evaluateCondition(ticket, rule);
      
      if (shouldEscalate) {
        applicableActions.push({
          rule,
          ticket,
          executedAt: new Date(),
          result: 'pending',
        });
      }
    }

    return applicableActions;
  }

  /**
   * Evaluate a specific condition for a ticket
   */
  private async evaluateCondition(ticket: Ticket, rule: EscalationRule): Promise<boolean> {
    const conditionType = rule.conditionType as EscalationConditionType;
    const conditionValue = rule.conditionValue as any;

    switch (conditionType) {
      case 'sla_breach':
        return this.evaluateSLABreach(ticket, conditionValue);

      case 'time_in_status':
        return this.evaluateTimeInStatus(ticket, conditionValue);

      case 'priority_level':
        return this.evaluatePriorityLevel(ticket, conditionValue);

      case 'no_response':
        return this.evaluateNoResponse(ticket, conditionValue);

      case 'customer_rating':
        return this.evaluateCustomerRating(ticket, conditionValue);

      default:
        return false;
    }
  }

  /**
   * Evaluate SLA breach condition
   */
  private async evaluateSLABreach(ticket: Ticket, conditionValue: any): Promise<boolean> {
    // Check if ticket has SLA due date
    if (!ticket.slaDueAt) {
      return false;
    }

    const now = new Date();
    const dueAt = ticket.slaDueAt;

    // Check if SLA is breached or about to breach
    const timeUntilBreach = dueAt.getTime() - now.getTime();
    const hoursUntilBreach = timeUntilBreach / (1000 * 60 * 60);

    // Condition value can specify threshold in hours
    const thresholdHours = conditionValue?.thresholdHours || 0;

    // Escalate if already breached or within threshold
    return hoursUntilBreach <= thresholdHours;
  }

  /**
   * Evaluate time in status condition
   */
  private async evaluateTimeInStatus(ticket: Ticket, conditionValue: any): Promise<boolean> {
    const targetStatus = conditionValue?.status as TicketStatus;
    const thresholdHours = conditionValue?.hours || 0;

    // Check if ticket is in the target status
    if (ticket.status !== targetStatus) {
      return false;
    }

    // Get the most recent status change from ticket history
    const lastStatusChange = await prisma.ticketHistory.findFirst({
      where: {
        ticketId: ticket.id,
        action: 'status_changed',
        newValue: targetStatus,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastStatusChange) {
      // Use ticket creation time if no status change found
      const timeInStatus = Date.now() - ticket.createdAt.getTime();
      const hoursInStatus = timeInStatus / (1000 * 60 * 60);
      return hoursInStatus >= thresholdHours;
    }

    const timeInStatus = Date.now() - lastStatusChange.createdAt.getTime();
    const hoursInStatus = timeInStatus / (1000 * 60 * 60);

    return hoursInStatus >= thresholdHours;
  }

  /**
   * Evaluate priority level condition
   */
  private async evaluatePriorityLevel(ticket: Ticket, conditionValue: any): Promise<boolean> {
    const targetPriorities = conditionValue?.priorities as TicketPriority[];
    
    if (!targetPriorities || !Array.isArray(targetPriorities)) {
      return false;
    }

    return targetPriorities.includes(ticket.priority);
  }

  /**
   * Evaluate no response condition
   */
  private async evaluateNoResponse(ticket: Ticket, conditionValue: any): Promise<boolean> {
    const thresholdHours = conditionValue?.hours || 0;

    // Get the most recent comment on the ticket
    const lastComment = await prisma.comment.findFirst({
      where: {
        ticketId: ticket.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let lastActivityTime: Date;

    if (lastComment) {
      lastActivityTime = lastComment.createdAt;
    } else {
      // No comments, use ticket creation time
      lastActivityTime = ticket.createdAt;
    }

    const timeSinceActivity = Date.now() - lastActivityTime.getTime();
    const hoursSinceActivity = timeSinceActivity / (1000 * 60 * 60);

    return hoursSinceActivity >= thresholdHours;
  }

  /**
   * Evaluate customer rating condition
   */
  private async evaluateCustomerRating(ticket: Ticket, conditionValue: any): Promise<boolean> {
    const thresholdRating = conditionValue?.rating || 0;
    const operator = conditionValue?.operator || 'less_than'; // 'less_than' or 'greater_than'

    // Get ticket feedback
    const feedback = await prisma.ticketFeedback.findFirst({
      where: {
        ticketId: ticket.id,
      },
    });

    if (!feedback || feedback.rating === null) {
      return false;
    }

    if (operator === 'less_than') {
      return feedback.rating < thresholdRating;
    } else if (operator === 'greater_than') {
      return feedback.rating > thresholdRating;
    }

    return false;
  }

  /**
   * Execute escalation action for a ticket
   */
  async executeEscalation(ticket: Ticket, rule: EscalationRule): Promise<string> {
    const actionType = rule.actionType as EscalationActionType;
    const actionConfig = rule.actionConfig as any;

    try {
      let result: string;

      switch (actionType) {
        case 'notify_manager':
          result = await this.executeNotifyManager(ticket, actionConfig);
          break;

        case 'reassign_ticket':
          result = await this.executeReassignTicket(ticket, actionConfig);
          break;

        case 'increase_priority':
          result = await this.executeIncreasePriority(ticket, actionConfig);
          break;

        case 'add_follower':
          result = await this.executeAddFollower(ticket, actionConfig);
          break;

        case 'send_email':
          result = await this.executeSendEmail(ticket, actionConfig);
          break;

        default:
          result = `Unknown action type: ${actionType}`;
      }

      // Log escalation in ticket history
      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          userId: 'system', // System-initiated action
          action: 'escalation_executed',
          fieldName: 'escalation_rule',
          oldValue: null,
          newValue: `Rule: ${rule.name}, Action: ${actionType}, Result: ${result}`,
        },
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log escalation failure
      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          userId: 'system',
          action: 'escalation_failed',
          fieldName: 'escalation_rule',
          oldValue: null,
          newValue: `Rule: ${rule.name}, Action: ${actionType}, Error: ${errorMessage}`,
        },
      });

      throw error;
    }
  }

  /**
   * Execute notify_manager action
   */
  private async executeNotifyManager(ticket: Ticket, actionConfig: any): Promise<string> {
    // Get ticket with team information
    const ticketWithTeam = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        team: {
          include: {
            teamLeaders: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!ticketWithTeam?.team) {
      return 'No team assigned to ticket';
    }

    // Get team leaders
    const teamLeaders = ticketWithTeam.team.teamLeaders.map(tl => tl.user);

    if (teamLeaders.length === 0) {
      // No team leaders, notify admins
      const admins = await prisma.user.findMany({
        where: {
          role: {
            name: ROLE_TYPES.ADMIN_MANAGER,
          },
        },
      });

      for (const admin of admins) {
        await notificationService.sendEscalationNotification(ticketWithTeam, admin.id, actionConfig.message || 'Ticket escalated');
      }

      return `Notified ${admins.length} admin(s)`;
    }

    // Notify team leaders
    for (const leader of teamLeaders) {
      await notificationService.sendEscalationNotification(ticketWithTeam, leader.id, actionConfig.message || 'Ticket escalated');
    }

    return `Notified ${teamLeaders.length} team leader(s)`;
  }

  /**
   * Execute reassign_ticket action
   */
  private async executeReassignTicket(ticket: Ticket, actionConfig: any): Promise<string> {
    const targetUserId = actionConfig?.userId;
    const targetTeamId = actionConfig?.teamId;

    if (!targetUserId && !targetTeamId) {
      return 'No target user or team specified';
    }

    const updateData: any = {};

    if (targetUserId) {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!user) {
        return `User not found: ${targetUserId}`;
      }

      updateData.assignedTo = targetUserId;
    }

    if (targetTeamId) {
      // Verify team exists
      const team = await prisma.team.findUnique({
        where: { id: targetTeamId },
      });

      if (!team) {
        return `Team not found: ${targetTeamId}`;
      }

      updateData.teamId = targetTeamId;
    }

    // Update ticket
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: updateData,
    });

    // Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        userId: 'system',
        action: 'reassigned',
        fieldName: 'assignment',
        oldValue: ticket.assignedTo || 'unassigned',
        newValue: targetUserId || 'team reassignment',
      },
    });

    return `Ticket reassigned to ${targetUserId ? 'user' : 'team'}`;
  }

  /**
   * Execute increase_priority action
   */
  private async executeIncreasePriority(ticket: Ticket, actionConfig: any): Promise<string> {
    const priorityOrder: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const currentIndex = priorityOrder.indexOf(ticket.priority);

    if (currentIndex === priorityOrder.length - 1) {
      return 'Ticket already at highest priority';
    }

    const newPriority = priorityOrder[currentIndex + 1];

    // Update ticket priority
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        priority: newPriority,
      },
    });

    // Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        userId: 'system',
        action: 'priority_changed',
        fieldName: 'priority',
        oldValue: ticket.priority,
        newValue: newPriority,
      },
    });

    // Recalculate SLA due date
    const slaService = await import('./sla-service');
    await slaService.slaService.updateTicketSLADueDate(ticket.id);

    return `Priority increased from ${ticket.priority} to ${newPriority}`;
  }

  /**
   * Execute add_follower action
   */
  private async executeAddFollower(ticket: Ticket, actionConfig: any): Promise<string> {
    const userIds = actionConfig?.userIds as string[];

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return 'No users specified';
    }

    let addedCount = 0;

    for (const userId of userIds) {
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          continue;
        }

        // Check if already a follower
        const isFollower = await followerService.isFollower(ticket.id, userId);
        
        if (!isFollower) {
          await followerService.addFollower(ticket.id, userId, 'system');
          addedCount++;
        }
      } catch (error) {
        // Continue with next user
        continue;
      }
    }

    return `Added ${addedCount} follower(s)`;
  }

  /**
   * Execute send_email action
   */
  private async executeSendEmail(ticket: Ticket, actionConfig: any): Promise<string> {
    const recipients = actionConfig?.recipients as string[];
    const subject = actionConfig?.subject || 'Ticket Escalation';
    const message = actionConfig?.message || 'This ticket has been escalated';

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return 'No recipients specified';
    }

    // In a real implementation, this would send actual emails
    // For now, we'll create notifications
    for (const recipientId of recipients) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: recipientId },
        });

        if (user) {
          await notificationService.sendEscalationNotification(ticket, recipientId, message);
        }
      } catch (error) {
        // Continue with next recipient
        continue;
      }
    }

    return `Email sent to ${recipients.length} recipient(s)`;
  }
}

// Export singleton instance
export const escalationService = new EscalationService();
