import { NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhookEvent, type StripeWebhookPayload } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    let payload: StripeWebhookPayload;
    const rawBody = await req.text();

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (!payload || !payload.type || !payload.data?.object) {
      return NextResponse.json(
        { error: 'Invalid Stripe event format' },
        { status: 400 }
      );
    }

    const result = await handleStripeWebhookEvent(payload);

    return NextResponse.json({
      received: true,
      handled: result.handled,
      action: result.action,
      userId: result.userId,
    });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
