import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { slaService, UpdateSLAPolicyData, SLAAccessDeniedError, SLAPolicyNotFoundError } from '@/lib/services/sla-service';

/**
 * GET /api/sla/policies/:id - Get a specific SLA policy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const policy = await slaService.getPolicy(params.id, currentUser.id);

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error fetching SLA policy:', error);
    
    if (error instanceof SLAPolicyNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not found',
          code: 'POLICY_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sla/policies/:id - Update an SLA policy (Admin only)
 * 
 * Request body:
 * - name: Policy name (optional)
 * - description: Policy description (optional)
 * - responseTimeHours: Response time in hours (optional)
 * - resolutionTimeHours: Resolution time in hours (optional)
 * - isActive: Whether the policy is active (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, description, responseTimeHours, resolutionTimeHours, isActive } = body;

    // Validate name length if provided
    if (name !== undefined) {
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
    }

    // Validate time values if provided
    if (responseTimeHours !== undefined && (typeof responseTimeHours !== 'number' || responseTimeHours <= 0)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Response time must be a positive number',
        },
        { status: 400 }
      );
    }

    if (resolutionTimeHours !== undefined && (typeof resolutionTimeHours !== 'number' || resolutionTimeHours <= 0)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Resolution time must be a positive number',
        },
        { status: 400 }
      );
    }

    // Create update data
    const updateData: UpdateSLAPolicyData = {
      name: name?.trim(),
      description: description?.trim(),
      responseTimeHours,
      resolutionTimeHours,
      isActive,
    };

    // Update the policy
    const policy = await slaService.updatePolicy(params.id, updateData, currentUser.id);

    return NextResponse.json({
      message: 'SLA policy updated successfully',
      policy,
    });
  } catch (error) {
    console.error('Error updating SLA policy:', error);
    
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

    if (error instanceof SLAPolicyNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not found',
          code: 'POLICY_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
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

/**
 * DELETE /api/sla/policies/:id - Delete an SLA policy (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await slaService.deletePolicy(params.id, currentUser.id);

    return NextResponse.json({
      message: 'SLA policy deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting SLA policy:', error);
    
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

    if (error instanceof SLAPolicyNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not found',
          code: 'POLICY_NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
