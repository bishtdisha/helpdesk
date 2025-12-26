import { prisma } from '../db';
import { TicketStatus } from '@prisma/client';
import { slaService } from '../services/sla-service';


/**
 * SLA Monitor Job
 * Periodically checks SLA compliance for all open tickets
 * and sends notifications for tickets approaching or breaching SLA
 */
export class SLAMonitorJob {
  private isRunning = false;

  /**
   * Execute the SLA monitoring job
   */
  async execute(): Promise<{
    ticketsChecked: number;
    breachRiskNotifications: number;
    breachedTickets: number;
    errors: string[];
  }> {
    // Prevent concurrent execution
    if (this.isRunning) {
      console.log('[SLA Monitor] Job is already running, skipping...');
      return {
        ticketsChecked: 0,
        breachRiskNotifications: 0,
        breachedTickets: 0,
        errors: ['Job already running'],
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let ticketsChecked = 0;
    let breachRiskNotifications = 0;
    let breachedTickets = 0;

    try {
      console.log('[SLA Monitor] Starting SLA monitoring job...');

      // Get all open tickets with SLA due dates
      const openTickets = await prisma.ticket.findMany({
        where: {
          status: {
            notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
          },
          slaDueAt: {
            not: null,
          },
        },
        include: {
          customer: true,
          creator: true,
          assignedUser: true,
          team: {
            include: {
              teamLeaders: {
                include: {
                  user: true,
                },
              },
            },
          },
          followers: {
            include: {
              user: true,
            },
          },
        },
      });

      console.log(`[SLA Monitor] Found ${openTickets.length} open tickets with SLA to check`);

      // Check each ticket's SLA compliance
      for (const ticket of openTickets) {
        try {
          ticketsChecked++;

          // Check SLA compliance status
          const complianceStatus = await slaService.checkSLACompliance(ticket);

          // Handle tickets based on breach risk
          if (complianceStatus.breachRisk === 'high') {
            breachedTickets++;

            // Send breach risk notifications
            const notificationsSent = await this.sendBreachRiskNotifications(
              ticket,
              complianceStatus
            );
            breachRiskNotifications += notificationsSent;

            console.log(
              `[SLA Monitor] Ticket ${ticket.id} has high breach risk. ` +
              `Remaining time: ${Math.round(complianceStatus.remainingTime / (1000 * 60))} minutes. ` +
              `Sent ${notificationsSent} notification(s).`
            );
          } else if (complianceStatus.breachRisk === 'medium') {
            // Send warning notifications for medium risk
            const notificationsSent = await this.sendBreachRiskNotifications(
              ticket,
              complianceStatus
            );
            breachRiskNotifications += notificationsSent;

            console.log(
              `[SLA Monitor] Ticket ${ticket.id} has medium breach risk. ` +
              `Remaining time: ${Math.round(complianceStatus.remainingTime / (1000 * 60 * 60))} hours. ` +
              `Sent ${notificationsSent} notification(s).`
            );
          }

          // Update ticket SLA status if needed
          await this.updateTicketSLAStatus(ticket.id, complianceStatus);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorLog = `Failed to check SLA for ticket ${ticket.id}: ${errorMessage}`;
          errors.push(errorLog);
          console.error(`[SLA Monitor] ${errorLog}`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[SLA Monitor] Job completed in ${duration}ms. ` +
        `Checked: ${ticketsChecked}, Breach Risk Notifications: ${breachRiskNotifications}, ` +
        `Breached: ${breachedTickets}, Errors: ${errors.length}`
      );

      return {
        ticketsChecked,
        breachRiskNotifications,
        breachedTickets,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SLA Monitor] Job failed: ${errorMessage}`);
      errors.push(`Job failed: ${errorMessage}`);
      
      return {
        ticketsChecked,
        breachRiskNotifications,
        breachedTickets,
        errors,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Send breach risk notifications to relevant users
   */
  private async sendBreachRiskNotifications(
    ticket: any,
    _complianceStatus: any
  ): Promise<number> {
    const notificationsSent = 0;
    const recipientIds = new Set<string>();

    try {
      // Add ticket creator
      if (ticket.createdBy) {
        recipientIds.add(ticket.createdBy);
      }

      // Add assigned user
      if (ticket.assignedTo) {
        recipientIds.add(ticket.assignedTo);
      }

      // Add team leaders
      if (ticket.team?.teamLeaders) {
        for (const teamLeader of ticket.team.teamLeaders) {
          recipientIds.add(teamLeader.userId);
        }
      }

      // Add followers
      if (ticket.followers) {
        for (const follower of ticket.followers) {
          recipientIds.add(follower.userId);
        }
      }

      return notificationsSent;
    } catch (error) {
      console.error(
        `[SLA Monitor] Error sending breach risk notifications:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      return notificationsSent;
    }
  }

  /**
   * Update ticket SLA status in history
   */
  private async updateTicketSLAStatus(
    ticketId: string,
    complianceStatus: any
  ): Promise<void> {
    try {
      // Check if we already logged this status recently (within last hour)
      const recentHistory = await prisma.ticketHistory.findFirst({
        where: {
          ticketId,
          action: 'sla_status_checked',
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      // Only log if we haven't logged recently or if status changed
      if (!recentHistory) {
        await prisma.ticketHistory.create({
          data: {
            ticketId,
            userId: 'system',
            action: 'sla_status_checked',
            fieldName: 'sla_compliance',
            oldValue: null,
            newValue: JSON.stringify({
              isCompliant: complianceStatus.isCompliant,
              breachRisk: complianceStatus.breachRisk,
              remainingTime: complianceStatus.remainingTime,
              checkedAt: new Date().toISOString(),
            }),
          },
        });
      }
    } catch (error) {
      console.error(
        `[SLA Monitor] Failed to update ticket SLA status:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Check if the job is currently running
   */
  isJobRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const slaMonitorJob = new SLAMonitorJob();
