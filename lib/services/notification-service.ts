import { prisma } from '@/lib/db';
import { NotificationType, Ticket, User, Comment } from '@prisma/client';

export interface NotificationPreferences {
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

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationService {
  sendTicketCreatedNotification(ticket: Ticket): Promise<void>;
  sendTicketAssignedNotification(ticket: Ticket, assignee: User): Promise<void>;
  sendTicketStatusChangedNotification(ticket: Ticket, oldStatus: string): Promise<void>;
  sendTicketCommentNotification(ticket: Ticket, comment: Comment): Promise<void>;
  sendTicketResolvedNotification(ticket: Ticket): Promise<void>;
  sendSLABreachNotification(ticket: Ticket): Promise<void>;
  sendEscalationNotification(ticket: Ticket, userId: string, message: string): Promise<void>;
  getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null>;
  updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
}

class NotificationServiceImpl implements NotificationService {
  /**
   * Send notification when a ticket is created
   */
  async sendTicketCreatedNotification(ticket: Ticket): Promise<void> {
    // Get ticket creator and followers
    const recipients = await this.getTicketRecipients(ticket.id);
    
    // Filter out the creator (they don't need to be notified about their own creation)
    const filteredRecipients = recipients.filter(r => r !== ticket.createdBy);
    
    const title = 'New Ticket Created';
    const message = `Ticket #${ticket.id.substring(0, 8)} "${ticket.title}" has been created`;
    
    await this.createNotifications(
      filteredRecipients,
      NotificationType.TICKET_CREATED,
      title,
      message,
      ticket.id,
      'notifyOnCreation'
    );
  }

  /**
   * Send notification when a ticket is assigned
   */
  async sendTicketAssignedNotification(ticket: Ticket, assignee: User): Promise<void> {
    if (!ticket.assignedTo) return;
    
    // Get ticket creator and followers
    const recipients = await this.getTicketRecipients(ticket.id);
    
    const title = 'Ticket Assigned';
    const message = `Ticket #${ticket.id.substring(0, 8)} "${ticket.title}" has been assigned to ${assignee.name || assignee.email}`;
    
    await this.createNotifications(
      recipients,
      NotificationType.TICKET_ASSIGNED,
      title,
      message,
      ticket.id,
      'notifyOnAssignment'
    );
  }

  /**
   * Send notification when ticket status changes
   */
  async sendTicketStatusChangedNotification(ticket: Ticket, oldStatus: string): Promise<void> {
    // Get ticket creator and followers
    const recipients = await this.getTicketRecipients(ticket.id);
    
    const title = 'Ticket Status Changed';
    const message = `Ticket #${ticket.id.substring(0, 8)} "${ticket.title}" status changed from ${oldStatus} to ${ticket.status}`;
    
    await this.createNotifications(
      recipients,
      NotificationType.TICKET_STATUS_CHANGED,
      title,
      message,
      ticket.id,
      'notifyOnStatusChange'
    );
  }

  /**
   * Send notification when a comment is added to a ticket
   */
  async sendTicketCommentNotification(ticket: Ticket, comment: Comment): Promise<void> {
    // Get ticket creator and followers
    const recipients = await this.getTicketRecipients(ticket.id);
    
    // Filter out the comment author (they don't need to be notified about their own comment)
    const filteredRecipients = recipients.filter(r => r !== comment.authorId);
    
    // Get comment author info
    const author = await prisma.user.findUnique({
      where: { id: comment.authorId },
      select: { name: true, email: true }
    });
    
    const title = 'New Comment on Ticket';
    const message = `${author?.name || author?.email || 'Someone'} commented on ticket #${ticket.id.substring(0, 8)} "${ticket.title}"`;
    
    await this.createNotifications(
      filteredRecipients,
      NotificationType.TICKET_COMMENT,
      title,
      message,
      ticket.id,
      'notifyOnComment'
    );
  }

  /**
   * Send notification when a ticket is resolved
   */
  async sendTicketResolvedNotification(ticket: Ticket): Promise<void> {
    // Get ticket creator and followers
    const recipients = await this.getTicketRecipients(ticket.id);
    
    const title = 'Ticket Resolved';
    const message = `Ticket #${ticket.id.substring(0, 8)} "${ticket.title}" has been resolved`;
    
    await this.createNotifications(
      recipients,
      NotificationType.TICKET_RESOLVED,
      title,
      message,
      ticket.id,
      'notifyOnResolution'
    );
  }

