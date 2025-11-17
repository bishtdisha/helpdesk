import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/db';
import { TicketPriority } from '@prisma/client';
import { z } from 'zod';

// Validation schema for template updates
const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  isGlobal: z.boolean().optional(),
});

// GET /api/templates/[id] - Fetch single template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.ticketTemplate.findUnique({
      where: { id: params.id },
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

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user can access this template
    if (!template.isGlobal && template.createdBy !== currentUser.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      data: template,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Find existing template
    const existingTemplate = await prisma.ticketTemplate.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check permissions
    const isAdmin = currentUser.role?.name === 'Admin_Manager';
    const isOwner = existingTemplate.createdBy === currentUser.id;

    // Only owner or admin can edit
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only admin can change isGlobal flag
    if (validatedData.isGlobal !== undefined && validatedData.isGlobal !== existingTemplate.isGlobal) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only Admin_Manager can change global template status' },
          { status: 403 }
        );
      }
    }

    const updatedTemplate = await prisma.ticketTemplate.update({
      where: { id: params.id },
      data: validatedData,
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
      data: updatedTemplate,
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find existing template
    const existingTemplate = await prisma.ticketTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check permissions
    const isAdmin = currentUser.role?.name === 'Admin_Manager';
    const isOwner = existingTemplate.createdBy === currentUser.id;

    // Only owner or admin can delete
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.ticketTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}