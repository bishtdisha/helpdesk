import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import {
  escalationService,
  UpdateEscalationRuleData,
  EscalationAccessDeniedError,
  EscalationRuleNotFoundError,
} from '@/lib/services/escalation-service';

/**
 * GET /api/escalation/rules/:id - Get a specific escalation rule
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

    const ruleId = params.id;

    // Get the rule
    const rule = await escalationService.getRule(ruleId, currentUser.id);

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error fetching escalation rule:', error);
    
    if (error instanceof EscalationRuleNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not found',
          code: 'RULE_NOT_FOUND',
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
 * PUT /api/escalation/rules/:id - Update an escalation rule (Admin only)
 * 
 * Request body:
 * - name: Rule name (optional)
 * - description: Rule description (optional)
 * - conditionValue: Condition configuration (optional)
 * - actionConfig: Action configuration (optional)
 * - isActive: Active status (optional)
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

    const ruleId = params.id;

    // Parse request body
    const body = await request.json();
    const { name, description, conditionValue, actionConfig, isActive } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
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

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'isActive must be a boolean',
        },
        { status: 400 }
      );
    }

    // Create update data
    const updateData: UpdateEscalationRuleData = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || undefined;
    if (conditionValue !== undefined) updateData.conditionValue = conditionValue;
    if (actionConfig !== undefined) updateData.actionConfig = actionConfig;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update the rule
    const rule = await escalationService.updateRule(ruleId, updateData, currentUser.id);

    return NextResponse.json({
      message: 'Escalation rule updated successfully',
      rule,
    });
  } catch (error) {
    console.error('Error updating escalation rule:', error);
    
    if (error instanceof EscalationAccessDeniedError) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: error.code,
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof EscalationRuleNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not found',
          code: 'RULE_NOT_FOUND',
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
 * DELETE /api/escalation/rules/:id - Delete an escalation rule (Admin only)
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

    const ruleId = params.id;

    // Delete the rule
    await escalationService.deleteRule(ruleId, currentUser.id);

    return NextResponse.json({
      message: 'Escalation rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting escalation rule:', error);
    
    if (error instanceof EscalationAccessDeniedError) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: error.code,
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof EscalationRuleNotFoundError) {
      return NextResponse.json(
        {
          error: 'Not found',
          code: 'RULE_NOT_FOUND',
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