  /**
   * Send notification when SLA is breached
   */
  async sendSLABreachNotification(ticket: Ticket): Promise<void> {
    // Get ticket creator, assignee, and followers
    const recipients = await this.getTicketRecipients(ticket.id);
    
    // Also notify team leaders and admins
    const teamLeadersAndAdmins = await this.getTeamLeadersAndAdmins(ticket.teamId);
    const allRecipients = [...new Set([...recipients, ...teamLeadersAndAdmins])];
    
    const title = 'SLA Breach Alert';
    const message = `Ticket #${ticket.id.substring(0, 8)} "${ticket.title}" has breached its SLA`;
    
    await this.createNotifications(
      allRecipients,
      NotificationType.SLA_BREACH,
      title,
      message,
      ticket.id,
      'notifyOnSLABreach'
    );
  }

  /**
   * Send notification when a ticket is escalated
   */
  async sendEscalationNotification(ticket: Ticket, userId: string, message: string): Promise<void> {
    const title = 'Ticket Escalated';
    const notificationMessage = message || `Ticket #${ticket.id.substring(0, 8)} "${ticket.title}" has been escalated`;
    
    await this.createNotifications(
      [userId],
      NotificationType.ESCALATION,
      title,
      notificationMessage,
      ticket.id,
      'notifyOnStatusChange' // Use status change preference for escalations
    );
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    });
    
    return preferences;
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const updated = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences
      }
    });
    
    return updated;
  }

  /**
   * Helper: Get all recipients for a ticket (creator + followers)
   */
  private async getTicketRecipients(ticketId: string): Promise<string[]> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        followers: {
          select: { userId: true }
        }
      }
    });
    
    if (!ticket) return [];
    
    const recipients = [ticket.createdBy];
    
    // Add all followers
    ticket.followers.forEach(follower => {
      if (!recipients.includes(follower.userId)) {
        recipients.push(follower.userId);
      }
    });
    
    // Add assignee if exists
    if (ticket.assignedTo && !recipients.includes(ticket.assignedTo)) {
      recipients.push(ticket.assignedTo);
    }
    
    return recipients;
  }

  /**
   * Helper: Get team leaders and admins for escalation notifications
   */
  private async getTeamLeadersAndAdmins(teamId?: string | null): Promise<string[]> {
    const recipients: string[] = [];
    
    // Get admins
    const admins = await prisma.user.findMany({
      where: {
        role: {
          name: 'Admin/Manager'
        }
      },
      select: { id: true }
    });
    
    recipients.push(...admins.map(a => a.id));
    
    // Get team leaders for the specific team
    if (teamId) {
      const teamLeaders = await prisma.teamLeader.findMany({
        where: { teamId },
        select: { userId: true }
      });
      
      teamLeaders.forEach(tl => {
        if (!recipients.includes(tl.userId)) {
          recipients.push(tl.userId);
        }
      });
    }
    
    return recipients;
  }

  /**
   * Helper: Create notifications for multiple recipients with preference filtering
   */
  private async createNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    ticketId: string,
    preferenceKey: keyof NotificationPreferences
  ): Promise<void> {
    // Get preferences for all users
    const preferences = await prisma.notificationPreferences.findMany({
      where: {
        userId: { in: userIds }
      }
    });
    
    // Create a map of user preferences
    const preferencesMap = new Map(
      preferences.map(p => [p.userId, p])
    );
    
    // Filter users based on their preferences
    const notificationsToCreate = userIds
      .filter(userId => {
        const userPrefs = preferencesMap.get(userId);
        
        // If no preferences exist, use defaults (all enabled)
        if (!userPrefs) return true;
        
        // Check if in-app notifications are enabled
        if (!userPrefs.inAppEnabled) return false;
        
        // Check specific preference
        return userPrefs[preferenceKey] !== false;
      })
      .map(userId => ({
        userId,
        type,
        title,
        message,
        ticketId,
        isRead: false
      }));
    
    // Bulk create notifications
    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate
      });
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationServiceImpl();
