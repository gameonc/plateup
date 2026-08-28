/**
 * Adversarial Stress-Testing Suite for PlateUp Monetization Features
 * 
 * Domain Coverage:
 * 1. Extreme Ingredient Names (1000+ chars, emojis, SQL-like injection strings, missing fields, ASCII fractions, vulgar unicode fractions)
 * 2. Quota Edge Cases (Rapid sequential extraction requests, year boundary transitions 2026-12 -> 2027-01, leap days 2028-02-29, corrupt profiles)
 * 3. Malformed Stripe Checkout Requests (Missing userId, empty/whitespace userId, invalid metadata, corrupted webhook payloads, route validation simulations)
 * 4. Empirical Verification & System Invariants
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Domain 1: Affiliate & Ingredient Parsing
import {
  cleanIngredientForSearch,
  extractCleanIngredientNames,
  buildAmazonFreshUrl,
  buildInstacartUrl,
  getAffiliateLinks,
  AFFILIATE_DISCLOSURE_TEXT,
  AFFILIATE_PARTNERS,
  AMAZON_FRESH_DEFAULT_TAG,
  INSTACART_DEFAULT_TAG,
} from '../src/lib/affiliate.ts';
import {
  parseFractionOrAmount,
  formatQuantityDisplay,
  normalizeUnit,
  categorizeIngredientDepartment,
} from '../src/lib/ingredient-parser.ts';

// Domain 2: Quota & Usage Engine
import {
  getCurrentMonthKey,
  getExtractionUsage,
  FREE_TIER_MONTHLY_LIMIT,
} from '../src/lib/usage.ts';
import type { UserProfile, SubscriptionPlan } from '../src/types/index.ts';

// Domain 3: Stripe Integration & Server Handlers
import {
  createCheckoutSession,
  verifyCheckoutSession,
  handleStripeWebhookEvent,
  PRO_PRICE_CENTS,
  PRO_MONTHLY_PRICE_USD,
  type StripeWebhookPayload,
} from '../src/lib/stripe.ts';

describe('Adversarial Monetization Stress Testing Suite', () => {

  // =========================================================================
  // DOMAIN 1: EXTREME INGREDIENT NAMES, UNICODE, INJECTION & FRACTIONS
  // =========================================================================
  describe('Domain 1: Extreme Ingredient Names & Search Query Sanitization', () => {

    describe('1.1: 1000+ Character Ingredient Names & ReDoS Defense', () => {
      it('processes 1,000+ character ingredient strings without performance lag (<50ms)', () => {
        const longIngredient = '2 cups diced organic ' + 'super-delicious-'.repeat(80) + 'tomatoes';
        assert.ok(longIngredient.length > 1000);

        const start = performance.now();
        const cleaned = cleanIngredientForSearch(longIngredient);
        const duration = performance.now() - start;

        assert.ok(duration < 50, `Sanitization took ${duration}ms, expected < 50ms`);
        assert.ok(cleaned.length > 0);
        assert.ok(!cleaned.includes('2 cups'));
        assert.ok(!cleaned.includes('diced'));
      });

      it('processes 5,000 character repeated whitespace and punctuation strings safely', () => {
        const chaoticString = '1 1/2 lbs (boneless, skinless) chicken breasts, ' + ' diced, chopped, minced, '.repeat(200) + 'finely!';
        assert.ok(chaoticString.length > 5000);

        const cleaned = cleanIngredientForSearch(chaoticString);
        assert.strictEqual(cleaned, 'chicken breasts');
      });

      it('handles nested parentheses and pathological regular expression patterns', () => {
        const nestedParens = '1 cup olive oil (((extra virgin))) (((cold-pressed))) (first harvest (organic))';
        const cleaned = cleanIngredientForSearch(nestedParens);
        assert.ok(cleaned.includes('olive oil'));
        assert.ok(!cleaned.includes('('));
        assert.ok(!cleaned.includes(')'));
      });
    });

    describe('1.2: Unicode Emojis & International Character Sets', () => {
      it('safely handles food emojis and multi-byte emoji combinations', () => {
        const emojiInputs = [
          '2 cups 🍕 pizza dough',
          '1 bunch 🥦 fresh broccoli, chopped',
          '3 cloves 🧄 garlic, minced',
          '1 tbsp 🌶️ chili powder',
          '2 🥑 ripe avocados (sliced)',
          '1 lb 🥩 ribeye steak',
        ];

        for (const input of emojiInputs) {
          const cleaned = cleanIngredientForSearch(input);
          assert.ok(typeof cleaned === 'string');
          assert.ok(cleaned.length > 0);
        }

        const urls = getAffiliateLinks(emojiInputs);
        assert.ok(urls.amazonFreshUrl.startsWith('https://www.amazon.com/'));
        assert.ok(urls.instacartUrl.startsWith('https://www.instacart.com/'));
      });

      it('preserves non-Latin and accented ingredients without corruption', () => {
        assert.strictEqual(cleanIngredientForSearch('200g 豆腐 (tofu), diced'), '豆腐');
        assert.strictEqual(cleanIngredientForSearch('2 cups crème fraîche, chilled'), 'crème fraîche');
        assert.strictEqual(cleanIngredientForSearch('3 jalapeños, seeded and diced'), 'jalapeños');
        assert.strictEqual(cleanIngredientForSearch('1 cup açaí berries, frozen'), 'açaí berries');
      });
    });

    describe('1.3: SQL, NoSQL & Script Injection Payloads', () => {
      it('safely sanitizes SQL-like injection strings in ingredient search queries', () => {
        const sqlInjections = [
          "'; DROP TABLE users; --",
          "' OR '1'='1",
          '\" UNION SELECT username, password FROM users --',
          "1 cup flour'; DROP TABLE recipes; --",
          '100g sugar/**/AND/**/1=1',
        ];

        for (const sql of sqlInjections) {
          const cleaned = cleanIngredientForSearch(sql);
          assert.doesNotThrow(() => {
            const amazonUrl = buildAmazonFreshUrl([sql]);
            const instacartUrl = buildInstacartUrl([sql]);
            assert.ok(!amazonUrl.includes('; DROP TABLE'));
            assert.ok(amazonUrl.includes('tag=plateup-20'));
            assert.ok(instacartUrl.includes('partner_tag=plateup_app'));
          });
        }
      });

      it('safely sanitizes HTML, XSS and command injection strings', () => {
        const xssInputs = [
          '<script>alert("xss")</script> 2 cups milk',
          'javascript:alert(1)',
          '<img src="x" onerror="prompt(1)"> 1 lb salmon',
          '"><svg onload=alert(1)> olive oil',
        ];

        for (const xss of xssInputs) {
          const cleaned = cleanIngredientForSearch(xss);
          assert.ok(!cleaned.includes('<script>'));
          assert.ok(!cleaned.includes('</script>'));
          assert.ok(!cleaned.includes('<img'));
        }
      });
    });

    describe('1.4: Missing Fields, Nullish & Malformed Types', () => {
      it('handles null, undefined, booleans, arrays and numbers in ingredient search sanitizers', () => {
        // @ts-expect-error testing runtime resilience
        assert.strictEqual(cleanIngredientForSearch(null), '');
        // @ts-expect-error testing runtime resilience
        assert.strictEqual(cleanIngredientForSearch(undefined), '');
        // @ts-expect-error testing runtime resilience
        assert.strictEqual(cleanIngredientForSearch(12345), '');
        // @ts-expect-error testing runtime resilience
        assert.strictEqual(cleanIngredientForSearch(true), '');
        // @ts-expect-error testing runtime resilience
        assert.strictEqual(cleanIngredientForSearch({}), '');
        // @ts-expect-error testing runtime resilience
        assert.strictEqual(cleanIngredientForSearch([]), '');
      });

      it('extractCleanIngredientNames handles sparse, empty and mixed object arrays', () => {
        const mixedItems = [
          null,
          undefined,
          '',
          '   ',
          { item: '2 lbs chicken breasts', amount: '2', unit: 'lbs' },
          { name: '1 cup jasmine rice' },
          { item: '', name: '' },
          { otherField: 'invalid' } as any,
          '1 tbsp olive oil',
        ];

        const cleanNames = extractCleanIngredientNames(mixedItems, 5);
        assert.deepStrictEqual(cleanNames, ['chicken breasts', 'jasmine rice', 'olive oil']);
      });
    });

    describe('1.5: Vulgar Fractions & Complex Math in Ingredients', () => {
      it('parses rare and standard vulgar fractions: ⅝, ⅜, ⅞, ½, ⅓, ⅔, ¼, ¾, ⅙, ⅚, ⅑, ⅒', () => {
        assert.strictEqual(parseFractionOrAmount('⅝'), 0.625);
        assert.strictEqual(parseFractionOrAmount('⅜'), 0.375);
        assert.strictEqual(parseFractionOrAmount('⅞'), 0.875);
        assert.strictEqual(parseFractionOrAmount('½'), 0.5);
        assert.strictEqual(parseFractionOrAmount('¼'), 0.25);
        assert.strictEqual(parseFractionOrAmount('¾'), 0.75);
        assert.strictEqual(parseFractionOrAmount('⅙'), 1 / 6);
        assert.strictEqual(parseFractionOrAmount('⅚'), 5 / 6);
        assert.strictEqual(parseFractionOrAmount('⅑'), 1 / 9);
        assert.strictEqual(parseFractionOrAmount('⅒'), 0.1);
      });

      it('parses compound numbers with vulgar fractions e.g. "1 ⅝", "3 ⅜", "10 ½"', () => {
        assert.strictEqual(parseFractionOrAmount('1 ⅝'), 1.625);
        assert.strictEqual(parseFractionOrAmount('3 ⅜'), 3.375);
        assert.strictEqual(parseFractionOrAmount('10 ½'), 10.5);
        assert.strictEqual(parseFractionOrAmount('2 ¾'), 2.75);
      });

      it('parses ASCII mixed fractions with varied spacing and hyphens: "1 3/4", "2-1/2", "3/8", "1  1/16"', () => {
        assert.strictEqual(parseFractionOrAmount('1 3/4'), 1.75);
        assert.strictEqual(parseFractionOrAmount('2-1/2'), 2.5);
        assert.strictEqual(parseFractionOrAmount('3/8'), 0.375);
        assert.strictEqual(parseFractionOrAmount('1  1/16'), 1.0625);
      });

      it('cleans vulgar fractions from grocery search terms cleanly', () => {
        assert.strictEqual(cleanIngredientForSearch('⅝ cup walnuts, chopped'), 'walnuts');
        assert.strictEqual(cleanIngredientForSearch('1 ⅜ lbs salmon fillets'), 'salmon fillets');
        assert.strictEqual(cleanIngredientForSearch('2 ½ tbsp maple syrup'), 'maple syrup');
        assert.strictEqual(cleanIngredientForSearch('1 3/4 cups almond flour'), 'almond flour');
      });
    });

    describe('1.6: Affiliate Partner URL Generation Integrity', () => {
      it('Amazon Fresh URL contains valid query, brand ID and affiliate tag', () => {
        const ingredients = ['2 lbs ground beef', '1 box spaghetti', '1 jar marinara sauce'];
        const url = buildAmazonFreshUrl(ingredients);

        assert.ok(url.startsWith('https://www.amazon.com/s?'));
        assert.ok(url.includes('i=amazonfresh'));
        assert.ok(url.includes('tag=plateup-20'));
        assert.ok(url.includes('k=ground%20beef%20spaghetti%20marinara%20sauce'));
      });

      it('Instacart URL contains valid query and partner tag', () => {
        const ingredients = ['2 lbs ground beef', '1 box spaghetti', '1 jar marinara sauce'];
        const url = buildInstacartUrl(ingredients);

        assert.ok(url.startsWith('https://www.instacart.com/store/search?'));
        assert.ok(url.includes('partner_tag=plateup_app'));
        assert.ok(url.includes('q=ground%20beef%20spaghetti%20marinara%20sauce'));
      });

      it('getAffiliateLinks bundles Amazon and Instacart links alongside sanitized list', () => {
        const bundle = getAffiliateLinks(['1 lb cheddar cheese', '2 slices sourdough bread']);
        assert.ok(bundle.amazonFreshUrl.includes('cheddar%20cheese%20sourdough%20bread'));
        assert.ok(bundle.instacartUrl.includes('cheddar%20cheese%20sourdough%20bread'));
        assert.deepStrictEqual(bundle.cleanIngredients, ['cheddar cheese', 'sourdough bread']);
      });

      it('AFFILIATE_DISCLOSURE_TEXT satisfies FTC transparency requirements', () => {
        assert.ok(AFFILIATE_DISCLOSURE_TEXT.includes('affiliate'));
        assert.ok(AFFILIATE_DISCLOSURE_TEXT.includes('commission'));
        assert.ok(AFFILIATE_DISCLOSURE_TEXT.includes('no extra cost'));
      });
    });
  });

  // =========================================================================
  // DOMAIN 2: QUOTA & FREEMIUM ENGINE EDGE CASES
  // =========================================================================
  describe('Domain 2: Quota & Freemium Engine Edge Cases', () => {

    describe('2.1: Rapid Sequential Extraction Requests Simulation', () => {
      it('Free tier user is allowed exactly 5 extractions, then blocked on 6th through 20th', () => {
        const profile: UserProfile = {
          displayName: 'Test Free User',
          email: 'free_burst@plateup.com',
          plan: 'free',
          extractionsThisMonth: 0,
          extractionMonth: '2026-08',
          createdAt: new Date(),
          preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        };

        const now = new Date('2026-08-28T12:00:00Z');

        // Simulate 20 sequential extraction attempts
        const results: { attempt: number; allowed: boolean; remaining: number }[] = [];

        for (let i = 1; i <= 20; i++) {
          const usage = getExtractionUsage(profile, now);
          if (!usage.isLimitReached) {
            profile.extractionsThisMonth = (profile.extractionsThisMonth || 0) + 1;
            const updated = getExtractionUsage(profile, now);
            results.push({ attempt: i, allowed: true, remaining: updated.remaining });
          } else {
            results.push({ attempt: i, allowed: false, remaining: 0 });
          }
        }

        // Verify first 5 were allowed
        for (let i = 0; i < 5; i++) {
          assert.strictEqual(results[i].allowed, true, `Attempt ${i + 1} should be allowed`);
          assert.strictEqual(results[i].remaining, 4 - i, `Remaining should be ${4 - i}`);
        }

        // Verify 6th through 20th were blocked
        for (let i = 5; i < 20; i++) {
          assert.strictEqual(results[i].allowed, false, `Attempt ${i + 1} should be blocked`);
          assert.strictEqual(results[i].remaining, 0, `Remaining should be 0`);
        }

        assert.strictEqual(profile.extractionsThisMonth, 5);
      });

      it('Pro tier user can perform 50+ rapid extractions with infinite remaining quota', () => {
        const proProfile: UserProfile = {
          displayName: 'Pro Chef',
          email: 'pro_unlimited@plateup.com',
          plan: 'pro',
          subscriptionId: 'sub_pro_burst_123',
          subscriptionStatus: 'active',
          extractionsThisMonth: 100,
          extractionMonth: '2026-08',
          createdAt: new Date(),
          preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        };

        const now = new Date('2026-08-28T12:00:00Z');

        for (let i = 1; i <= 50; i++) {
          proProfile.extractionsThisMonth = (proProfile.extractionsThisMonth || 0) + 1;
          const usage = getExtractionUsage(proProfile, now);
          assert.strictEqual(usage.plan, 'pro');
          assert.strictEqual(usage.isLimitReached, false);
          assert.strictEqual(usage.remaining, Infinity);
          assert.strictEqual(usage.limit, Infinity);
        }

        assert.strictEqual(proProfile.extractionsThisMonth, 150);
      });
    });

    describe('2.2: Year Boundary Transitions & Calendar Rollover', () => {
      it('handles year transition 2026-12 to 2027-01 with automatic quota reset', () => {
        const dec31 = new Date('2026-12-31T23:59:59Z');
        const jan01 = new Date('2027-01-01T00:00:00Z');

        assert.strictEqual(getCurrentMonthKey(dec31), '2026-12');
        assert.strictEqual(getCurrentMonthKey(jan01), '2027-01');

        // User exhausted 5 extractions in December
        const profile: UserProfile = {
          displayName: 'New Year User',
          email: 'ny@example.com',
          plan: 'free',
          extractionsThisMonth: 5,
          extractionMonth: '2026-12',
          createdAt: new Date('2026-01-01'),
          preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        };

        // In December, limit is reached
        const decUsage = getExtractionUsage(profile, dec31);
        assert.strictEqual(decUsage.isLimitReached, true);
        assert.strictEqual(decUsage.remaining, 0);

        // On Jan 1st, count resets to 0 and user has 5 fresh extractions
        const janUsage = getExtractionUsage(profile, jan01);
        assert.strictEqual(janUsage.used, 0);
        assert.strictEqual(janUsage.remaining, 5);
        assert.strictEqual(janUsage.isLimitReached, false);
      });

      it('handles decadal and century transitions (2029-12 -> 2030-01, 1999-12 -> 2000-01)', () => {
        assert.strictEqual(getCurrentMonthKey(new Date('2029-12-31T23:59:59Z')), '2029-12');
        assert.strictEqual(getCurrentMonthKey(new Date('2030-01-01T00:00:00Z')), '2030-01');
        assert.strictEqual(getCurrentMonthKey(new Date('1999-12-31T23:59:59Z')), '1999-12');
        assert.strictEqual(getCurrentMonthKey(new Date('2000-01-01T00:00:00Z')), '2000-01');
      });
    });

    describe('2.3: Leap Days & Leap Year Rollovers', () => {
      it('correctly parses leap day 2028-02-29 and rollover to 2028-03-01', () => {
        const leapDay = new Date('2028-02-29T12:00:00Z');
        const marchFirst = new Date('2028-03-01T00:00:00Z');

        assert.strictEqual(getCurrentMonthKey(leapDay), '2028-02');
        assert.strictEqual(getCurrentMonthKey(marchFirst), '2028-03');

        const profile: UserProfile = {
          displayName: 'Leap User',
          email: 'leap@example.com',
          plan: 'free',
          extractionsThisMonth: 5,
          extractionMonth: '2028-02',
          createdAt: new Date(),
          preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        };

        const leapUsage = getExtractionUsage(profile, leapDay);
        assert.strictEqual(leapUsage.isLimitReached, true);

        const marchUsage = getExtractionUsage(profile, marchFirst);
        assert.strictEqual(marchUsage.isLimitReached, false);
        assert.strictEqual(marchUsage.remaining, 5);
      });

      it('handles non-leap year February 28 to March 1 (e.g. 2027-02-28 -> 2027-03-01)', () => {
        const feb28 = new Date('2027-02-28T23:59:59Z');
        const mar01 = new Date('2027-03-01T00:00:00Z');

        assert.strictEqual(getCurrentMonthKey(feb28), '2027-02');
        assert.strictEqual(getCurrentMonthKey(mar01), '2027-03');
      });
    });

    describe('2.4: Malformed, Corrupted & Extreme Profile States', () => {
      it('handles negative extraction count by clamping used to 0', () => {
        const corruptProfile = {
          plan: 'free' as SubscriptionPlan,
          extractionsThisMonth: -99,
          extractionMonth: '2026-08',
        } as UserProfile;

        const usage = getExtractionUsage(corruptProfile, new Date('2026-08-28T12:00:00Z'));
        assert.strictEqual(usage.used, 0);
        assert.strictEqual(usage.remaining, 5);
        assert.strictEqual(usage.isLimitReached, false);
      });

      it('handles corrupt extraction numbers (>5000 on free plan) by clamping remaining to 0', () => {
        const overflowProfile = {
          plan: 'free' as SubscriptionPlan,
          extractionsThisMonth: 999999,
          extractionMonth: '2026-08',
        } as UserProfile;

        const usage = getExtractionUsage(overflowProfile, new Date('2026-08-28T12:00:00Z'));
        assert.strictEqual(usage.used, 999999);
        assert.strictEqual(usage.remaining, 0);
        assert.strictEqual(usage.isLimitReached, true);
      });

      it('handles missing extractionMonth in profile gracefully', () => {
        const legacyProfile = {
          plan: 'free' as SubscriptionPlan,
          extractionsThisMonth: 3,
        } as UserProfile;

        const usage = getExtractionUsage(legacyProfile, new Date('2026-08-28T12:00:00Z'));
        // If extractionMonth is undefined, treated as not current month -> reset to 0
        assert.strictEqual(usage.used, 0);
        assert.strictEqual(usage.remaining, 5);
      });

      it('handles invalid date objects passed to getCurrentMonthKey without throwing', () => {
        const invalidDate = new Date('invalid date string');
        const key = getCurrentMonthKey(invalidDate);
        assert.ok(typeof key === 'string');
        assert.ok(/^\d{4}-\d{2}$/.test(key));
      });
    });
  });

  // =========================================================================
  // DOMAIN 3: MALFORMED STRIPE CHECKOUT & WEBHOOK REQUESTS
  // =========================================================================
  describe('Domain 3: Malformed Stripe Checkout & Webhook Requests', () => {

    describe('3.1: createCheckoutSession Parameter Validation', () => {
      it('throws error when userId is missing, null, undefined or whitespace-only', async () => {
        await assert.rejects(async () => {
          await createCheckoutSession({ userId: '' });
        }, /Missing required field: userId/);

        await assert.rejects(async () => {
          // @ts-expect-error testing runtime safety
          await createCheckoutSession({ userId: null });
        }, /Missing required field: userId/);

        await assert.rejects(async () => {
          // @ts-expect-error testing runtime safety
          await createCheckoutSession({});
        }, /Missing required field: userId/);
      });

      it('enforces Pro pricing constants ($4.99 / 499 cents)', async () => {
        assert.strictEqual(PRO_MONTHLY_PRICE_USD, 4.99);
        assert.strictEqual(PRO_PRICE_CENTS, 499);

        const session = await createCheckoutSession({
          userId: 'user_stress_test_1',
          userEmail: 'chef@plateup.com',
        });

        assert.strictEqual(session.amount, 499);
        assert.strictEqual(session.currency, 'usd');
        assert.strictEqual(session.mode, 'subscription');
        assert.strictEqual(session.recurringInterval, 'month');
        assert.strictEqual(session.metadata.userId, 'user_stress_test_1');
      });
    });

    describe('3.2: verifyCheckoutSession Adversarial Inputs', () => {
      it('rejects empty or non-string sessionId', async () => {
        await assert.rejects(async () => {
          await verifyCheckoutSession('');
        }, /Invalid or expired Stripe session ID/);

        await assert.rejects(async () => {
          await verifyCheckoutSession(null as any);
        }, /Invalid or expired Stripe session ID/);
      });

      it('rejects verification when userId is missing and cannot be resolved', async () => {
        await assert.rejects(async () => {
          await verifyCheckoutSession('cs_test_sample_session_id', '');
        }, /User ID required for verification/);
      });

      it('verifies session with valid parameters and sets active subscription state', async () => {
        const verification = await verifyCheckoutSession('cs_test_valid_123', 'user_verified_1');
        assert.strictEqual(verification.success, true);
        assert.strictEqual(verification.plan, 'pro');
        assert.strictEqual(verification.subscriptionStatus, 'active');
        assert.strictEqual(verification.userId, 'user_verified_1');
        assert.ok(verification.subscriptionId.startsWith('sub_'));
      });
    });

    describe('3.3: handleStripeWebhookEvent Payload Robustness', () => {
      it('returns unhandled_event_type for arbitrary unrecognized events without throwing', async () => {
        const unhandledEvents = [
          'payment_intent.created',
          'charge.succeeded',
          'invoice.payment_failed',
          'coupon.created',
          'random.unexpected.event',
        ];

        for (const type of unhandledEvents) {
          const payload: StripeWebhookPayload = {
            id: `evt_${type}`,
            type,
            data: { object: { id: 'obj_123' } },
          };

          const result = await handleStripeWebhookEvent(payload);
          assert.strictEqual(result.handled, false);
          assert.strictEqual(result.action, 'unhandled_event_type');
        }
      });

      it('handles checkout.session.completed with missing userId safely', async () => {
        const payload: StripeWebhookPayload = {
          id: 'evt_no_user',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_anonymous',
              status: 'complete',
            },
          },
        };

        const result = await handleStripeWebhookEvent(payload);
        assert.strictEqual(result.handled, false);
        assert.strictEqual(result.action, 'missing_user_id');
      });

      it('handles customer.subscription.deleted with metadata userId', async () => {
        const payload: StripeWebhookPayload = {
          id: 'evt_sub_del',
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_del_stress',
              metadata: { userId: 'user_cancel_1' },
              status: 'canceled',
            },
          },
        };

        const result = await handleStripeWebhookEvent(payload);
        assert.strictEqual(result.handled, true);
        assert.strictEqual(result.action, 'downgraded_to_free');
        assert.strictEqual(result.userId, 'user_cancel_1');
      });

      it('handles customer.subscription.updated with active and unpaid statuses', async () => {
        const activePayload: StripeWebhookPayload = {
          id: 'evt_sub_active',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_upd_stress',
              metadata: { userId: 'user_upd_1' },
              status: 'active',
            },
          },
        };

        const activeRes = await handleStripeWebhookEvent(activePayload);
        assert.strictEqual(activeRes.handled, true);
        assert.strictEqual(activeRes.action, 'updated_status_active');

        const unpaidPayload: StripeWebhookPayload = {
          id: 'evt_sub_unpaid',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_upd_stress',
              metadata: { userId: 'user_upd_1' },
              status: 'unpaid',
            },
          },
        };

        const unpaidRes = await handleStripeWebhookEvent(unpaidPayload);
        assert.strictEqual(unpaidRes.handled, true);
        assert.strictEqual(unpaidRes.action, 'updated_status_unpaid');
      });
    });

    describe('3.4: Simulated Route Handler Invariant Checks', () => {
      // Simulates /api/stripe/checkout route request validation logic
      const simulateCheckoutRoute = async (body: any) => {
        const { userId, userEmail, returnUrl } = body || {};
        if (!userId || typeof userId !== 'string' || !userId.trim()) {
          return { status: 400, error: 'Missing required field: userId' };
        }
        const session = await createCheckoutSession({
          userId: userId.trim(),
          userEmail: userEmail ? String(userEmail).trim() : undefined,
          returnUrl: returnUrl ? String(returnUrl).trim() : undefined,
        });
        return { status: 200, data: session };
      };

      it('simulateCheckoutRoute enforces non-empty string userId', async () => {
        assert.strictEqual((await simulateCheckoutRoute({})).status, 400);
        assert.strictEqual((await simulateCheckoutRoute({ userId: '' })).status, 400);
        assert.strictEqual((await simulateCheckoutRoute({ userId: '   ' })).status, 400);
        assert.strictEqual((await simulateCheckoutRoute({ userId: null })).status, 400);

        const ok = await simulateCheckoutRoute({ userId: 'usr_valid_route_1' });
        assert.strictEqual(ok.status, 200);
        assert.strictEqual(ok.data?.amount, 499);
      });

      // Simulates /api/stripe/verify-session route request validation logic
      const simulateVerifyRoute = async (body: any) => {
        const { sessionId, userId } = body || {};
        if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
          return { status: 400, error: 'Missing required field: sessionId' };
        }
        try {
          const result = await verifyCheckoutSession(sessionId.trim(), userId ? String(userId).trim() : undefined);
          return { status: 200, data: result };
        } catch (e) {
          return { status: 400, error: (e as Error).message };
        }
      };

      it('simulateVerifyRoute enforces valid sessionId and userId', async () => {
        assert.strictEqual((await simulateVerifyRoute({})).status, 400);
        assert.strictEqual((await simulateVerifyRoute({ sessionId: '' })).status, 400);
        assert.strictEqual((await simulateVerifyRoute({ sessionId: 'cs_test_123', userId: '' })).status, 400);

        const ok = await simulateVerifyRoute({ sessionId: 'cs_test_123', userId: 'usr_123' });
        assert.strictEqual(ok.status, 200);
        assert.strictEqual(ok.data?.plan, 'pro');
      });

      // Simulates /api/stripe/webhook route request validation logic
      const simulateWebhookRoute = async (rawJson: string) => {
        let payload: StripeWebhookPayload;
        try {
          payload = JSON.parse(rawJson);
        } catch {
          return { status: 400, error: 'Invalid JSON payload' };
        }

        if (!payload || !payload.type || !payload.data?.object) {
          return { status: 400, error: 'Invalid Stripe event format' };
        }

        const result = await handleStripeWebhookEvent(payload);
        return { status: 200, data: result };
      };

      it('simulateWebhookRoute rejects invalid JSON and malformed payloads', async () => {
        assert.strictEqual((await simulateWebhookRoute('invalid json')).status, 400);
        assert.strictEqual((await simulateWebhookRoute('{}')).status, 400);
        assert.strictEqual((await simulateWebhookRoute(JSON.stringify({ type: 'test' }))).status, 400);

        const validEvent = {
          id: 'evt_sim_1',
          type: 'checkout.session.completed',
          data: { object: { id: 'cs_1', metadata: { userId: 'u1' } } },
        };
        const ok = await simulateWebhookRoute(JSON.stringify(validEvent));
        assert.strictEqual(ok.status, 200);
        assert.strictEqual(ok.data?.action, 'upgraded_to_pro');
      });
    });
  });
});
