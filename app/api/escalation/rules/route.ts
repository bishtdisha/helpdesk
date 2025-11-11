import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import {
  escalationService,
  CreateEscalationRuleData,
  EscalationAccessDeniedError,
  EscalationRuleNotFoundError,
  EscalationConditionType,
  EscalationActionType,
} from '@/lib/services/escalation-service';

/**
 * GET /api/escalation/rules - Get all escalation rules
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

    // Get all rules
    const rules = await escalationService.getRules(currentUser.id);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching escalation rules:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/escalation/rules - Create a new escalation rule (Admin only)
 * 
 * Request body:
 * - name: Rule name (required)
 * - description: Rule description (optional)
 * - conditionType: Condition type (required: sla_breach, time_in_status, priority_level, no_response, customer_rating)
 * - conditionValue: Condition configuration (required, varies by type)
 * - actionType: Action type (required: notify_manager, reassign_ticket, increase_priority, add_follower, send_email)
 * - actionConfig: Action configuration (required, varies by type)
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
    const { name, description, conditionType, conditionValue, actionType, actionConfig } = body;

    // Validate required fields
    if (!name || !conditionType || !conditionValue || !actionType || !actionConfig) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: 'Name, conditionType, conditionValue, actionType, and actionConfig are required',
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

    // Validate condition type
    const validConditionTypes: EscalationConditionType[] = [
      'sla_breach',
      'time_in_status',
      'priority_level',
      'no_response',
      'customer_rating',
    ];

    if (!validConditionTypes.includes(conditionType)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: `Invalid condition type. Must be one of: ${validConditionTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate action type
    const validActionTypes: EscalationActionType[] = [
      'notify_manager',
      'reassign_ticket',
      'increase_priority',
      'add_follower',
      'send_email',
    ];

    if (!validActionTypes.includes(actionType)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          message: `Invalid action type. Must be one of: ${validActionTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create rule data
    const ruleData: CreateEscalationRuleData = {
      name: name.trim(),
      description: description?.trim() || undefined,
      conditionType,
      conditionValue,
      actionType,
      actionConfig,
    };

    // Create the rule
    const rule = await escalationService.createRule(ruleData, currentUser.id);

    return NextResponse.json(
      {
        message: 'Escalation rule created successfully',
        rule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating escalation rule:', error);
    
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
