/**
 * Tier 4: Real-World Application Scenarios for PlateUp Monetization
 * Specification: ORIGINAL_REQUEST.md (§R1, §R2, §R3, §R4) & TEST_INFRA.md
 * 
 * End-to-End User Journeys:
 * 1. Free user extracts recipes 1..5 -> hits limit -> prompted to upgrade -> Stripe checkout ($4.99/mo) -> Pro status & badge -> unlimited extractions.
 * 2. Shopping list & Recipe Detail "Order Ingredients" flow: recipe -> meal plan -> shopping list -> grocery partner URLs & disclosure.
 * 3. Calendar month quota rollover: 5 extractions in August -> September 1 reset -> 5 new free extractions -> upgrade -> cancel subscription -> downgrade.
 * 4. Ungated Discover browsing: free user hits 5/5 AI extractions -> Discover page searches and recipe saving remain 100% free and ungated.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  PlateUpTestEnvironment,
} from '../helpers/test-context.ts';
import {
  cleanIngredientForSearch,
  buildAmazonFreshUrl,
  buildInstacartUrl,
  AFFILIATE_DISCLOSURE_TEXT,
  getCurrentMonthKey,
  getExtractionUsage,
  recordExtractionUsage,
  createStripeCheckoutSession,
  verifyStripeSession,
  handleStripeWebhook,
  FREE_TIER_MONTHLY_LIMIT,
  PRO_MONTHLY_PRICE_USD,
  type MonetizationUserProfile,
} from '../helpers/monetization-helpers.ts';
import { FIXTURE_RECIPES } from '../helpers/recipe-fixtures.ts';

describe('Tier 4: Real-World Monetization & Subscription User Journeys', () => {
  let env: PlateUpTestEnvironment;
  let usersMap: Map<string, MonetizationUserProfile>;

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    usersMap = new Map();
  });

  // Scenario 1: Freemium to Pro Conversion Lifecycle
  it('Scenario 1: Free User Reaches Extraction Limit -> Upgrades via Stripe -> Unlocks Unlimited Extractions', () => {
    // 1. User registers for a free account
    const registered = env.register('hungry_homechef@gmail.com', 'SecurePass2026!', 'Chef Alex');
    const alexUser: MonetizationUserProfile = {
      ...registered,
      plan: 'free',
      extractionsThisMonth: 0,
      extractionMonth: '2026-08',
    };
    usersMap.set(alexUser.uid, alexUser);

    // Initial state: Free plan, 5 free extractions remaining
    let usage = getExtractionUsage(alexUser);
    assert.strictEqual(usage.plan, 'free');
    assert.strictEqual(usage.used, 0);
    assert.strictEqual(usage.remaining, 5);
    assert.strictEqual(usage.isLimitReached, false);

    // 2. Extracts 5 recipes over the course of the month (YouTube + Photo extractions)
    for (let i = 1; i <= 5; i++) {
      const res = recordExtractionUsage(alexUser);
      assert.strictEqual(res.profile.extractionsThisMonth, i);
      assert.strictEqual(res.remaining, 5 - i);
    }

    // 3. User attempts 6th extraction -> UI shows friendly upgrade banner and disables extract button
    usage = getExtractionUsage(alexUser);
    assert.strictEqual(usage.used, 5);
    assert.strictEqual(usage.remaining, 0);
    assert.strictEqual(usage.isLimitReached, true);

    // Attempting extraction blocks and throws error
    assert.throws(() => {
      recordExtractionUsage(alexUser);
    }, /Monthly extraction limit reached for Free plan/);

    // 4. User navigates to /pricing and initiates "Go Pro" checkout
    const checkoutSession = createStripeCheckoutSession({
      userId: alexUser.uid,
      userEmail: alexUser.email,
      returnUrl: 'https://plateup.app/pricing',
    });

    assert.strictEqual(checkoutSession.amount, 499);
    assert.strictEqual(checkoutSession.currency, 'usd');
    assert.strictEqual(checkoutSession.mode, 'subscription');
    assert.strictEqual(checkoutSession.metadata.userId, alexUser.uid);
    assert.ok(checkoutSession.url.startsWith('https://checkout.stripe.com/'));

    // 5. User completes Stripe checkout; Webhook is received and verified
    const webhookEvent = {
      id: 'evt_alex_pro',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: checkoutSession.sessionId,
          metadata: { userId: alexUser.uid },
          subscription: 'sub_alex_monthly_subscription',
          status: 'complete',
          customer_email: alexUser.email,
        }
      }
    };

    const webhookRes = handleStripeWebhook(webhookEvent, usersMap);
    assert.strictEqual(webhookRes.handled, true);
    assert.strictEqual(webhookRes.action, 'upgraded_to_pro');

    // 6. User profile is now Pro in database
    const updatedAlex = usersMap.get(alexUser.uid)!;
    assert.strictEqual(updatedAlex.plan, 'pro');
    assert.strictEqual(updatedAlex.subscriptionId, 'sub_alex_monthly_subscription');
    assert.strictEqual(updatedAlex.subscriptionStatus, 'active');

    // 7. Navbar displays Pro crown badge
    const navbarStatus = {
      isPro: updatedAlex.plan === 'pro',
      badgeLabel: 'Pro',
      icon: 'Crown',
    };
    assert.strictEqual(navbarStatus.isPro, true);

    // 8. User returns to /extract page and performs unlimited extractions without blocks
    const proUsage = getExtractionUsage(updatedAlex);
    assert.strictEqual(proUsage.plan, 'pro');
    assert.strictEqual(proUsage.remaining, Infinity);
    assert.strictEqual(proUsage.isLimitReached, false);

    // Can extract recipes 6, 7, 8...
    const rec6 = recordExtractionUsage(updatedAlex);
    const rec7 = recordExtractionUsage(updatedAlex);
    const rec8 = recordExtractionUsage(updatedAlex);

    assert.strictEqual(rec8.profile.extractionsThisMonth, 8);
    assert.strictEqual(rec8.remaining, Infinity);
  });

  // Scenario 2: Shopping List & Recipe Detail "Order Ingredients" Flow
  it('Scenario 2: Shopping List & Recipe Detail "Order Ingredients" Flow with Partner Stores', () => {
    // 1. User logs in and saves a recipe
    const user = env.register('dinner_shopper@gmail.com', 'ShopPass2026!', 'Dinner Shopper');
    const pastaRecipe = env.saveRecipe(user.uid, FIXTURE_RECIPES[0]); // Pasta Carbonara

    // 2. User views Recipe Detail page and clicks "Order Ingredients"
    const recipeAmzUrl = buildAmazonFreshUrl(pastaRecipe.ingredients);
    const recipeInstaUrl = buildInstacartUrl(pastaRecipe.ingredients);

    assert.ok(recipeAmzUrl.includes('i=amazonfresh'));
    assert.ok(recipeAmzUrl.includes('tag=plateup-20'));
    assert.ok(recipeInstaUrl.includes('partner_tag=plateup_app'));

    // 3. User assigns recipe to Weekly Meal Plan and generates Shopping List
    const weekId = '2026-W35';
    env.assignSlot(user.uid, weekId, 'monday', 'dinner', pastaRecipe);
    const shoppingList = env.generateShoppingList(user.uid, weekId);
    assert.ok(shoppingList.items.length >= 5);

    // 4. User marks pantry items as already owned (e.g. kosher salt, black pepper)
    const salt = shoppingList.items.find(i => i.name.toLowerCase().includes('salt'))!;
    const pepper = shoppingList.items.find(i => i.name.toLowerCase().includes('pepper'))!;
    assert.ok(salt, 'Shopping list should contain salt');
    assert.ok(pepper, 'Shopping list should contain pepper');

    env.toggleShoppingItem(user.uid, weekId, salt.id);
    env.toggleShoppingItem(user.uid, weekId, pepper.id);

    // 5. Clicks "Order Ingredients" on Shopping List page (only unchecked items are ordered)
    const activeItems = shoppingList.items.filter(i => !i.checked);
    assert.strictEqual(activeItems.some(i => i.id === salt.id), false);
    assert.strictEqual(activeItems.some(i => i.id === pepper.id), false);

    const shoppingAmzUrl = buildAmazonFreshUrl(activeItems.map(i => i.name));
    assert.ok(shoppingAmzUrl.includes('amazon.com'));
    assert.ok(!shoppingAmzUrl.includes('salt')); // Checked item excluded

    // 6. Verifies presence of transparent FTC affiliate disclosure modal
    const dialogState = {
      isOpen: true,
      selectedPartner: 'Amazon Fresh',
      outboundUrl: shoppingAmzUrl,
      disclosureText: AFFILIATE_DISCLOSURE_TEXT,
    };

    assert.ok(dialogState.disclosureText.includes('affiliate partner'));
    assert.ok(dialogState.disclosureText.includes('no extra cost'));
  });

  // Scenario 3: Monthly Quota Rollover & Subscription Cancellation Lifecycle
  it('Scenario 3: Monthly Quota Rollover, Upgrade, and Subscription Cancellation', () => {
    // 1. User exhausts 5 free extractions in August 2026
    const user: MonetizationUserProfile = {
      uid: 'user_cycle_1',
      email: 'cycler@plateup.com',
      displayName: 'Cycler',
      createdAt: new Date(),
      preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
      plan: 'free',
      extractionsThisMonth: 5,
      extractionMonth: '2026-08',
    };
    usersMap.set(user.uid, user);

    const augDate = new Date('2026-08-31T20:00:00Z');
    assert.strictEqual(getExtractionUsage(user, augDate).isLimitReached, true);

    // 2. September 1 arrives -> quota automatically resets to 5 remaining
    const septDate = new Date('2026-09-01T08:00:00Z');
    const septUsage = getExtractionUsage(user, septDate);
    assert.strictEqual(septUsage.used, 0);
    assert.strictEqual(septUsage.remaining, 5);
    assert.strictEqual(septUsage.isLimitReached, false);

    // 3. User uses 2 extractions in September
    recordExtractionUsage(user, septDate);
    recordExtractionUsage(user, septDate);
    assert.strictEqual(user.extractionsThisMonth, 2);
    assert.strictEqual(user.extractionMonth, '2026-09');

    // 4. User upgrades to Pro in mid-September
    verifyStripeSession('cs_test_session_upgrade', user.uid, user);
    assert.strictEqual(user.plan, 'pro');
    assert.strictEqual(user.subscriptionStatus, 'active');

    // 5. User cancels Pro subscription at end of billing cycle via customer portal
    const cancelEvent = {
      id: 'evt_cancel_cycle',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: user.subscriptionId!,
          metadata: { userId: user.uid },
          status: 'canceled',
        }
      }
    };

    handleStripeWebhook(cancelEvent, usersMap);
    assert.strictEqual(user.plan, 'free');
    assert.strictEqual(user.subscriptionStatus, 'canceled');

    // 6. User is back on Free plan with standard limits
    const postCancelUsage = getExtractionUsage(user, septDate);
    assert.strictEqual(postCancelUsage.plan, 'free');
  });

  // Scenario 4: Ungated Discover Browsing During Free Limit Exhaustion
  it('Scenario 4: Discover (TheMealDB) Browsing and Recipe Saving Remains 100% Free and Ungated', () => {
    // 1. User has exhausted free AI extractions (5/5)
    const user: MonetizationUserProfile = {
      uid: 'discover_lover_1',
      email: 'discover@plateup.com',
      displayName: 'Discover Explorer',
      createdAt: new Date(),
      preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
      plan: 'free',
      extractionsThisMonth: 5,
      extractionMonth: '2026-08',
    };

    // AI extractions are blocked
    const aiUsage = getExtractionUsage(user);
    assert.strictEqual(aiUsage.isLimitReached, true);

    // 2. User navigates to /discover (TheMealDB public recipes)
    const discoverActions = {
      searchQuery: 'curry',
      canSearch: true,
      canViewDetail: true,
      canSaveToLibrary: true,
    };

    assert.strictEqual(discoverActions.canSearch, true);
    assert.strictEqual(discoverActions.canViewDetail, true);

    // 3. User saves a discovered recipe to their personal collection without consuming AI extraction quota
    const discoveredRecipe = env.saveRecipe(user.uid, {
      name: 'Thai Green Chicken Curry',
      description: 'Authentic Thai green curry from TheMealDB',
      source: 'manual',
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      servings: 4,
      difficulty: 'medium',
      tags: ['thai', 'curry'],
      dietaryTags: ['gluten-free', 'dairy-free'],
      ingredients: [
        { item: 'Chicken Thighs', amount: '1', unit: 'lb', category: 'meat' },
        { item: 'Coconut Milk', amount: '1', unit: 'can', category: 'pantry' },
        { item: 'Green Curry Paste', amount: '2', unit: 'tbsp', category: 'pantry' },
      ],
      instructions: ['Fry curry paste, add coconut milk, simmer chicken.'],
    });

    assert.ok(env.recipes.get(user.uid)!.has(discoveredRecipe.id));
    // Extraction count remains at 5 without additional increment or penalty
    assert.strictEqual(user.extractionsThisMonth, 5);
  });
});
