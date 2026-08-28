/**
 * Unit Tests: Milestone 3 Stripe Integration & Handlers
 * Verifies src/lib/stripe.ts methods against the specification.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createCheckoutSession,
  verifyCheckoutSession,
  handleStripeWebhookEvent,
  PRO_MONTHLY_PRICE_USD,
  PRO_PRICE_CENTS,
  type StripeWebhookPayload,
} from '../src/lib/stripe.ts';

describe('Unit: Milestone 3 Stripe Integration Module', () => {
  describe('Constants & Pricing', () => {
    it('M3.1: Pro price is exactly $4.99 USD (499 cents)', () => {
      assert.strictEqual(PRO_MONTHLY_PRICE_USD, 4.99);
      assert.strictEqual(PRO_PRICE_CENTS, 499);
    });
  });

  describe('createCheckoutSession()', () => {
    it('M3.2: Generates checkout session with $4.99 recurring USD subscription', async () => {
      const session = await createCheckoutSession({
        userId: 'user_m3_test_1',
        userEmail: 'chef_m3@plateup.com',
        origin: 'https://plateup.app',
      });

      assert.strictEqual(session.amount, 499);
      assert.strictEqual(session.currency, 'usd');
      assert.strictEqual(session.mode, 'subscription');
      assert.strictEqual(session.recurringInterval, 'month');
      assert.strictEqual(session.metadata.userId, 'user_m3_test_1');
      assert.strictEqual(session.customerEmail, 'chef_m3@plateup.com');
      assert.ok(session.sessionId.startsWith('cs_test_'));
      assert.ok(session.url.startsWith('https://checkout.stripe.com/'));
    });

    it('M3.3: Throws error when userId is missing or empty', async () => {
      await assert.rejects(async () => {
        await createCheckoutSession({ userId: '' });
      }, /Missing required field: userId/);
    });
  });

  describe('verifyCheckoutSession()', () => {
    it('M3.4: Verifies test session and returns Pro plan activation', async () => {
      const verification = await verifyCheckoutSession('cs_test_session_sample_123', 'user_m3_test_1');

      assert.strictEqual(verification.success, true);
      assert.strictEqual(verification.plan, 'pro');
      assert.strictEqual(verification.subscriptionStatus, 'active');
      assert.ok(verification.subscriptionId.startsWith('sub_'));
      assert.strictEqual(verification.userId, 'user_m3_test_1');
    });

    it('M3.5: Throws error when sessionId is missing', async () => {
      await assert.rejects(async () => {
        await verifyCheckoutSession('');
      }, /Invalid or expired Stripe session ID/);
    });

    it('M3.6: Throws error when userId cannot be determined', async () => {
      await assert.rejects(async () => {
        await verifyCheckoutSession('cs_test_no_user');
      }, /User ID required for verification/);
    });
  });

  describe('handleStripeWebhookEvent()', () => {
    it('M3.7: Handles checkout.session.completed and triggers upgraded_to_pro', async () => {
      const event: StripeWebhookPayload = {
        id: 'evt_hook_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_complete_123',
            metadata: { userId: 'user_webhook_1' },
            subscription: 'sub_live_hook_123',
            status: 'complete',
          },
        },
      };

      const result = await handleStripeWebhookEvent(event);
      assert.strictEqual(result.handled, true);
      assert.strictEqual(result.action, 'upgraded_to_pro');
      assert.strictEqual(result.userId, 'user_webhook_1');
    });

    it('M3.8: Returns missing_user_id when checkout session lacks userId in metadata/client_reference_id', async () => {
      const event: StripeWebhookPayload = {
        id: 'evt_hook_2',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_orphan',
            status: 'complete',
          },
        },
      };

      const result = await handleStripeWebhookEvent(event);
      assert.strictEqual(result.handled, false);
      assert.strictEqual(result.action, 'missing_user_id');
    });

    it('M3.9: Handles customer.subscription.deleted with metadata userId', async () => {
      const event: StripeWebhookPayload = {
        id: 'evt_hook_3',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_del_123',
            metadata: { userId: 'user_webhook_del' },
            status: 'canceled',
          },
        },
      };

      const result = await handleStripeWebhookEvent(event);
      assert.strictEqual(result.handled, true);
      assert.strictEqual(result.action, 'downgraded_to_free');
      assert.strictEqual(result.userId, 'user_webhook_del');
    });

    it('M3.10: Handles customer.subscription.updated with active status', async () => {
      const event: StripeWebhookPayload = {
        id: 'evt_hook_4',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_upd_123',
            metadata: { userId: 'user_webhook_upd' },
            status: 'active',
          },
        },
      };

      const result = await handleStripeWebhookEvent(event);
      assert.strictEqual(result.handled, true);
      assert.strictEqual(result.action, 'updated_status_active');
      assert.strictEqual(result.userId, 'user_webhook_upd');
    });

    it('M3.11: Returns unhandled_event_type for unrecognized webhook event types', async () => {
      const event: StripeWebhookPayload = {
        id: 'evt_unknown',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_123',
          },
        },
      };

      const result = await handleStripeWebhookEvent(event);
      assert.strictEqual(result.handled, false);
      assert.strictEqual(result.action, 'unhandled_event_type');
    });
  });
});
