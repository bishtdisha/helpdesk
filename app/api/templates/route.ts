import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { TicketPriority } from '@prisma/client';
import { z } from 'zod';

// Validation schema for template creation
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  isGlobal: z.boolean().default(false),
});

// GET /api/templates - Fetch templates
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build where clause based on user permissions
    const whereClause: any = {
      OR: [
        { isGlobal: true }, // Global templates visible to all
        { createdBy: currentUser.id }, // Personal templates
      ],
    };

    if (category) {
      whereClause.category = category;
    }

    const templates = await prisma.ticketTemplate.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isGlobal: 'desc' }, // Global templates first
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      data: templates,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create template
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Check if user can create global templates (Admin_Manager only)
    if (validatedData.isGlobal) {
      if (currentUser.role?.name !== 'Admin_Manager') {
        return NextResponse.json(
          { error: 'Only Admin_Manager can create global templates' },
          { status: 403 }
        );
      }
    }

    const template = await prisma.ticketTemplate.create({
      data: {
        ...validatedData,
        createdBy: currentUser.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: template,
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}