import { prisma } from '../db';
import { TicketStatus } from '@prisma/client';
import { escalationService } from '../services/escalation-service';

/**
 * Escalation Monitor Job
 * Periodically evaluates all open tickets against escalation rules
 * and executes applicable escalation actions
 */
export class EscalationMonitorJob {
  private isRunning = false;

  /**
   * Execute the escalation monitoring job
   */
  async execute(): Promise<{
    ticketsEvaluated: number;
    escalationsExecuted: number;
    errors: string[];
  }> {
    // Prevent concurrent execution
    if (this.isRunning) {
      console.log('Escalation monitor job is already running, skipping...');
      return {
        ticketsEvaluated: 0,
        escalationsExecuted: 0,
        errors: ['Job already running'],
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let ticketsEvaluated = 0;
    let escalationsExecuted = 0;

    try {
      console.log('[Escalation Monitor] Starting escalation monitoring job...');

      // Get all open tickets (not resolved or closed)
      const openTickets = await prisma.ticket.findMany({
        where: {
          status: {
            notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
          },
        },
        include: {
          customer: true,
          creator: true,
          assignedUser: true,
          team: true,
        },
      });

      console.log(`[Escalation Monitor] Found ${openTickets.length} open tickets to evaluate`);

      // Evaluate each ticket against escalation rules
      for (const ticket of openTickets) {
        try {
          ticketsEvaluated++;

          // Get applicable escalation actions for this ticket
          const applicableActions = await escalationService.evaluateTicket(ticket);

          if (applicableActions.length > 0) {
            console.log(
              `[Escalation Monitor] Ticket ${ticket.id} has ${applicableActions.length} applicable escalation(s)`
            );

            // Execute each escalation action
            for (const action of applicableActions) {
              try {
                const result = await escalationService.executeEscalation(ticket, action.rule);
                escalationsExecuted++;
                
                console.log(
                  `[Escalation Monitor] Executed escalation for ticket ${ticket.id}: ${result}`
                );
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const errorLog = `Failed to execute escalation for ticket ${ticket.id}: ${errorMessage}`;
                errors.push(errorLog);
                console.error(`[Escalation Monitor] ${errorLog}`);
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorLog = `Failed to evaluate ticket ${ticket.id}: ${errorMessage}`;
          errors.push(errorLog);
          console.error(`[Escalation Monitor] ${errorLog}`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[Escalation Monitor] Job completed in ${duration}ms. ` +
        `Evaluated: ${ticketsEvaluated}, Escalated: ${escalationsExecuted}, Errors: ${errors.length}`
      );

      return {
        ticketsEvaluated,
        escalationsExecuted,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Escalation Monitor] Job failed: ${errorMessage}`);
      errors.push(`Job failed: ${errorMessage}`);
      
      return {
        ticketsEvaluated,
        escalationsExecuted,
        errors,
      };
    } finally {
      this.isRunning = false;
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
export const escalationMonitorJob = new EscalationMonitorJob();
