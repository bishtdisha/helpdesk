import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { getTicketFilterForUser } from '@/lib/dashboard-helpers';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get role-based filter
    const ticketFilter = await getTicketFilterForUser(currentUser.id);

    // Get all feedback (filtered by role - only feedback for tickets user can access)
    const feedback = await prisma.ticketFeedback.findMany({
      where: {
        ticket: ticketFilter,
      },
      select: {
        rating: true,
        createdAt: true,
      },
    });

    if (feedback.length === 0) {
      return NextResponse.json({
        score: 0,
        totalResponses: 0,
        trend: 0,
      });
    }

    // Calculate average score
    const totalScore = feedback.reduce((sum, f) => sum + f.rating, 0);
    const avgScore = totalScore / feedback.length;

    // Calculate trend (last 30 days vs previous 30 days)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentPeriodFeedback = feedback.filter(f => f.createdAt >= last30Days);
    const currentAvg = currentPeriodFeedback.length > 0
      ? currentPeriodFeedback.reduce((sum, f) => sum + f.rating, 0) / currentPeriodFeedback.length
      : 0;

    const previousPeriodFeedback = feedback.filter(f =>
      f.createdAt >= previous30Days && f.createdAt < last30Days
    );
    const previousAvg = previousPeriodFeedback.length > 0
      ? previousPeriodFeedback.reduce((sum, f) => sum + f.rating, 0) / previousPeriodFeedback.length
      : 0;

    const trend = previousAvg > 0 ? currentAvg - previousAvg : 0;

    return NextResponse.json({
      score: avgScore,
      totalResponses: feedback.length,
      trend,
    });
  } catch (error) {
    console.error('Error fetching CSAT KPI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
