import { NextRequest, NextResponse } from 'next/server';
import { PasswordResetService } from '@/lib/services/password-reset-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    const result = await PasswordResetService.validateResetToken(token);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in validate-reset-token API:', error);
    return NextResponse.json(
      { valid: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
