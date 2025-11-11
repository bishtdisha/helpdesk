# Background Jobs

This directory contains background jobs for the ticket management system.

## Available Jobs

### 1. SLA Monitor Job (`sla-monitor.ts`)

Monitors SLA compliance for all open tickets and sends notifications for tickets approaching or breaching their SLA.

**Features:**
- Runs every 15 minutes
- Checks all open tickets with SLA due dates
- Identifies tickets with high/medium breach risk
- Sends notifications to ticket creators, assignees, team leaders, and followers
- Logs SLA status checks in ticket history

**Configuration:**
- Interval: 15 minutes
- Breach risk levels:
  - **High**: Already breached or < 10% time remaining
  - **Medium**: < 25% time remaining
  - **Low**: > 25% time remaining

### 2. Escalation Monitor Job (`escalation-monitor.ts`)

Evaluates all open tickets against escalation rules and executes applicable escalation actions.

**Features:**
- Runs every 30 minutes
- Evaluates all open tickets against active escalation rules
- Executes escalation actions (notify, reassign, increase priority, etc.)
- Logs escalation executions in ticket history

**Configuration:**
- Interval: 30 minutes
- Supports multiple escalation condition types:
  - SLA breach
  - Time in status
  - Priority level
  - No response
  - Customer rating

## Job Scheduler

The `JobScheduler` class manages all background jobs with the following features:

### Features

1. **Automatic Scheduling**: Jobs run at configured intervals
2. **Retry Logic**: Failed jobs are automatically retried (up to 3 attempts)
3. **Error Handling**: Errors are logged and don't crash the scheduler
4. **Job Statistics**: Tracks execution metrics for monitoring
5. **Manual Triggering**: Jobs can be manually triggered for testing
6. **Graceful Shutdown**: Properly stops all jobs on process termination

### Usage

```typescript
import { jobScheduler } from '@/lib/jobs/scheduler';

// Start all scheduled jobs
jobScheduler.start();

// Get scheduler status
const status = jobScheduler.getStatus();
console.log('Scheduler status:', status);

// Get statistics for a specific job
const stats = jobScheduler.getJobStats('sla-monitor');
console.log('SLA Monitor stats:', stats);

// Manually trigger a job
await jobScheduler.triggerJob('sla-monitor');

// Stop all jobs
jobScheduler.stop();
```

### Job Statistics

Each job tracks the following metrics:
- `lastRun`: Timestamp of last execution
- `lastSuccess`: Timestamp of last successful execution
- `lastFailure`: Timestamp of last failed execution
- `totalRuns`: Total number of executions
- `successCount`: Number of successful executions
- `failureCount`: Number of failed executions
- `averageDuration`: Average execution time in milliseconds

## Starting Jobs in Production

To start the background jobs in your application, add the following to your server startup code:

```typescript
// In your main server file (e.g., server.ts or app startup)
import { jobScheduler } from '@/lib/jobs/scheduler';

// Start the scheduler when the server starts
jobScheduler.start();

// The scheduler will automatically handle graceful shutdown on SIGTERM/SIGINT
```

## Testing Jobs

You can manually test jobs using the scheduler:

```typescript
import { jobScheduler } from '@/lib/jobs/scheduler';

// Test SLA monitor
const slaResult = await jobScheduler.triggerJob('sla-monitor');
console.log('SLA Monitor result:', slaResult);

// Test escalation monitor
const escalationResult = await jobScheduler.triggerJob('escalation-monitor');
console.log('Escalation Monitor result:', escalationResult);
```

## Monitoring

Monitor job health using the statistics API:

```typescript
import { jobScheduler } from '@/lib/jobs/scheduler';

// Get all job statistics
const allStats = jobScheduler.getAllJobStats();

// Check for failing jobs
const failingJobs = allStats.filter(stat => 
  stat.failureCount > 0 && 
  stat.lastFailure && 
  stat.lastFailure > (stat.lastSuccess || new Date(0))
);

if (failingJobs.length > 0) {
  console.error('Failing jobs detected:', failingJobs);
}
```

## Production Considerations

For production deployments, consider:

1. **Job Queue System**: Replace the basic scheduler with a robust job queue like Bull, BullMQ, or Agenda
2. **Distributed Locking**: Ensure only one instance runs each job in multi-server deployments
3. **Monitoring**: Integrate with monitoring tools (Datadog, New Relic, etc.)
4. **Alerting**: Set up alerts for job failures
5. **Logging**: Use structured logging for better observability
6. **Database Connection Pooling**: Ensure proper connection management
7. **Resource Limits**: Monitor memory and CPU usage
8. **Graceful Degradation**: Handle database unavailability gracefully

## Troubleshooting

### Jobs Not Running

1. Check if scheduler is started: `jobScheduler.getStatus()`
2. Check for errors in logs
3. Verify database connectivity
4. Check job statistics for failure patterns

### High Failure Rate

1. Review error logs for specific failures
2. Check database query performance
3. Verify notification service is working
4. Check for resource constraints (memory, CPU)

### Performance Issues

1. Monitor job execution duration
2. Optimize database queries
3. Add indexes for frequently queried fields
4. Consider reducing job frequency
5. Implement batch processing for large datasets
