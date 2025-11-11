/**
 * Performance Testing Script
 * Tests system performance with large data volumes
 * Requirements: All (Performance Optimization)
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

interface TestResult {
  testName: string;
  duration: number;
  recordCount: number;
  throughput: number;
  success: boolean;
  error?: string;
}

class PerformanceTester {
  private results: TestResult[] = [];

  /**
   * Run a performance test
   */
  async runTest(
    testName: string,
    testFn: () => Promise<number>,
    targetThroughput?: number
  ): Promise<void> {
    console.log(`\nRunning: ${testName}...`);
    const startTime = performance.now();

    try {
      const recordCount = await testFn();
      const duration = performance.now() - startTime;
      const throughput = (recordCount / duration) * 1000; // records per second

      const result: TestResult = {
        testName,
        duration,
        recordCount,
        throughput,
        success: targetThroughput ? throughput >= targetThroughput : true,
      };

      this.results.push(result);

      console.log(`✓ Completed in ${duration.toFixed(2)}ms`);
      console.log(`  Records: ${recordCount}`);
      console.log(`  Throughput: ${throughput.toFixed(2)} records/sec`);

      if (targetThroughput && throughput < targetThroughput) {
        console.log(
          `  ⚠️  Below target throughput of ${targetThroughput} records/sec`
        );
      }
    } catch (error: any) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        duration,
        recordCount: 0,
        throughput: 0,
        success: false,
        error: error.message,
      });

      console.log(`✗ Failed: ${error.message}`);
    }
  }

  /**
   * Print summary
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;

    console.log(`\nTotal Tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    console.log('\nDetailed Results:');
    console.table(
      this.results.map((r) => ({
        Test: r.testName,
        Duration: `${r.duration.toFixed(2)}ms`,
        Records: r.recordCount,
        'Throughput (rec/sec)': r.throughput.toFixed(2),
        Status: r.success ? '✓' : '✗',
      }))
    );

    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }
  }
}

async function runPerformanceTests() {
  const tester = new PerformanceTester();

  console.log('Starting Performance Tests...');
  console.log('='.repeat(80));

  // Test 1: Ticket List Query Performance
  await tester.runTest(
    'Ticket List Query (1000 records)',
    async () => {
      const tickets = await prisma.ticket.findMany({
        take: 1000,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      });
      return tickets.length;
    },
    100 // Target: 100 records/sec
  );

  // Test 2: Ticket Detail Query Performance
  await tester.runTest(
    'Ticket Detail Query (with relations)',
    async () => {
      const tickets = await prisma.ticket.findMany({
        take: 10,
        include: {
          customer: true,
          assignedUser: true,
          team: true,
          comments: true,
          attachments: true,
          followers: true,
        },
      });
      return tickets.length;
    },
    5 // Target: 5 records/sec
  );

  // Test 3: Ticket Search Performance
  await tester.runTest(
    'Ticket Search Query',
    async () => {
      const tickets = await prisma.ticket.findMany({
        where: {
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        take: 100,
      });
      return tickets.length;
    },
    50 // Target: 50 records/sec
  );

  // Test 4: User Permission Query Performance
  await tester.runTest(
    'User with Role Query',
    async () => {
      const users = await prisma.user.findMany({
        take: 100,
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });
      return users.length;
    },
    50 // Target: 50 records/sec
  );

  // Test 5: Team Tickets Query Performance
  await tester.runTest(
    'Team Tickets Query',
    async () => {
      const teams = await prisma.team.findMany({
        take: 10,
        include: {
          tickets: {
            take: 50,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return teams.reduce((sum, team) => sum + team.tickets.length, 0);
    },
    20 // Target: 20 records/sec
  );

  // Test 6: Notification Query Performance
  await tester.runTest(
    'User Notifications Query',
    async () => {
      const users = await prisma.user.findMany({
        take: 10,
      });

      let totalNotifications = 0;
      for (const user of users) {
        const notifications = await prisma.notification.findMany({
          where: { userId: user.id },
          take: 50,
          orderBy: { createdAt: 'desc' },
        });
        totalNotifications += notifications.length;
      }

      return totalNotifications;
    },
    100 // Target: 100 records/sec
  );

  // Test 7: Knowledge Base Search Performance
  await tester.runTest(
    'Knowledge Base Search',
    async () => {
      const articles = await prisma.knowledgeBaseArticle.findMany({
        where: {
          OR: [
            { title: { contains: 'guide', mode: 'insensitive' } },
            { content: { contains: 'guide', mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        take: 50,
      });
      return articles.length;
    },
    30 // Target: 30 records/sec
  );

  // Test 8: Analytics Aggregation Performance
  await tester.runTest(
    'Ticket Status Aggregation',
    async () => {
      const statusCounts = await prisma.ticket.groupBy({
        by: ['status'],
        _count: true,
      });
      return statusCounts.length;
    },
    10 // Target: 10 aggregations/sec
  );

  // Test 9: Ticket History Query Performance
  await tester.runTest(
    'Ticket History Query',
    async () => {
      const tickets = await prisma.ticket.findMany({
        take: 10,
      });

      let totalHistory = 0;
      for (const ticket of tickets) {
        const history = await prisma.ticketHistory.findMany({
          where: { ticketId: ticket.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        totalHistory += history.length;
      }

      return totalHistory;
    },
    50 // Target: 50 records/sec
  );

  // Test 10: Bulk Insert Performance
  await tester.runTest(
    'Bulk Notification Insert',
    async () => {
      const users = await prisma.user.findMany({ take: 10 });

      const notifications = users.map((user) => ({
        userId: user.id,
        type: 'TICKET_CREATED' as any,
        title: 'Performance Test Notification',
        message: 'This is a test notification',
        isRead: false,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      // Cleanup
      await prisma.notification.deleteMany({
        where: {
          title: 'Performance Test Notification',
        },
      });

      return notifications.length;
    },
    100 // Target: 100 records/sec
  );

  // Test 11: Complex Join Query Performance
  await tester.runTest(
    'Complex Join Query (Tickets with all relations)',
    async () => {
      const tickets = await prisma.ticket.findMany({
        take: 5,
        include: {
          customer: true,
          assignedUser: {
            include: {
              role: true,
            },
          },
          creator: true,
          team: {
            include: {
              teamLeaders: {
                include: {
                  user: true,
                },
              },
            },
          },
          comments: {
            include: {
              author: true,
            },
          },
          attachments: {
            include: {
              uploader: true,
            },
          },
          followers: {
            include: {
              user: true,
            },
          },
          history: {
            include: {
              user: true,
            },
          },
          feedback: true,
        },
      });
      return tickets.length;
    },
    2 // Target: 2 records/sec
  );

  // Test 12: Concurrent Query Performance
  await tester.runTest(
    'Concurrent Queries (10 parallel)',
    async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        prisma.ticket.findMany({
          take: 10,
          skip: i * 10,
          orderBy: { createdAt: 'desc' },
        })
      );

      const results = await Promise.all(promises);
      return results.reduce((sum, tickets) => sum + tickets.length, 0);
    },
    50 // Target: 50 records/sec
  );

  // Print summary
  tester.printSummary();

  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('\nBased on test results:');
  console.log('1. Monitor slow queries and add indexes as needed');
  console.log('2. Implement caching for frequently accessed data');
  console.log('3. Use pagination for large result sets');
  console.log('4. Consider database connection pooling');
  console.log('5. Optimize complex joins with selective field loading');
  console.log('6. Use batch operations for bulk inserts/updates');
  console.log('7. Implement read replicas for analytics queries');
  console.log('8. Monitor database cache hit ratio (target > 95%)');
}

// Run tests
runPerformanceTests()
  .then(() => {
    console.log('\n✅ Performance testing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Performance testing failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
