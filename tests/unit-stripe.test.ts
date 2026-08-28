/**
 * Unit Tests: Stripe Checkout Session, Webhook Event Handling & Tier Mapping
 * Specification: ORIGINAL_REQUEST.md §R3 & PROJECT.md F-45
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  createStripeCheckoutSession,
  verifyStripeSession,
  handleStripeWebhook,
  PRO_PRICE_CENTS,
  PRO_MONTHLY_PRICE_USD,
  type MonetizationUserProfile,
  type StripeWebhookEvent,
} from './helpers/monetization-helpers.ts';

describe('Unit: Stripe Checkout & Subscription Lifecycle', () => {
  let usersMap: Map<string, MonetizationUserProfile>;

  beforeEach(() => {
    usersMap = new Map();
    const freeUser: MonetizationUserProfile = {
      uid: 'usr_free_123',
      email: 'freeuser@plateup.com',
      displayName: 'Free User',
      createdAt: new Date(),
      preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
      plan: 'free',
      extractionsThisMonth: 5,
      extractionMonth: '2026-08',
    };
    usersMap.set(freeUser.uid, freeUser);
  });

  describe('1. createStripeCheckoutSession payload parameters', () => {
    it('1.1: Configures $4.99/month (499 cents) recurring USD subscription parameters', () => {
      const session = createStripeCheckoutSession({
        userId: 'usr_free_123',
        userEmail: 'freeuser@plateup.com',
        returnUrl: 'https://plateup.app/pricing',
      });

      assert.strictEqual(session.amount, 499);
      assert.strictEqual(session.currency, 'usd');
      assert.strictEqual(session.mode, 'subscription');
      assert.strictEqual(session.recurringInterval, 'month');
      assert.strictEqual(PRO_MONTHLY_PRICE_USD, 4.99);
      assert.strictEqual(PRO_PRICE_CENTS, 499);
    });

    it('1.2: Generates valid test checkout session URL and ID', () => {
      const session = createStripeCheckoutSession({
        userId: 'usr_free_123',
      });

      assert.ok(session.sessionId.startsWith('cs_test_'));
      assert.ok(session.url.startsWith('https://checkout.stripe.com/'));
      assert.ok(session.url.includes(session.sessionId));
    });

    it('1.3: Attaches user ID in metadata for webhook reconciliation', () => {
      const session = createStripeCheckoutSession({
        userId: 'usr_target_456',
      });

      assert.strictEqual(session.metadata.userId, 'usr_target_456');
    });

    it('1.4: Attaches customer email if provided', () => {
      const session = createStripeCheckoutSession({
        userId: 'usr_free_123',
        userEmail: 'customer@example.com',
      });

      assert.strictEqual(session.customerEmail, 'customer@example.com');
    });

    it('1.5: Throws error when userId is missing', () => {
      assert.throws(() => {
        createStripeCheckoutSession({ userId: '' });
      }, /Missing required field: userId/);
    });
  });

  describe('2. verifyStripeSession endpoint logic', () => {
    it('2.1: Updates user plan to "pro" with active subscription on valid session verification', () => {
      const user = usersMap.get('usr_free_123')!;
      assert.strictEqual(user.plan, 'free');

      const result = verifyStripeSession('cs_test_verified_12345', user.uid, user);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.plan, 'pro');
      assert.strictEqual(result.subscriptionStatus, 'active');
      assert.ok(result.subscriptionId.startsWith('sub_'));

      // User object state updated in place
      assert.strictEqual(user.plan, 'pro');
      assert.strictEqual(user.subscriptionStatus, 'active');
      assert.strictEqual(user.subscriptionId, result.subscriptionId);
    });

    it('2.2: Rejects invalid or expired session IDs', () => {
      const user = usersMap.get('usr_free_123')!;
      assert.throws(() => {
        verifyStripeSession('invalid_session_id', user.uid, user);
      }, /Invalid or expired Stripe session ID/);
    });

    it('2.3: Rejects verification when userId is missing', () => {
      const user = usersMap.get('usr_free_123')!;
      assert.throws(() => {
        verifyStripeSession('cs_test_123', '', user);
      }, /User ID required for verification/);
    });
  });

  describe('3. Webhook event parsing and user tier mapping', () => {
    it('3.1: Handles checkout.session.completed and upgrades user to Pro', () => {
      const event: StripeWebhookEvent = {
        id: 'evt_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_completed_999',
            metadata: { userId: 'usr_free_123' },
            subscription: 'sub_live_99999',
            status: 'complete',
            customer_email: 'freeuser@plateup.com',
          }
        }
      };

      const res = handleStripeWebhook(event, usersMap);
      assert.strictEqual(res.handled, true);
      assert.strictEqual(res.action, 'upgraded_to_pro');

      const updatedUser = usersMap.get('usr_free_123')!;
      assert.strictEqual(updatedUser.plan, 'pro');
      assert.strictEqual(updatedUser.subscriptionId, 'sub_live_99999');
      assert.strictEqual(updatedUser.subscriptionStatus, 'active');
    });

    it('3.2: Handles customer.subscription.deleted and downgrades user to Free', () => {
      // First promote to Pro
      const user = usersMap.get('usr_free_123')!;
      user.plan = 'pro';
      user.subscriptionId = 'sub_active_888';
      user.subscriptionStatus = 'active';

      const event: StripeWebhookEvent = {
        id: 'evt_2',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_active_888',
            metadata: { userId: user.uid },
            status: 'canceled',
          }
        }
      };

      const res = handleStripeWebhook(event, usersMap);
      assert.strictEqual(res.handled, true);
      assert.strictEqual(res.action, 'downgraded_to_free');
      assert.strictEqual(user.plan, 'free');
      assert.strictEqual(user.subscriptionStatus, 'canceled');
    });

    it('3.3: Resolves user by subscriptionId when metadata is missing on subscription deletion', () => {
      const user = usersMap.get('usr_free_123')!;
      user.plan = 'pro';
      user.subscriptionId = 'sub_no_metadata_777';
      user.subscriptionStatus = 'active';

      const event: StripeWebhookEvent = {
        id: 'evt_3',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_no_metadata_777',
            status: 'canceled',
          }
        }
      };

      const res = handleStripeWebhook(event, usersMap);
      assert.strictEqual(res.handled, true);
      assert.strictEqual(res.action, 'downgraded_to_free');
      assert.strictEqual(user.plan, 'free');
    });

    it('3.4: Handles customer.subscription.updated with past_due or unpaid status', () => {
      const user = usersMap.get('usr_free_123')!;
      user.plan = 'pro';
      user.subscriptionId = 'sub_update_555';
      user.subscriptionStatus = 'active';

      const event: StripeWebhookEvent = {
        id: 'evt_4',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_update_555',
            status: 'unpaid',
          }
        }
      };

      const res = handleStripeWebhook(event, usersMap);
      assert.strictEqual(res.handled, true);
      assert.strictEqual(user.subscriptionStatus, 'unpaid');
      assert.strictEqual(user.plan, 'free'); // Unpaid removes Pro privileges
    });

    it('3.5: Returns unhandled for unrecognized webhook event types without throwing', () => {
      const event: StripeWebhookEvent = {
        id: 'evt_unknown',
        type: 'payment_intent.created',
        data: {
          object: { id: 'pi_12345' }
        }
      };

      const res = handleStripeWebhook(event, usersMap);
      assert.strictEqual(res.handled, false);
      assert.strictEqual(res.action, 'unhandled_event_type');
    });
  });
});
