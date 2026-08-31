import { NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhookEvent, verifyStripeWebhookSignature, type StripeWebhookPayload } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    let payload: StripeWebhookPayload;
    try {
      payload = verifyStripeWebhookSignature(rawBody, signature);
    } catch (sigErr) {
      return NextResponse.json(
        { error: sigErr instanceof Error ? sigErr.message : 'Invalid webhook signature or payload' },
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
