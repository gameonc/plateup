import { NextRequest, NextResponse } from 'next/server';
import { verifyCheckoutSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, userId } = body;

    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    const result = await verifyCheckoutSession(sessionId.trim(), userId ? String(userId).trim() : undefined);

    return NextResponse.json({
      success: result.success,
      plan: result.plan,
      subscriptionId: result.subscriptionId,
      subscriptionStatus: result.subscriptionStatus,
      userId: result.userId,
    });
  } catch (error) {
    console.error('Error verifying Stripe checkout session:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Session verification failed' 
      },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id') || searchParams.get('sessionId');
    const userId = searchParams.get('user_id') || searchParams.get('userId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: session_id' },
        { status: 400 }
      );
    }

    const result = await verifyCheckoutSession(sessionId, userId || undefined);

    return NextResponse.json({
      success: result.success,
      plan: result.plan,
      subscriptionId: result.subscriptionId,
      subscriptionStatus: result.subscriptionStatus,
      userId: result.userId,
    });
  } catch (error) {
    console.error('Error in GET verify-session:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Session verification failed' 
      },
      { status: 400 }
    );
  }
}
