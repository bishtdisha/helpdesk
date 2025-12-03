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

    // Get all tickets with categories (filtered by role)
    const tickets = await prisma.ticket.findMany({
      where: ticketFilter,
      select: {
        category: true,
      },
    });

    // Count tickets by category
    const categoryCount: Record<string, number> = {};
    tickets.forEach(ticket => {
      const category = ticket.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // Convert to array and sort by count
    const categories = Object.entries(categoryCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / tickets.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 categories

    return NextResponse.json({
      categories,
      total: tickets.length,
    });
  } catch (error) {
    console.error('Error fetching top categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
