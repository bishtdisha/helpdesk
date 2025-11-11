import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { validateRegistrationData } from '@/lib/validation';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input data
    const validation = validateRegistrationData({ email, password, name });
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please check your input data',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User already exists',
          message: 'A user with this email address already exists',
        },
        { status: 409 }
      );
    }

    // Register the user
    const result = await AuthService.register({
      email: email.toLowerCase().trim(),
      password,
      name: name?.trim(),
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Registration failed',
          message: result.error || 'An error occurred during registration',
        },
        { status: 500 }
      );
    }



    // Return success response (without sensitive data)
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        user: {
          id: result.user?.id,
          email: result.user?.email,
          name: result.user?.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}