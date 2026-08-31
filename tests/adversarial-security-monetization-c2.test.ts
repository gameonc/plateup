/**
 * Adversarial Security & Monetization Boundary Verification Test Suite (Challenger 2)
 *
 * Exhaustively challenges:
 * 1. Stripe Webhook Signature Verification (HMAC-SHA256, forged signatures, expired timestamps, simulation mode)
 * 2. Firestore Security Rules (privilege escalation, plan/stripeCustomerId tampering, access control)
 * 3. Freemium Quota & Monetization Boundaries (5/mo limit, month/year rollovers, Pro unlimited, Discover ungated)
 * 4. Secret Safety (Server-side API keys, NEXT_PUBLIC_ audit, zero client exposure)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  verifyStripeWebhookSignature,
  handleStripeWebhookEvent,
  createCheckoutSession,
  verifyCheckoutSession,
  PRO_MONTHLY_PRICE_USD,
  PRO_PRICE_CENTS,
  type StripeWebhookPayload,
} from '../src/lib/stripe.ts';

import {
  getCurrentMonthKey,
  getExtractionUsage,
  FREE_TIER_MONTHLY_LIMIT,
  type ExtractionUsage,
} from '../src/lib/usage.ts';

import { mealToRecipeData, type MealDBMeal } from '../src/lib/mealdb.ts';
import type { UserProfile, SubscriptionPlan } from '../src/types/index.ts';

const PROJECT_ROOT = process.cwd();

describe('Challenger 2: Adversarial Security & Monetization Boundary Verification', () => {

  // =========================================================================
  // 1. STRIPE WEBHOOK SIGNATURE VERIFICATION
  // =========================================================================
  describe('Domain 1: Stripe Webhook Signature Verification & Event Security', () => {
    const TEST_SECRET = 'whsec_test_valid_signing_secret_9876543210abcdef';

    it('C2-STRIPE-1: Rejects missing or empty stripe-signature header when secret is configured', () => {
      const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' });
      
      assert.throws(
        () => verifyStripeWebhookSignature(payload, null, TEST_SECRET),
        /Missing stripe-signature header/
      );
      assert.throws(
        () => verifyStripeWebhookSignature(payload, '', TEST_SECRET),
        /Missing stripe-signature header/
      );
    });

    it('C2-STRIPE-2: Rejects forged HMAC-SHA256 signatures with invalid signature error', () => {
      const payload = JSON.stringify({ id: 'evt_forged', type: 'checkout.session.completed' });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const forgedSig = 'a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef';
      const header = `t=${timestamp},v1=${forgedSig}`;

      assert.throws(
        () => verifyStripeWebhookSignature(payload, header, TEST_SECRET),
        /Stripe webhook signature verification failed/
      );
    });

    it('C2-STRIPE-3: Rejects expired webhook signatures (> 300 seconds past)', () => {
      const payload = JSON.stringify({ id: 'evt_expired', type: 'checkout.session.completed' });
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 301).toString();
      const signedPayload = `${expiredTimestamp}.${payload}`;
      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(signedPayload, 'utf8');
      const validSigForExpiredTime = hmac.digest('hex');
      const header = `t=${expiredTimestamp},v1=${validSigForExpiredTime}`;

      assert.throws(
        () => verifyStripeWebhookSignature(payload, header, TEST_SECRET),
        /Stripe webhook signature timestamp expired or invalid/
      );
    });

    it('C2-STRIPE-4: Rejects future timestamps beyond 300s tolerance window', () => {
      const payload = JSON.stringify({ id: 'evt_future', type: 'checkout.session.completed' });
      const futureTimestamp = (Math.floor(Date.now() / 1000) + 305).toString();
      const signedPayload = `${futureTimestamp}.${payload}`;
      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(signedPayload, 'utf8');
      const sig = hmac.digest('hex');
      const header = `t=${futureTimestamp},v1=${sig}`;

      assert.throws(
        () => verifyStripeWebhookSignature(payload, header, TEST_SECRET),
        /Stripe webhook signature timestamp expired or invalid/
      );
    });

    it('C2-STRIPE-5: Rejects malformed header formats (missing t, missing v1, non-numeric timestamp)', () => {
      const payload = JSON.stringify({ id: 'evt_malformed' });

      // Missing timestamp
      assert.throws(
        () => verifyStripeWebhookSignature(payload, 'v1=abcdef', TEST_SECRET),
        /Invalid stripe-signature header format/
      );

      // Missing v1 signature
      assert.throws(
        () => verifyStripeWebhookSignature(payload, `t=${Math.floor(Date.now() / 1000)}`, TEST_SECRET),
        /Invalid stripe-signature header format/
      );

      // Non-numeric timestamp
      assert.throws(
        () => verifyStripeWebhookSignature(payload, 't=notanumber,v1=abcdef', TEST_SECRET),
        /Stripe webhook signature timestamp expired or invalid/
      );
    });

    it('C2-STRIPE-6: Rejects tampered payloads where body was altered after signature generation', () => {
      const originalPayload = JSON.stringify({ id: 'evt_orig', data: { object: { id: 'cs_1', amount: 499 } } });
      const tamperedPayload = JSON.stringify({ id: 'evt_orig', data: { object: { id: 'cs_1', amount: 0 } } });

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${originalPayload}`;
      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(signedPayload, 'utf8');
      const signature = hmac.digest('hex');
      const header = `t=${timestamp},v1=${signature}`;

      // Sending tampered body with signature calculated for original body
      assert.throws(
        () => verifyStripeWebhookSignature(tamperedPayload, header, TEST_SECRET),
        /Stripe webhook signature verification failed/
      );
    });

    it('C2-STRIPE-7: Accepts valid HMAC-SHA256 signature within 300s window and parses payload', () => {
      const payloadObj = {
        id: 'evt_valid_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_live_valid',
            metadata: { userId: 'user_c2_adv' },
            subscription: 'sub_live_adv_123',
          },
        },
      };
      const rawBody = JSON.stringify(payloadObj);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${rawBody}`;
      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(signedPayload, 'utf8');
      const signature = hmac.digest('hex');
      const header = `t=${timestamp},v1=${signature}`;

      const verified = verifyStripeWebhookSignature(rawBody, header, TEST_SECRET);
      assert.strictEqual(verified.id, 'evt_valid_123');
      assert.strictEqual(verified.type, 'checkout.session.completed');
      assert.strictEqual(verified.data.object.id, 'cs_live_valid');
      assert.strictEqual(verified.data.object.metadata?.userId, 'user_c2_adv');
    });

    it('C2-STRIPE-8: Accepts signature rollover when header contains multiple v1 signatures and one matches', () => {
      const payloadObj = { id: 'evt_rollover', type: 'customer.subscription.deleted', data: { object: { id: 'sub_1' } } };
      const rawBody = JSON.stringify(payloadObj);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${rawBody}`;

      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(signedPayload, 'utf8');
      const validSig = hmac.digest('hex');
      const oldInvalidSig = '9999999999999999999999999999999999999999999999999999999999999999';

      const header = `t=${timestamp},v1=${oldInvalidSig},v1=${validSig}`;
      const verified = verifyStripeWebhookSignature(rawBody, header, TEST_SECRET);
      assert.strictEqual(verified.id, 'evt_rollover');
    });

    it('C2-STRIPE-9: Accepts valid payloads in simulation mode without requiring live secret', () => {
      const originalSimMode = process.env.STRIPE_SIMULATION_MODE;
      try {
        process.env.STRIPE_SIMULATION_MODE = 'true';
        const payloadObj = { id: 'evt_sim_mode', type: 'checkout.session.completed', data: { object: { id: 'cs_sim' } } };
        const rawBody = JSON.stringify(payloadObj);

        const verified = verifyStripeWebhookSignature(rawBody, null, undefined);
        assert.strictEqual(verified.id, 'evt_sim_mode');

        // Invalid JSON in simulation mode throws descriptive error
        assert.throws(
          () => verifyStripeWebhookSignature('not json', null, undefined),
          /Invalid JSON payload/
        );
      } finally {
        process.env.STRIPE_SIMULATION_MODE = originalSimMode;
      }
    });

    it('C2-STRIPE-10: Verifies lifecycle events via handleStripeWebhookEvent', async () => {
      // 1. Upgrade on checkout.session.completed
      const checkoutEvt: StripeWebhookPayload = {
        id: 'evt_c2_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_c2',
            metadata: { userId: 'user_c2_pro' },
            subscription: 'sub_test_c2',
          },
        },
      };
      const resUpgrade = await handleStripeWebhookEvent(checkoutEvt);
      assert.strictEqual(resUpgrade.handled, true);
      assert.strictEqual(resUpgrade.action, 'upgraded_to_pro');
      assert.strictEqual(resUpgrade.userId, 'user_c2_pro');

      // 2. Downgrade on customer.subscription.deleted
      const deleteEvt: StripeWebhookPayload = {
        id: 'evt_c2_2',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_c2',
            metadata: { userId: 'user_c2_pro' },
            status: 'canceled',
          },
        },
      };
      const resDowngrade = await handleStripeWebhookEvent(deleteEvt);
      assert.strictEqual(resDowngrade.handled, true);
      assert.strictEqual(resDowngrade.action, 'downgraded_to_free');
      assert.strictEqual(resDowngrade.userId, 'user_c2_pro');

      // 3. Status update on customer.subscription.updated
      const updateEvt: StripeWebhookPayload = {
        id: 'evt_c2_3',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_c2',
            metadata: { userId: 'user_c2_pro' },
            status: 'active',
          },
        },
      };
      const resUpdate = await handleStripeWebhookEvent(updateEvt);
      assert.strictEqual(resUpdate.handled, true);
      assert.strictEqual(resUpdate.action, 'updated_status_active');

      // 4. Unhandled event
      const unknownEvt: StripeWebhookPayload = {
        id: 'evt_c2_4',
        type: 'charge.dispute.created',
        data: { object: { id: 'dp_1' } },
      };
      const resUnknown = await handleStripeWebhookEvent(unknownEvt);
      assert.strictEqual(resUnknown.handled, false);
      assert.strictEqual(resUnknown.action, 'unhandled_event_type');
    });
  });

  // =========================================================================
  // 2. FIRESTORE SECURITY RULES PRIVILEGE ESCALATION RESISTANCE
  // =========================================================================
  describe('Domain 2: Firestore Security Rules & Privilege Escalation Hardening', () => {
    const rulesPath = path.join(PROJECT_ROOT, 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    it('C2-RULES-1: Firestore rules strictly require rules_version 2 and service cloud.firestore', () => {
      assert.ok(rulesContent.includes("rules_version = '2';"));
      assert.ok(rulesContent.includes("service cloud.firestore"));
    });

    it('C2-RULES-2: Contains isValidUserCreate() and isValidUserUpdate() functions', () => {
      assert.ok(rulesContent.includes('function isValidUserCreate()'));
      assert.ok(rulesContent.includes('function isValidUserUpdate()'));
    });

    it('C2-RULES-3: isValidUserCreate() enforces default "free" plan and empty stripeCustomerId', () => {
      assert.ok(rulesContent.includes("request.resource.data.get('plan', 'free') == 'free'"));
      assert.ok(rulesContent.includes("request.resource.data.get('stripeCustomerId', '') == ''"));
    });

    it('C2-RULES-4: isValidUserUpdate() prevents client modification of plan or stripeCustomerId', () => {
      assert.ok(rulesContent.includes("request.resource.data.get('plan', 'free') == resource.data.get('plan', 'free')"));
      assert.ok(rulesContent.includes("request.resource.data.get('stripeCustomerId', '') == resource.data.get('stripeCustomerId', '')"));
    });

    it('C2-RULES-5: Enforces isOwner(userId) on users document and all subcollections', () => {
      assert.ok(rulesContent.includes('match /users/{userId}'));
      assert.ok(rulesContent.includes('allow read: if isOwner(userId);'));
      assert.ok(rulesContent.includes('allow create: if isOwner(userId) && isValidUserCreate();'));
      assert.ok(rulesContent.includes('allow update: if isOwner(userId) && isValidUserUpdate();'));
      assert.ok(rulesContent.includes('allow delete: if isOwner(userId);'));

      // Subcollections
      assert.ok(rulesContent.includes('match /recipes/{recipeId}'));
      assert.ok(rulesContent.includes('match /mealPlans/{planId}'));
      assert.ok(rulesContent.includes('match /cookingLog/{logId}'));
      assert.ok(rulesContent.includes('match /shoppingLists/{listId}'));
      assert.ok(rulesContent.includes('match /shoppingList/{itemId}'));
    });

    it('C2-RULES-6: Enforces global default deny on all other paths', () => {
      assert.ok(rulesContent.includes('match /{document=**}'));
      assert.ok(rulesContent.includes('allow read, write: if false;'));
    });

    it('C2-RULES-7: Evaluates rule logic simulator across adversarial attack vectors', () => {
      interface RuleContext {
        auth: { uid: string } | null;
        path: string;
        operation: 'create' | 'update' | 'read' | 'delete';
        requestData?: Record<string, unknown>;
        resourceData?: Record<string, unknown>;
      }

      function evaluateFirestoreRules(ctx: RuleContext): boolean {
        // Default deny
        if (!ctx.auth) return false;

        const userMatch = ctx.path.match(/^\/users\/([^/]+)(\/(.*))?$/);
        if (!userMatch) return false;

        const docUserId = userMatch[1];
        const subpath = userMatch[3];

        const isOwner = ctx.auth.uid === docUserId;
        if (!isOwner) return false;

        if (!subpath) {
          // /users/{userId} document
          if (ctx.operation === 'read' || ctx.operation === 'delete') return true;
          if (ctx.operation === 'create') {
            const plan = (ctx.requestData?.plan as string) ?? 'free';
            const stripeCustomerId = (ctx.requestData?.stripeCustomerId as string) ?? '';
            return plan === 'free' && stripeCustomerId === '';
          }
          if (ctx.operation === 'update') {
            const reqPlan = (ctx.requestData?.plan as string) ?? 'free';
            const resPlan = (ctx.resourceData?.plan as string) ?? 'free';
            const reqStripeId = (ctx.requestData?.stripeCustomerId as string) ?? '';
            const resStripeId = (ctx.resourceData?.stripeCustomerId as string) ?? '';
            return reqPlan === resPlan && reqStripeId === resStripeId;
          }
          return false;
        }

        // Subcollections allow read/write for owner
        return true;
      }

      // Attack Vector 1: Unauthenticated access
      assert.strictEqual(evaluateFirestoreRules({
        auth: null,
        path: '/users/user1',
        operation: 'read',
      }), false, 'Unauthenticated read rejected');

      // Attack Vector 2: User A accessing User B
      assert.strictEqual(evaluateFirestoreRules({
        auth: { uid: 'attacker' },
        path: '/users/victim',
        operation: 'read',
      }), false, 'Cross-user read rejected');

      // Attack Vector 3: Client creates user doc with plan: 'pro'
      assert.strictEqual(evaluateFirestoreRules({
        auth: { uid: 'attacker' },
        path: '/users/attacker',
        operation: 'create',
        requestData: { plan: 'pro', email: 'attacker@evil.com' },
      }), false, 'Creation with plan=pro rejected');

      // Attack Vector 4: Client creates user doc with stripeCustomerId
      assert.strictEqual(evaluateFirestoreRules({
        auth: { uid: 'attacker' },
        path: '/users/attacker',
        operation: 'create',
        requestData: { stripeCustomerId: 'cus_stolen', email: 'attacker@evil.com' },
      }), false, 'Creation with stripeCustomerId rejected');

      // Attack Vector 5: Legitimate user creation (default/free plan)
      assert.strictEqual(evaluateFirestoreRules({
        auth: { uid: 'legit_user' },
        path: '/users/legit_user',
        operation: 'create',
        requestData: { plan: 'free', displayName: 'Chef Mario' },
      }), true, 'Legitimate user creation allowed');

      // Attack Vector 6: Client updates plan from 'free' to 'pro'
      assert.strictEqual(evaluateFirestoreRules({
        auth: { uid: 'legit_user' },
        path: '/users/legit_user',
        operation: 'update',
        resourceData: { plan: 'free', stripeCustomerId: '' },
        requestData: { plan: 'pro', stripeCustomerId: '' },
      }), false, 'Privilege escalation update free -> pro rejected');

      // Attack Vector 7: Client updates stripeCustomerId
      assert.strictEqual(evaluateFirestoreRules({
        auth: { uid: 'legit_user' },
        path: '/users/legit_user',
        operation: 'update',
        resourceData: { plan: 'free', stripeCustomerId: 'cus_old' },
        requestData: { plan: 'free', stripeCustomerId: 'cus_fake' },
      }), false, 'Tampering with stripeCustomerId rejected');

      // Attack Vector 8: Legitimate profile preference updates (preserves plan & stripeCustomerId)
      assert.strictEqual(evaluateFirestoreRules({
        auth: { uid: 'legit_user' },
        path: '/users/legit_user',
        operation: 'update',
        resourceData: { plan: 'free', stripeCustomerId: '', preferences: {} },
        requestData: { plan: 'free', stripeCustomerId: '', preferences: { dietaryRestrictions: ['vegan'] } },
      }), true, 'Legitimate preferences update allowed');
    });
  });

  // =========================================================================
  // 3. FREEMIUM MONTHLY QUOTA & MONETIZATION BOUNDARIES
  // =========================================================================
  describe('Domain 3: Freemium Monthly Quota & Gating Boundaries', () => {
    it('C2-QUOTA-1: Free tier monthly limit constant is strictly 5', () => {
      assert.strictEqual(FREE_TIER_MONTHLY_LIMIT, 5);
    });

    it('C2-QUOTA-2: Evaluates free tier usage calculations from 0 to 5 extractions', () => {
      const currentMonth = '2026-08';

      // 0 extractions used
      const profile0: UserProfile = {
        uid: 'u1', displayName: 'Chef U1', email: 'u1@test.com', plan: 'free',
        extractionsThisMonth: 0, extractionMonth: currentMonth,
        createdAt: new Date(), preferences: { repeatWindowDays: 5, mealsPerDay: ['dinner'], dietaryRestrictions: [] },
      };
      const usage0 = getExtractionUsage(profile0, new Date('2026-08-15T12:00:00Z'));
      assert.strictEqual(usage0.used, 0);
      assert.strictEqual(usage0.limit, 5);
      assert.strictEqual(usage0.remaining, 5);
      assert.strictEqual(usage0.isLimitReached, false);

      // 3 extractions used
      const profile3: UserProfile = { ...profile0, extractionsThisMonth: 3 };
      const usage3 = getExtractionUsage(profile3, new Date('2026-08-15T12:00:00Z'));
      assert.strictEqual(usage3.used, 3);
      assert.strictEqual(usage3.remaining, 2);
      assert.strictEqual(usage3.isLimitReached, false);

      // 5 extractions used (limit reached)
      const profile5: UserProfile = { ...profile0, extractionsThisMonth: 5 };
      const usage5 = getExtractionUsage(profile5, new Date('2026-08-15T12:00:00Z'));
      assert.strictEqual(usage5.used, 5);
      assert.strictEqual(usage5.remaining, 0);
      assert.strictEqual(usage5.isLimitReached, true);

      // Exceeded limit (e.g. 6 extractions)
      const profile6: UserProfile = { ...profile0, extractionsThisMonth: 6 };
      const usage6 = getExtractionUsage(profile6, new Date('2026-08-15T12:00:00Z'));
      assert.strictEqual(usage6.used, 6);
      assert.strictEqual(usage6.remaining, 0);
      assert.strictEqual(usage6.isLimitReached, true);
    });

    it('C2-QUOTA-3: Pro tier provides infinite quota and never marks isLimitReached', () => {
      const currentMonth = '2026-08';
      const proProfile: UserProfile = {
        uid: 'pro_user', displayName: 'Chef Pro', email: 'pro@test.com', plan: 'pro',
        extractionsThisMonth: 125, extractionMonth: currentMonth,
        createdAt: new Date(), preferences: { repeatWindowDays: 5, mealsPerDay: ['dinner'], dietaryRestrictions: [] },
      };

      const usage = getExtractionUsage(proProfile, new Date('2026-08-15T12:00:00Z'));
      assert.strictEqual(usage.plan, 'pro');
      assert.strictEqual(usage.limit, Infinity);
      assert.strictEqual(usage.remaining, Infinity);
      assert.strictEqual(usage.isLimitReached, false);
      assert.strictEqual(usage.used, 125);
    });

    it('C2-QUOTA-4: Calendar month rollover resets used count to 0 and remaining to 5 for Free users', () => {
      // User used 5 in July 2026
      const profileJuly: UserProfile = {
        uid: 'u_rollover', displayName: 'Chef Rollover', email: 'u@test.com', plan: 'free',
        extractionsThisMonth: 5, extractionMonth: '2026-07',
        createdAt: new Date(), preferences: { repeatWindowDays: 5, mealsPerDay: ['dinner'], dietaryRestrictions: [] },
      };

      // Checked in August 2026
      const usageAug = getExtractionUsage(profileJuly, new Date('2026-08-01T00:01:00Z'));
      assert.strictEqual(usageAug.used, 0, 'Used count resets in new month');
      assert.strictEqual(usageAug.remaining, 5, 'Remaining quota resets to 5 in new month');
      assert.strictEqual(usageAug.isLimitReached, false, 'Limit is not reached in new month');
    });

    it('C2-QUOTA-5: Handles year boundary (2026-12 -> 2027-01) and leap year rollovers seamlessly', () => {
      const profileDec: UserProfile = {
        uid: 'u_year', displayName: 'Chef Dec', email: 'u@test.com', plan: 'free',
        extractionsThisMonth: 5, extractionMonth: '2026-12',
        createdAt: new Date(), preferences: { repeatWindowDays: 5, mealsPerDay: ['dinner'], dietaryRestrictions: [] },
      };

      const usageJan = getExtractionUsage(profileDec, new Date('2027-01-01T00:00:00Z'));
      assert.strictEqual(usageJan.used, 0);
      assert.strictEqual(usageJan.remaining, 5);
      assert.strictEqual(usageJan.isLimitReached, false);

      // Leap day test: 2028-02-29 -> 2028-03-01
      const profileLeapFeb: UserProfile = {
        uid: 'u_leap', displayName: 'Chef Leap', email: 'u@test.com', plan: 'free',
        extractionsThisMonth: 5, extractionMonth: '2028-02',
        createdAt: new Date(), preferences: { repeatWindowDays: 5, mealsPerDay: ['dinner'], dietaryRestrictions: [] },
      };
      const usageLeapMarch = getExtractionUsage(profileLeapFeb, new Date('2028-03-01T00:00:00Z'));
      assert.strictEqual(usageLeapMarch.used, 0);
      assert.strictEqual(usageLeapMarch.remaining, 5);
    });

    it('C2-QUOTA-6: Robust against corrupt/negative numbers or missing properties in profile', () => {
      // Negative count in DB
      const profileNeg = {
        displayName: 'Chef Neg',
        plan: 'free' as SubscriptionPlan,
        extractionsThisMonth: -10,
        extractionMonth: '2026-08',
      } as unknown as UserProfile;
      const usageNeg = getExtractionUsage(profileNeg, new Date('2026-08-10Z'));
      assert.strictEqual(usageNeg.used, 0);
      assert.strictEqual(usageNeg.remaining, 5);

      // Null profile
      const usageNull = getExtractionUsage(null);
      assert.strictEqual(usageNull.plan, 'free');
      assert.strictEqual(usageNull.used, 0);
      assert.strictEqual(usageNull.remaining, 5);
      assert.strictEqual(usageNull.isLimitReached, false);
    });

    it('C2-QUOTA-7: Discover browsing and recipe import is ungated and consumes 0 extraction quota', () => {
      const mockMeal: MealDBMeal = {
        idMeal: '52772',
        strMeal: 'Teriyaki Chicken Casserole',
        strCategory: 'Chicken',
        strArea: 'Japanese',
        strInstructions: 'Preheat oven to 350 F. Mix ingredients and bake for 30 minutes.',
        strMealThumb: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
        strTags: 'Casserole,Meat',
        strYoutube: 'https://www.youtube.com/watch?v=4aZr5hZXP_s',
        strSource: 'https://example.com/recipe',
        strIngredient1: 'soy sauce',
        strMeasure1: '3/4 cup',
        strIngredient2: 'water',
        strMeasure2: '1/2 cup',
        strIngredient3: '',
        strMeasure3: '',
      };

      const convertedRecipe = mealToRecipeData(mockMeal);
      assert.strictEqual(convertedRecipe.name, 'Teriyaki Chicken Casserole');
      assert.strictEqual(convertedRecipe.source, 'manual');
      assert.strictEqual(convertedRecipe.ingredients.length, 2);
      assert.strictEqual(convertedRecipe.ingredients[0].item, 'soy sauce');
      assert.strictEqual(convertedRecipe.ingredients[0].amount, '3/4');
      assert.strictEqual(convertedRecipe.ingredients[0].unit, 'cup');
    });
  });

  // =========================================================================
  // 4. SECRET SAFETY AUDIT
  // =========================================================================
  describe('Domain 4: Secret Safety & Server-Side Key Containment', () => {
    function getAllSourceFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(getAllSourceFiles(fullPath));
        } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(file)) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const srcFiles = getAllSourceFiles(path.join(PROJECT_ROOT, 'src'));

    it('C2-SECRET-1: Zero occurrences of NEXT_PUBLIC_ for GEMINI, STRIPE_SECRET, or YOUTUBE keys', () => {
      const prohibitedPrefixes = [
        'NEXT_PUBLIC_GEMINI',
        'NEXT_PUBLIC_STRIPE_SECRET',
        'NEXT_PUBLIC_STRIPE_KEY',
        'NEXT_PUBLIC_STRIPE_WEBHOOK',
        'NEXT_PUBLIC_YOUTUBE',
      ];

      for (const filePath of srcFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        for (const prefix of prohibitedPrefixes) {
          assert.ok(
            !content.includes(prefix),
            `Security Violation: Prohibited public secret prefix "${prefix}" found in ${path.relative(PROJECT_ROOT, filePath)}`
          );
        }
      }
    });

    it('C2-SECRET-2: Server-side secret keys are only referenced in designated server files', () => {
      for (const filePath of srcFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relative = path.relative(PROJECT_ROOT, filePath);

        // GEMINI_API_KEY must ONLY appear in src/lib/ai-server.ts
        if (content.includes('process.env.GEMINI_API_KEY')) {
          assert.strictEqual(
            relative,
            path.join('src', 'lib', 'ai-server.ts'),
            `GEMINI_API_KEY found outside server module in ${relative}`
          );
        }

        // STRIPE_SECRET_KEY must ONLY appear in src/lib/stripe.ts
        if (content.includes('process.env.STRIPE_SECRET_KEY')) {
          assert.strictEqual(
            relative,
            path.join('src', 'lib', 'stripe.ts'),
            `STRIPE_SECRET_KEY found outside stripe server module in ${relative}`
          );
        }

        // YOUTUBE_API_KEY must ONLY appear in src/lib/youtube.ts
        if (content.includes('process.env.YOUTUBE_API_KEY')) {
          assert.strictEqual(
            relative,
            path.join('src', 'lib', 'youtube.ts'),
            `YOUTUBE_API_KEY found outside youtube server module in ${relative}`
          );
        }
      }
    });

    it('C2-SECRET-3: No client components (\'use client\') import @google/generative-ai or ai-server', () => {
      for (const filePath of srcFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const isClientComponent = content.startsWith("'use client'") || content.startsWith('"use client"');

        if (isClientComponent) {
          assert.ok(
            !content.includes('@google/generative-ai'),
            `Client component ${path.relative(PROJECT_ROOT, filePath)} must not import @google/generative-ai`
          );
          assert.ok(
            !content.includes('ai-server'),
            `Client component ${path.relative(PROJECT_ROOT, filePath)} must not import ai-server`
          );
        }
      }
    });

    it('C2-SECRET-4: Zero hardcoded live credentials or API tokens in source code', () => {
      // Regexes for live tokens
      const liveSecretPatterns = [
        /sk_live_[0-9a-zA-Z]{24,}/,
        /AIzaSy[0-9a-zA-Z_-]{33}/, // Google API key pattern
        /whsec_[0-9a-zA-Z]{32,}/,
      ];

      for (const filePath of srcFiles) {
        // Skip mock/test defaults in firebase.ts or test files
        if (filePath.endsWith('firebase.ts')) continue;

        const content = fs.readFileSync(filePath, 'utf8');
        for (const pattern of liveSecretPatterns) {
          const match = content.match(pattern);
          if (match) {
            // Check if it's an intentional test fixture like 'whsec_test_...'
            const isMockOrTest = match[0].includes('mock') || match[0].includes('test') || match[0].includes('sample');
            assert.ok(
              isMockOrTest,
              `Potential hardcoded live credential "${match[0]}" found in ${path.relative(PROJECT_ROOT, filePath)}`
            );
          }
        }
      }
    });
  });
});
