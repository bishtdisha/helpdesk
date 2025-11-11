import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { slaService, CreateSLAPolicyData, SLAAccessDeniedError, SLAPolicyNotFoundError } from '@/lib/services/sla-service';
import { TicketPriority } from '@prisma/client';

/**
 * GET /api/sla/policies - Get all SLA policies
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all policies
    const policies = await slaService.getPolicies(currentUser.id);

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error fetching SLA policies:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sla/policies - Create a new SLA policy (Admin only)
 * 
 * Request body:
 * - name: Policy name (required)
 * - description: Policy description (optional)
 * - priority: Ticket priority (required: LOW, MEDIUM, HIGH, URGENT)
 * - responseTimeHours: Response time in hours (required)
 * - resolutionTimeHours: Resolution time in hours (required)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, priority, responseTimeHours, resolutionTimeHours } = body;

    // Validate required fields
    if (!name || !priority || responseTimeHours === undefined || resolutionTimeHours === undefined) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Name, priority, responseTimeHours, and resolutionTimeHours are required',
        },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Name cannot be empty',
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Name cannot exceed 100 characters',
        },
        { status: 400 }
      );
    }

    // Validate priority
    if (!Object.values(TicketPriority).includes(priority)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid priority. Must be one of: LOW, MEDIUM, HIGH, URGENT',
        },
        { status: 400 }
      );
    }

    // Validate time values
    if (typeof responseTimeHours !== 'number' || responseTimeHours <= 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Response time must be a positive number',
        },
        { status: 400 }
      );
    }

    if (typeof resolutionTimeHours !== 'number' || resolutionTimeHours <= 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Resolution time must be a positive number',
        },
        { status: 400 }
      );
    }

    // Create policy data
    const policyData: CreateSLAPolicyData = {
      name: name.trim(),
      description: description?.trim() || undefined,
      priority,
      responseTimeHours,
      resolutionTimeHours,
    };

    // Create the policy
    const policy = await slaService.createPolicy(policyData, currentUser.id);

    return NextResponse.json(
      {
        message: 'SLA policy created successfully',
        policy,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating SLA policy:', error);
    
    if (error instanceof SLAAccessDeniedError) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: error.code,
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
