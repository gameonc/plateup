import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, userEmail, returnUrl } = body;

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const origin = req.headers.get('origin') || `${protocol}://${host}`;

    const session = await createCheckoutSession({
      userId: userId.trim(),
      userEmail: userEmail ? String(userEmail).trim() : undefined,
      returnUrl: returnUrl ? String(returnUrl).trim() : undefined,
      origin,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.sessionId,
      amount: session.amount,
      currency: session.currency,
      mode: session.mode,
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
