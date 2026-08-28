/**
 * Tier 2: Boundary & Corner Cases for Monetization Features
 * Stress testing edge conditions: zero/4/5/6 extractions, month rollovers, leap years,
 * ingredient sanitization extremes, URL lengths, and webhook idempotency.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  cleanIngredientForSearch,
  buildAmazonFreshUrl,
  buildInstacartUrl,
  getCurrentMonthKey,
  getExtractionUsage,
  recordExtractionUsage,
  createStripeCheckoutSession,
  verifyStripeSession,
  handleStripeWebhook,
  FREE_TIER_MONTHLY_LIMIT,
  type MonetizationUserProfile,
  type StripeWebhookEvent,
} from '../helpers/monetization-helpers.ts';

describe('Tier 2: Boundary & Corner Cases — Monetization & Freemium Engine', () => {
  let mockUser: MonetizationUserProfile;

  beforeEach(() => {
    mockUser = {
      uid: 'boundary_user_1',
      email: 'boundary@plateup.com',
      displayName: 'Boundary Tester',
      createdAt: new Date(),
      preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
      plan: 'free',
      extractionsThisMonth: 0,
      extractionMonth: '2026-08',
    };
  });

  // Boundary Domain 1: Keyword Sanitization & URL Construction Limits
  describe('Boundary 1: Keyword Sanitization & URL Construction Limits', () => {
    it('B-1.1: Handles empty, whitespace-only, numbers-only and punctuation-only ingredient strings', () => {
      assert.strictEqual(cleanIngredientForSearch(''), '');
      assert.strictEqual(cleanIngredientForSearch('    \t\n  '), '');
      assert.strictEqual(cleanIngredientForSearch('123 456 789'), '');
      assert.strictEqual(cleanIngredientForSearch('!@#$%^&*()_+'), '');
      assert.strictEqual(cleanIngredientForSearch('1/2 3/4 2 1/2'), '');
      assert.strictEqual(cleanIngredientForSearch('cups tbsp oz grams'), '');
    });

    it('B-1.2: Preserves accented and international culinary names correctly', () => {
      assert.strictEqual(cleanIngredientForSearch('2 diced jalapeño peppers'), 'jalapeño peppers');
      assert.strictEqual(cleanIngredientForSearch('1/2 cup crème fraîche'), 'crème fraîche');
      assert.strictEqual(cleanIngredientForSearch('100g açaí berry purée'), 'açaí berry purée');
      assert.strictEqual(cleanIngredientForSearch('1 tbsp za\'atar seasoning'), 'za\'atar seasoning');
    });

    it('B-1.3: Handles massive 500+ character ingredient description without crashing', () => {
      const longDescription = '2 1/2 lbs of sustainably wild-caught, fresh Alaskan king salmon fillets, skin removed, boneless, chilled, diced into 1-inch cubes, seasoned lightly with coarse sea salt and freshly cracked black peppercorns (divided, plus extra for serving, optional, to taste, at room temperature)';
      const cleaned = cleanIngredientForSearch(longDescription);

      assert.ok(cleaned.length < 100);
      assert.ok(cleaned.includes('salmon fillets') || cleaned.includes('Alaskan king salmon'));
      assert.ok(!cleaned.includes('2 1/2'));
      assert.ok(!cleaned.includes('skin removed'));
    });

    it('B-1.4: Caps search query length when passed a large list of 50 ingredients', () => {
      const fiftyItems = Array.from({ length: 50 }, (_, i) => `Ingredient ${i + 1} for recipe`);
      const amzUrl = buildAmazonFreshUrl(fiftyItems);
      const instaUrl = buildInstacartUrl(fiftyItems);

      assert.ok(amzUrl.length < 2000, 'URL length must stay well within safe browser limit');
      assert.ok(instaUrl.length < 2000, 'URL length must stay well within safe browser limit');
    });

    it('B-1.5: Handles mixed arrays containing nulls, undefineds, strings, and partial objects', () => {
      const mixedInputs: Array<{ item?: string; name?: string; otherField?: string } | string | null | undefined> = [
        null,
        undefined,
        '',
        { item: '1 cup milk' },
        { name: '2 eggs' },
        { otherField: 'invalid' },
        '3 tbsp butter',
      ];

      const amzUrl = buildAmazonFreshUrl(mixedInputs);
      const instaUrl = buildInstacartUrl(mixedInputs);

      assert.ok(amzUrl.includes('milk') || amzUrl.includes('eggs'));
      assert.ok(instaUrl.includes('milk') || instaUrl.includes('butter'));
    });
  });

  // Boundary Domain 2: Quota Calculation Boundary Values (0, 1, 4, 5, 6, Negative, NaN)
  describe('Boundary 2: Quota Calculation Thresholds (0, 1, 4, 5, 6+ Extractions)', () => {
    const refDate = new Date('2026-08-28T12:00:00Z');

    it('B-2.1: Exactly 0 extractions -> 5 remaining, not reached', () => {
      mockUser.extractionsThisMonth = 0;
      const usage = getExtractionUsage(mockUser, refDate);
      assert.strictEqual(usage.used, 0);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('B-2.2: Exactly 1 extraction -> 4 remaining, not reached', () => {
      mockUser.extractionsThisMonth = 1;
      const usage = getExtractionUsage(mockUser, refDate);
      assert.strictEqual(usage.used, 1);
      assert.strictEqual(usage.remaining, 4);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('B-2.3: Exactly 4 extractions (last remaining free extraction) -> 1 remaining, not reached', () => {
      mockUser.extractionsThisMonth = 4;
      const usage = getExtractionUsage(mockUser, refDate);
      assert.strictEqual(usage.used, 4);
      assert.strictEqual(usage.remaining, 1);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('B-2.4: Exactly 5 extractions (quota exhausted threshold) -> 0 remaining, limit reached', () => {
      mockUser.extractionsThisMonth = 5;
      const usage = getExtractionUsage(mockUser, refDate);
      assert.strictEqual(usage.used, 5);
      assert.strictEqual(usage.remaining, 0);
      assert.strictEqual(usage.isLimitReached, true);
    });

    it('B-2.5: Overflow at 6+ extractions -> remaining clamped to 0 (never negative)', () => {
      mockUser.extractionsThisMonth = 6;
      const usage6 = getExtractionUsage(mockUser, refDate);
      assert.strictEqual(usage6.used, 6);
      assert.strictEqual(usage6.remaining, 0);
      assert.strictEqual(usage6.isLimitReached, true);

      mockUser.extractionsThisMonth = 999;
      const usage999 = getExtractionUsage(mockUser, refDate);
      assert.strictEqual(usage999.remaining, 0);
      assert.strictEqual(usage999.isLimitReached, true);
    });

    it('B-2.6: Pro plan at 0, 5, 1000, and 1,000,000 extractions -> always Infinity remaining, never reached', () => {
      mockUser.plan = 'pro';
      for (const count of [0, 5, 100, 10000, 1000000]) {
        mockUser.extractionsThisMonth = count;
        const usage = getExtractionUsage(mockUser, refDate);
        assert.strictEqual(usage.plan, 'pro');
        assert.strictEqual(usage.remaining, Infinity);
        assert.strictEqual(usage.isLimitReached, false);
      }
    });

    it('B-2.7: Missing or undefined extractionMonth field defaults safely to active month', () => {
      delete mockUser.extractionMonth;
      mockUser.extractionsThisMonth = 2;
      const usage = getExtractionUsage(mockUser, refDate);
      assert.strictEqual(usage.used, 2);
      assert.strictEqual(usage.remaining, 3);
    });
  });

  // Boundary Domain 3: Calendar Rollovers, Leap Years & Time Boundaries
  describe('Boundary 3: Calendar Rollovers & Date Boundaries', () => {
    it('B-3.1: Year transition: Dec 31 23:59:59 to Jan 1 00:00:00 rollover', () => {
      const dec31 = new Date('2026-12-31T23:59:59Z');
      const jan01 = new Date('2027-01-01T00:00:00Z');

      assert.strictEqual(getCurrentMonthKey(dec31), '2026-12');
      assert.strictEqual(getCurrentMonthKey(jan01), '2027-01');

      // User exhausted quota in December
      mockUser.extractionsThisMonth = 5;
      mockUser.extractionMonth = '2026-12';

      // Checked 1 second later in January
      const janUsage = getExtractionUsage(mockUser, jan01);
      assert.strictEqual(janUsage.used, 0);
      assert.strictEqual(janUsage.remaining, 5);
      assert.strictEqual(janUsage.isLimitReached, false);
    });

    it('B-3.2: Leap year transition: Feb 28 to Feb 29 to Mar 1 (2028 leap year)', () => {
      const feb28 = new Date('2028-02-28T12:00:00Z');
      const feb29 = new Date('2028-02-29T12:00:00Z');
      const mar01 = new Date('2028-03-01T00:00:01Z');

      assert.strictEqual(getCurrentMonthKey(feb28), '2028-02');
      assert.strictEqual(getCurrentMonthKey(feb29), '2028-02');
      assert.strictEqual(getCurrentMonthKey(mar01), '2028-03');

      mockUser.extractionsThisMonth = 4;
      mockUser.extractionMonth = '2028-02';

      // On Feb 29, still in same month
      assert.strictEqual(getExtractionUsage(mockUser, feb29).used, 4);

      // On March 1, resets to 0
      assert.strictEqual(getExtractionUsage(mockUser, mar01).used, 0);
    });

    it('B-3.3: First extraction in a new month resets extractionsThisMonth to 1 and updates month key', () => {
      mockUser.extractionsThisMonth = 5;
      mockUser.extractionMonth = '2026-07';

      const augDate = new Date('2026-08-01T10:00:00Z');
      const result = recordExtractionUsage(mockUser, augDate);

      assert.strictEqual(result.profile.extractionsThisMonth, 1);
      assert.strictEqual(result.profile.extractionMonth, '2026-08');
      assert.strictEqual(result.remaining, 4);
    });
  });

  // Boundary Domain 4: Stripe & Webhook Edge Cases & Idempotency
  describe('Boundary 4: Stripe Webhook Edge Cases & Idempotency', () => {
    let usersMap: Map<string, MonetizationUserProfile>;

    beforeEach(() => {
      usersMap = new Map();
      usersMap.set(mockUser.uid, mockUser);
    });

    it('B-4.1: Idempotency: Processing identical checkout.session.completed twice maintains Pro state', () => {
      const event: StripeWebhookEvent = {
        id: 'evt_idempotent_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_idem_1',
            metadata: { userId: mockUser.uid },
            subscription: 'sub_idem_123',
            status: 'complete',
          }
        }
      };

      const firstRun = handleStripeWebhook(event, usersMap);
      assert.strictEqual(firstRun.handled, true);
      assert.strictEqual(mockUser.plan, 'pro');

      const secondRun = handleStripeWebhook(event, usersMap);
      assert.strictEqual(secondRun.handled, true);
      assert.strictEqual(mockUser.plan, 'pro');
      assert.strictEqual(mockUser.subscriptionId, 'sub_idem_123');
    });

    it('B-4.2: Webhook with missing metadata and unrecognized client_reference_id fails gracefully', () => {
      const event: StripeWebhookEvent = {
        id: 'evt_missing_meta',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_orphan',
            status: 'complete',
          }
        }
      };

      const res = handleStripeWebhook(event, usersMap);
      assert.strictEqual(res.handled, false);
      assert.strictEqual(res.action, 'missing_user_id');
    });

    it('B-4.3: Webhook referencing non-existent userId in database fails gracefully', () => {
      const event: StripeWebhookEvent = {
        id: 'evt_ghost_user',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_ghost',
            metadata: { userId: 'non_existent_uid_9999' },
            subscription: 'sub_ghost_123',
          }
        }
      };

      const res = handleStripeWebhook(event, usersMap);
      assert.strictEqual(res.handled, false);
      assert.strictEqual(res.action, 'user_not_found');
    });

    it('B-4.4: Subscription updated to "trialing" grants Pro access', () => {
      mockUser.subscriptionId = 'sub_trial_123';
      const event: StripeWebhookEvent = {
        id: 'evt_trial',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_trial_123',
            status: 'trialing',
          }
        }
      };

      const res = handleStripeWebhook(event, usersMap);
      assert.strictEqual(res.handled, true);
      assert.strictEqual(mockUser.plan, 'pro');
    });
  });
});
