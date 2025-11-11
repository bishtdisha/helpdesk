import { escalationMonitorJob } from './escalation-monitor';
import { slaMonitorJob } from './sla-monitor';

interface JobStats {
  name: string;
  lastRun: Date | null;
  lastSuccess: Date | null;
  lastFailure: Date | null;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
}

/**
 * Job Scheduler
 * Manages scheduled background jobs for the application
 * 
 * Note: This is a basic implementation. In production, consider using:
 * - node-cron for cron-style scheduling
 * - Bull or BullMQ for robust job queues
 * - Agenda for MongoDB-backed job scheduling
 */
export class JobScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isStarted = false;
  private jobStats: Map<string, JobStats> = new Map();

  /**
   * Start all scheduled jobs
   */
  start(): void {
    if (this.isStarted) {
      console.log('[Job Scheduler] Already started');
      return;
    }

    console.log('[Job Scheduler] Starting scheduled jobs...');

    // Schedule SLA monitor job to run every 15 minutes
    this.scheduleJob(
      'sla-monitor',
      15 * 60 * 1000, // 15 minutes in milliseconds
      async () => {
        await slaMonitorJob.execute();
      }
    );

    // Schedule escalation monitor job to run every 30 minutes
    this.scheduleJob(
      'escalation-monitor',
      30 * 60 * 1000, // 30 minutes in milliseconds
      async () => {
        await escalationMonitorJob.execute();
      }
    );

    this.isStarted = true;
    console.log('[Job Scheduler] All jobs scheduled successfully');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    if (!this.isStarted) {
      console.log('[Job Scheduler] Not started');
      return;
    }

    console.log('[Job Scheduler] Stopping all scheduled jobs...');

    // Clear all intervals
    this.intervals.forEach((interval, jobName) => {
      clearInterval(interval);
      console.log(`[Job Scheduler] Stopped job: ${jobName}`);
    });

    this.intervals.clear();
    this.isStarted = false;
    console.log('[Job Scheduler] All jobs stopped');
  }

  /**
   * Schedule a job to run at a specific interval
   */
  private scheduleJob(
    name: string,
    intervalMs: number,
    jobFunction: () => Promise<void>
  ): void {
    // Run immediately on startup with retry logic
    this.executeJobWithRetry(name, jobFunction);

    // Schedule recurring execution
    const interval = setInterval(async () => {
      await this.executeJobWithRetry(name, jobFunction);
    }, intervalMs);

    this.intervals.set(name, interval);
    console.log(`[Job Scheduler] Scheduled job: ${name} (interval: ${intervalMs}ms)`);
  }

  /**
   * Execute a job with retry logic
   */
  private async executeJobWithRetry(
    name: string,
    jobFunction: () => Promise<void>,
    maxRetries: number = 3,
    retryDelayMs: number = 5000
  ): Promise<void> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    // Initialize stats if not exists
    if (!this.jobStats.has(name)) {
      this.jobStats.set(name, {
        name,
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        totalRuns: 0,
        successCount: 0,
        failureCount: 0,
        averageDuration: 0,
      });
    }

    const stats = this.jobStats.get(name)!;
    stats.lastRun = new Date();
    stats.totalRuns++;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await jobFunction();
        
        // Success - update stats
        const duration = Date.now() - startTime;
        stats.lastSuccess = new Date();
        stats.successCount++;
        stats.averageDuration = 
          (stats.averageDuration * (stats.successCount - 1) + duration) / stats.successCount;
        
        // Log if this was a retry
        if (attempt > 1) {
          console.log(`[Job Scheduler] Job ${name} succeeded on attempt ${attempt}`);
        }
        
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(
          `[Job Scheduler] Job ${name} failed on attempt ${attempt}/${maxRetries}:`,
          lastError.message
        );

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          console.log(`[Job Scheduler] Retrying job ${name} in ${retryDelayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    // All retries failed - update stats
    stats.lastFailure = new Date();
    stats.failureCount++;

    console.error(
      `[Job Scheduler] Job ${name} failed after ${maxRetries} attempts. Last error:`,
      lastError?.message
    );
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(jobName: string): Promise<void> {
    console.log(`[Job Scheduler] Manually triggering job: ${jobName}`);

    switch (jobName) {
      case 'sla-monitor':
        await slaMonitorJob.execute();
        break;
      case 'escalation-monitor':
        await escalationMonitorJob.execute();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus(): {
    isStarted: boolean;
    jobs: Array<{
      name: string;
      isScheduled: boolean;
      stats: JobStats | null;
    }>;
  } {
    const jobs = Array.from(this.intervals.keys()).map(name => ({
      name,
      isScheduled: true,
      stats: this.jobStats.get(name) || null,
    }));

    return {
      isStarted: this.isStarted,
      jobs,
    };
  }

  /**
   * Get statistics for a specific job
   */
  getJobStats(jobName: string): JobStats | null {
    return this.jobStats.get(jobName) || null;
  }

  /**
   * Get statistics for all jobs
   */
  getAllJobStats(): JobStats[] {
    return Array.from(this.jobStats.values());
  }
}

// Export singleton instance
export const jobScheduler = new JobScheduler();

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('[Job Scheduler] SIGTERM received, stopping jobs...');
    jobScheduler.stop();
  });

  process.on('SIGINT', () => {
    console.log('[Job Scheduler] SIGINT received, stopping jobs...');
    jobScheduler.stop();
  });
}
