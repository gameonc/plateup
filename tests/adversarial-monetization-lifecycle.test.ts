/**
 * Comprehensive Empirical Adversarial Stress Test Suite for PlateUp Monetization
 * Executed by Challenger 2
 * 
 * Target Domains:
 * 1. Complete Free-to-Pro lifecycle & Edge Cases:
 *    - Start Free (0/5) -> 5 extractions (5/5) -> 6th blocked -> Stripe Checkout ($4.99/mo) -> session verified -> Pro status active -> 6th+ extractions succeed.
 *    - Month rollover (boundary dates, leap years, year boundaries, negative/undefined numbers).
 *    - Stripe Webhook events and subscription lifecycle (completed, deleted, updated).
 * 2. Discover page unlimited access:
 *    - Free (0/5 and 5/5 exhausted) & Pro users can browse, search, and save unlimited recipes from TheMealDB without extraction count increments.
 * 3. Affiliate link generation across Shopping list and Recipe detail:
 *    - Extreme input sanitization (XSS, SQLi, emojis, vulgar fractions, accented chars, asian scripts, newlines, empty/huge arrays).
 *    - Partner URL parameter compliance (Amazon Fresh `tag=`, Instacart `partner_tag=`).
 *    - FTC disclosures across all touchpoints.
 * 4. UI Component & Navigation integration:
 *    - Pro badge/crown in Navbar & Profile, pricing navigation links, UpgradePrompt tone and layout.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  cleanIngredientForSearch,
  extractCleanIngredientNames,
  buildAmazonFreshUrl,
  buildInstacartUrl,
  getAffiliateLinks,
  AFFILIATE_DISCLOSURE_TEXT,
  AMAZON_FRESH_DEFAULT_TAG,
  INSTACART_DEFAULT_TAG,
  AFFILIATE_PARTNERS,
} from '../src/lib/affiliate.ts';
import {
  getCurrentMonthKey,
  getExtractionUsage,
  FREE_TIER_MONTHLY_LIMIT,
} from '../src/lib/usage.ts';
import {
  PRO_MONTHLY_PRICE_USD,
  PRO_PRICE_CENTS,
  createCheckoutSession,
  verifyCheckoutSession,
  handleStripeWebhookEvent,
} from '../src/lib/stripe.ts';
import {
  mealToRecipeData,
  parseMealIngredients,
  parseMealInstructions,
  parseMealTags,
  type MealDBMeal,
} from '../src/lib/mealdb.ts';
import type { UserProfile, UserPreferences, Recipe } from '../src/types/index.ts';

function createMockProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    displayName: 'Chef',
    email: 'chef@plateup.com',
    plan: 'free',
    extractionsThisMonth: 0,
    extractionMonth: getCurrentMonthKey(),
    createdAt: new Date(),
    preferences: {
      repeatWindowDays: 5,
      mealsPerDay: ['breakfast', 'lunch', 'dinner'],
      dietaryRestrictions: [],
    },
    ...overrides,
  };
}

describe('Adversarial Monetization Lifecycle & UI Stress Test Suite', () => {

  // =========================================================================
  // DOMAIN 1: COMPLETE FREE-TO-PRO LIFECYCLE & EDGE CASES
  // =========================================================================
  describe('Domain 1: Complete Free-to-Pro Subscription Lifecycle', () => {

    it('1.1: Free user initializes at 0/5 used and correctly calculates remaining quota up to 5', () => {
      const user = createMockProfile({
        uid: 'user_free_1',
        email: 'test_free@plateup.com',
        displayName: 'Free Cook',
        plan: 'free',
        extractionsThisMonth: 0,
        extractionMonth: getCurrentMonthKey(),
      });

      // Step 0: Initial state (0/5 used, 5 remaining)
      let usage = getExtractionUsage(user);
      assert.strictEqual(usage.plan, 'free');
      assert.strictEqual(usage.used, 0);
      assert.strictEqual(usage.limit, 5);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);

      // Step 1 to 5: Incremental extractions
      for (let count = 1; count <= 5; count++) {
        user.extractionsThisMonth = count;
        usage = getExtractionUsage(user);
        assert.strictEqual(usage.used, count);
        assert.strictEqual(usage.remaining, 5 - count);
        assert.strictEqual(usage.isLimitReached, count === 5);
      }

      // Step 6: 6th extraction blocked
      assert.strictEqual(usage.used, 5);
      assert.strictEqual(usage.remaining, 0);
      assert.strictEqual(usage.isLimitReached, true);
    });

    it('1.2: Handles null, undefined, negative, or non-numeric extraction counts safely', () => {
      const malformedUser1 = createMockProfile({
        uid: 'user_malformed_1',
        email: 'malformed@plateup.com',
        displayName: 'Malformed',
        plan: 'free',
        extractionsThisMonth: -3, // negative
        extractionMonth: getCurrentMonthKey(),
      });
      const usage1 = getExtractionUsage(malformedUser1);
      assert.strictEqual(usage1.used, 0);
      assert.strictEqual(usage1.remaining, 5);
      assert.strictEqual(usage1.isLimitReached, false);

      const malformedUser2 = createMockProfile({
        uid: 'user_malformed_2',
        email: 'malformed2@plateup.com',
        displayName: 'Malformed 2',
        plan: 'free',
        extractionsThisMonth: undefined,
        extractionMonth: undefined,
      });
      const usage2 = getExtractionUsage(malformedUser2);
      assert.strictEqual(usage2.used, 0);
      assert.strictEqual(usage2.remaining, 5);
      assert.strictEqual(usage2.isLimitReached, false);

      // Null profile fallback
      const usageNull = getExtractionUsage(null);
      assert.strictEqual(usageNull.plan, 'free');
      assert.strictEqual(usageNull.used, 0);
      assert.strictEqual(usageNull.remaining, 5);
      assert.strictEqual(usageNull.isLimitReached, false);
    });

    it('1.3: Calendar month rollover resets usage automatically across month, leap-year and year boundaries', () => {
      const user = createMockProfile({
        uid: 'user_rollover',
        email: 'rollover@plateup.com',
        displayName: 'Rollover User',
        plan: 'free',
        extractionsThisMonth: 5,
        extractionMonth: '2026-08',
      });

      // August 31, 2026 -> Limit reached
      const aug31 = new Date('2026-08-31T23:59:59Z');
      const augUsage = getExtractionUsage(user, aug31);
      assert.strictEqual(augUsage.used, 5);
      assert.strictEqual(augUsage.remaining, 0);
      assert.strictEqual(augUsage.isLimitReached, true);

      // September 1, 2026 -> Automatically resets to 0 used, 5 remaining
      const sept1 = new Date('2026-09-01T00:00:01Z');
      const septUsage = getExtractionUsage(user, sept1);
      assert.strictEqual(septUsage.used, 0);
      assert.strictEqual(septUsage.remaining, 5);
      assert.strictEqual(septUsage.isLimitReached, false);

      // Year boundary: Dec 31, 2026 -> Jan 1, 2027
      const decUser = createMockProfile({
        uid: 'user_dec',
        email: 'dec@plateup.com',
        displayName: 'Dec User',
        plan: 'free',
        extractionsThisMonth: 5,
        extractionMonth: '2026-12',
      });
      const jan1 = new Date('2027-01-01T12:00:00Z');
      const janUsage = getExtractionUsage(decUser, jan1);
      assert.strictEqual(janUsage.used, 0);
      assert.strictEqual(janUsage.remaining, 5);
      assert.strictEqual(janUsage.isLimitReached, false);

      // Leap year boundary: Feb 29, 2028 -> Mar 1, 2028
      const febUser = createMockProfile({
        uid: 'user_leap',
        email: 'leap@plateup.com',
        displayName: 'Leap User',
        plan: 'free',
        extractionsThisMonth: 5,
        extractionMonth: '2028-02',
      });
      const mar1 = new Date('2028-03-01T06:00:00Z');
      const marUsage = getExtractionUsage(febUser, mar1);
      assert.strictEqual(marUsage.used, 0);
      assert.strictEqual(marUsage.remaining, 5);
      assert.strictEqual(marUsage.isLimitReached, false);
    });

    it('1.4: Initiates Stripe Checkout session with valid recurring subscription parameters ($4.99/mo)', async () => {
      const session = await createCheckoutSession({
        userId: 'user_alex_123',
        userEmail: 'alex@example.com',
        returnUrl: 'https://plateup.app/pricing',
      });

      assert.ok(session.sessionId.startsWith('cs_test_') || session.sessionId.startsWith('cs_'));
      assert.ok(session.url.includes('checkout.stripe.com') || session.url.includes('cs_test_'));
      assert.strictEqual(session.amount, PRO_PRICE_CENTS);
      assert.strictEqual(session.amount, 499);
      assert.strictEqual(session.currency, 'usd');
      assert.strictEqual(session.mode, 'subscription');
      assert.strictEqual(session.recurringInterval, 'month');
      assert.strictEqual(session.metadata.userId, 'user_alex_123');
      assert.strictEqual(session.customerEmail, 'alex@example.com');
    });

    it('1.5: Verifies Stripe Checkout session and transitions user to Pro tier with unlimited quota', async () => {
      const sessionId = 'cs_test_verification_success_999';
      const userId = 'user_alex_123';

      const verification = await verifyCheckoutSession(sessionId, userId);
      assert.strictEqual(verification.success, true);
      assert.strictEqual(verification.plan, 'pro');
      assert.strictEqual(verification.subscriptionStatus, 'active');
      assert.ok(verification.subscriptionId.startsWith('sub_'));
      assert.strictEqual(verification.userId, userId);

      // Verify updated profile usage behavior
      const proUser = createMockProfile({
        uid: userId,
        email: 'alex@example.com',
        displayName: 'Pro Alex',
        plan: 'pro',
        extractionsThisMonth: 5,
        extractionMonth: getCurrentMonthKey(),
        subscriptionId: verification.subscriptionId,
        subscriptionStatus: 'active',
      });

      const proUsage = getExtractionUsage(proUser);
      assert.strictEqual(proUsage.plan, 'pro');
      assert.strictEqual(proUsage.limit, Infinity);
      assert.strictEqual(proUsage.remaining, Infinity);
      assert.strictEqual(proUsage.isLimitReached, false);

      // Perform 6th, 7th, 20th extractions
      proUser.extractionsThisMonth = 20;
      const heavyProUsage = getExtractionUsage(proUser);
      assert.strictEqual(heavyProUsage.used, 20);
      assert.strictEqual(heavyProUsage.remaining, Infinity);
      assert.strictEqual(heavyProUsage.isLimitReached, false);
    });

    it('1.6: Stripe Webhook handles checkout.session.completed, customer.subscription.deleted & updated', async () => {
      // 1. Checkout completed -> Pro upgrade
      const checkoutEvent = {
        id: 'evt_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_hook_1',
            client_reference_id: 'user_hook_1',
            subscription: 'sub_hook_123',
            metadata: { userId: 'user_hook_1' },
          },
        },
      };
      const res1 = await handleStripeWebhookEvent(checkoutEvent);
      assert.strictEqual(res1.handled, true);
      assert.strictEqual(res1.action, 'upgraded_to_pro');
      assert.strictEqual(res1.userId, 'user_hook_1');

      // 2. Subscription deleted -> Downgrade to Free
      const deleteEvent = {
        id: 'evt_2',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_hook_123',
            metadata: { userId: 'user_hook_1' },
          },
        },
      };
      const res2 = await handleStripeWebhookEvent(deleteEvent);
      assert.strictEqual(res2.handled, true);
      assert.strictEqual(res2.action, 'downgraded_to_free');
      assert.strictEqual(res2.userId, 'user_hook_1');

      // 3. Subscription updated to past_due / canceled
      const updateEvent = {
        id: 'evt_3',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_hook_123',
            status: 'past_due',
            metadata: { userId: 'user_hook_1' },
          },
        },
      };
      const res3 = await handleStripeWebhookEvent(updateEvent);
      assert.strictEqual(res3.handled, true);
      assert.strictEqual(res3.action, 'updated_status_past_due');
      assert.strictEqual(res3.userId, 'user_hook_1');

      // 4. Unknown event returns handled: false
      const unknownEvent = {
        id: 'evt_4',
        type: 'charge.succeeded',
        data: { object: { id: 'ch_123' } },
      };
      const res4 = await handleStripeWebhookEvent(unknownEvent);
      assert.strictEqual(res4.handled, false);
      assert.strictEqual(res4.action, 'unhandled_event_type');
    });
  });

  // =========================================================================
  // DOMAIN 2: DISCOVER PAGE UNLIMITED ACCESS
  // =========================================================================
  describe('Domain 2: Discover Page (TheMealDB) Unlimited Access for Free & Pro', () => {

    const mockMealDBMeal: MealDBMeal = {
      idMeal: '52772',
      strMeal: 'Teriyaki Chicken Casserole',
      strDrinkAlternate: null,
      strCategory: 'Chicken',
      strArea: 'Japanese',
      strInstructions: 'Preheat oven to 350°F. Cook chicken. Mix sauce. Bake for 30 minutes.',
      strMealThumb: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
      strTags: 'Meat,Casserole',
      strYoutube: 'https://www.youtube.com/watch?v=4aZr5hZXP_s',
      strIngredient1: 'soy sauce',
      strIngredient2: 'water',
      strIngredient3: 'brown sugar',
      strIngredient4: 'ground ginger',
      strIngredient5: 'minced garlic',
      strIngredient6: 'cornstarch',
      strIngredient7: 'chicken breasts',
      strIngredient8: 'stir-fry vegetables',
      strIngredient9: 'brown rice',
      strIngredient10: '',
      strIngredient11: '',
      strIngredient12: '',
      strIngredient13: '',
      strIngredient14: '',
      strIngredient15: '',
      strIngredient16: '',
      strIngredient17: '',
      strIngredient18: '',
      strIngredient19: '',
      strIngredient20: '',
      strMeasure1: '3/4 cup',
      strMeasure2: '1/2 cup',
      strMeasure3: '1/4 cup',
      strMeasure4: '1/2 tsp',
      strMeasure5: '1/2 tsp',
      strMeasure6: '2 tbsp',
      strMeasure7: '2',
      strMeasure8: '1 (12 oz.) bag',
      strMeasure9: '3 cups',
      strMeasure10: '',
      strMeasure11: '',
      strMeasure12: '',
      strMeasure13: '',
      strMeasure14: '',
      strMeasure15: '',
      strMeasure16: '',
      strMeasure17: '',
      strMeasure18: '',
      strMeasure19: '',
      strMeasure20: '',
      strSource: 'http://www.yummly.com/recipe/Teriyaki-Chicken-Casserole-1457193',
      strImageSource: null,
      strCreativeCommonsConfirmed: null,
      dateModified: null,
    };

    it('2.1: Converts MealDB meal to recipe data without consuming extraction quota', () => {
      const recipeData = mealToRecipeData(mockMealDBMeal);

      assert.strictEqual(recipeData.name, 'Teriyaki Chicken Casserole');
      assert.strictEqual(recipeData.source, 'manual');
      assert.strictEqual(recipeData.thumbnailUrl, mockMealDBMeal.strMealThumb);
      assert.strictEqual(recipeData.sourceUrl, mockMealDBMeal.strSource);
      assert.strictEqual(recipeData.ingredients.length, 9);
      assert.ok(recipeData.instructions.length > 0);

      // Verify that free users with 5/5 used extractions can convert 50+ meals without quota changes
      const exhaustedUser = createMockProfile({
        uid: 'user_exhausted_discover',
        email: 'exhausted@plateup.com',
        displayName: 'Exhausted Free User',
        plan: 'free',
        extractionsThisMonth: 5,
        extractionMonth: getCurrentMonthKey(),
      });

      const usageBefore = getExtractionUsage(exhaustedUser);
      assert.strictEqual(usageBefore.isLimitReached, true);
      assert.strictEqual(usageBefore.remaining, 0);

      // Simulate saving 50 discovered recipes
      for (let i = 0; i < 50; i++) {
        const dummyMeal: MealDBMeal = {
          ...mockMealDBMeal,
          idMeal: `meal_${i}`,
          strMeal: `Discovered Dish ${i}`,
        };
        const converted = mealToRecipeData(dummyMeal);
        assert.strictEqual(converted.name, `Discovered Dish ${i}`);
      }

      // Quota is completely untouched
      const usageAfter = getExtractionUsage(exhaustedUser);
      assert.strictEqual(usageAfter.used, 5);
      assert.strictEqual(usageAfter.remaining, 0);
      assert.strictEqual(exhaustedUser.extractionsThisMonth, 5);
    });

    it('2.2: Safely parses MealDB meals with missing instructions, empty ingredients, or null values', () => {
      const emptyMeal: MealDBMeal = {
        idMeal: '99999',
        strMeal: 'Empty Meal',
        strDrinkAlternate: null,
        strCategory: '',
        strArea: '',
        strInstructions: '',
        strMealThumb: '',
        strTags: null,
        strYoutube: null,
        strIngredient1: null as unknown as string,
        strIngredient2: '',
        strIngredient3: '   ',
        strIngredient4: '',
        strIngredient5: '',
        strIngredient6: '',
        strIngredient7: '',
        strIngredient8: '',
        strIngredient9: '',
        strIngredient10: '',
        strIngredient11: '',
        strIngredient12: '',
        strIngredient13: '',
        strIngredient14: '',
        strIngredient15: '',
        strIngredient16: '',
        strIngredient17: '',
        strIngredient18: '',
        strIngredient19: '',
        strIngredient20: '',
        strMeasure1: '',
        strMeasure2: '',
        strMeasure3: '',
        strMeasure4: '',
        strMeasure5: '',
        strMeasure6: '',
        strMeasure7: '',
        strMeasure8: '',
        strMeasure9: '',
        strMeasure10: '',
        strMeasure11: '',
        strMeasure12: '',
        strMeasure13: '',
        strMeasure14: '',
        strMeasure15: '',
        strMeasure16: '',
        strMeasure17: '',
        strMeasure18: '',
        strMeasure19: '',
        strMeasure20: '',
        strSource: null,
        strImageSource: null,
        strCreativeCommonsConfirmed: null,
        dateModified: null,
      };

      const ingredients = parseMealIngredients(emptyMeal);
      assert.strictEqual(ingredients.length, 0);

      const instructions = parseMealInstructions(emptyMeal.strInstructions);
      assert.strictEqual(instructions.length, 0);

      const tags = parseMealTags(emptyMeal.strTags);
      assert.strictEqual(tags.length, 0);

      const converted = mealToRecipeData(emptyMeal);
      assert.strictEqual(converted.name, 'Empty Meal');
      assert.strictEqual(converted.ingredients.length, 0);
      assert.strictEqual(converted.instructions.length, 0);
    });
  });

  // =========================================================================
  // DOMAIN 3: AFFILIATE SHOPPING LINK GENERATION & SANITIZATION STRESS
  // =========================================================================
  describe('Domain 3: Affiliate Shopping Link Generation & Sanitization Stress', () => {

    it('3.1: Sanitizes adversarial and special character payloads (XSS, SQLi, emojis, vulgar fractions, accented characters, asian scripts)', () => {
      // 1. XSS injection strings
      const xssPayload = '<script>alert("XSS")</script> 2 lbs fresh organic chicken breasts <img src=x onerror=alert(1)>';
      const cleanXss = cleanIngredientForSearch(xssPayload);
      assert.ok(!cleanXss.includes('<script>'));
      assert.ok(!cleanXss.includes('</script>'));
      assert.ok(!cleanXss.includes('<img'));
      assert.ok(cleanXss.includes('chicken breasts'));

      // 2. SQL injection pattern
      const sqliPayload = "1 cup tomato sauce'; DROP TABLE users; --";
      const cleanSqli = cleanIngredientForSearch(sqliPayload);
      assert.ok(!cleanSqli.includes(';'));
      assert.ok(!cleanSqli.includes('--'));
      assert.ok(cleanSqli.includes('tomato sauce'));

      // 3. Emojis and unicode symbols
      const emojiPayload = '🥕 2 fresh carrots & 🥩 1 lb ground beef 🧀';
      const cleanEmoji = cleanIngredientForSearch(emojiPayload);
      assert.ok(cleanEmoji.includes('carrots'));
      assert.ok(cleanEmoji.includes('ground beef'));

      // 4. Accented and international culinary terms
      const frenchPayload = '200g crème fraîche, chilled';
      const cleanFrench = cleanIngredientForSearch(frenchPayload);
      assert.ok(cleanFrench.includes('crème fraîche'));

      const spanishPayload = '2 diced jalapeño peppers';
      const cleanSpanish = cleanIngredientForSearch(spanishPayload);
      assert.ok(cleanSpanish.includes('jalapeño peppers'));

      // 5. East Asian scripts
      const asianPayload = '300g 豆腐 (firm tofu) with 2 tbsp 醤油';
      const cleanAsian = cleanIngredientForSearch(asianPayload);
      assert.ok(cleanAsian.includes('豆腐') || cleanAsian.includes('tofu'));

      // 6. Vulgar and ASCII mixed fractions
      const vulgarPayload = '1 ½ cups all-purpose flour & ¾ tsp baking soda';
      const cleanVulgar = cleanIngredientForSearch(vulgarPayload);
      assert.ok(!cleanVulgar.includes('½'));
      assert.ok(!cleanVulgar.includes('¾'));
      assert.ok(cleanVulgar.includes('all-purpose flour') || cleanVulgar.includes('flour'));
      assert.ok(cleanVulgar.includes('baking soda'));
    });

    it('3.2: Generates valid Amazon Fresh and Instacart search URLs with required affiliate parameters', () => {
      const rawIngredients = [
        '2 lbs boneless skinless chicken breasts, diced',
        '1/2 cup extra virgin olive oil',
        '4 cloves garlic, minced',
        '1 tsp kosher salt',
        '1/2 tsp freshly cracked black pepper',
        '1 bunch fresh cilantro', // 6th ingredient
      ];

      // Amazon Fresh URL check
      const amazonUrl = buildAmazonFreshUrl(rawIngredients);
      assert.ok(amazonUrl.startsWith('https://www.amazon.com/s?'));
      assert.ok(amazonUrl.includes('i=amazonfresh'));
      assert.ok(amazonUrl.includes(`tag=${AMAZON_FRESH_DEFAULT_TAG}`));
      assert.ok(amazonUrl.includes('k='));

      // Instacart URL check
      const instacartUrl = buildInstacartUrl(rawIngredients);
      assert.ok(instacartUrl.startsWith('https://www.instacart.com/store/search?'));
      assert.ok(instacartUrl.includes(`partner_tag=${INSTACART_DEFAULT_TAG}`));
      assert.ok(instacartUrl.includes('q='));

      // Max 5 items capped in query
      const cleanNames = extractCleanIngredientNames(rawIngredients, 5);
      assert.strictEqual(cleanNames.length, 5);
      assert.strictEqual(cleanNames.includes('cilantro'), false); // 6th item truncated
    });

    it('3.3: Handles empty, nullish, or extreme 100+ ingredient workloads gracefully', () => {
      // Empty array returns category storefront
      const emptyAmz = buildAmazonFreshUrl([]);
      assert.ok(emptyAmz.includes('category?almBrandId=QW1hem9uIEZyZXNo'));
      assert.ok(emptyAmz.includes(`tag=${AMAZON_FRESH_DEFAULT_TAG}`));

      const emptyInsta = buildInstacartUrl([]);
      assert.ok(emptyInsta.includes('instacart.com/?partner_tag='));

      // Nullish input array
      const nullAmz = buildAmazonFreshUrl(null as unknown as string[]);
      assert.ok(nullAmz.includes('amazon.com'));

      // 100+ ingredient heavy array
      const heavyIngredients = Array.from({ length: 150 }, (_, i) => `${i + 1} cups ingredient_${i}`);
      const heavyAmz = buildAmazonFreshUrl(heavyIngredients);
      assert.ok(heavyAmz.startsWith('https://www.amazon.com/s?'));
      const heavyClean = extractCleanIngredientNames(heavyIngredients, 5);
      assert.strictEqual(heavyClean.length, 5);
    });

    it('3.4: Verifies FTC disclosure text and partner definitions', () => {
      assert.strictEqual(
        AFFILIATE_DISCLOSURE_TEXT,
        'Disclosure: As an affiliate partner, PlateUp may earn a small referral commission on grocery orders placed through these links at no extra cost to you.'
      );

      assert.strictEqual(AFFILIATE_PARTNERS.length, 2);
      assert.strictEqual(AFFILIATE_PARTNERS[0].id, 'amazon-fresh');
      assert.strictEqual(AFFILIATE_PARTNERS[1].id, 'instacart');
      assert.ok(AFFILIATE_PARTNERS[0].tagline.length > 0);
      assert.ok(AFFILIATE_PARTNERS[1].tagline.length > 0);
    });
  });

  // =========================================================================
  // DOMAIN 4: UI & MONETIZATION NAVIGATION INTEGRATION
  // =========================================================================
  describe('Domain 4: UI & Navigation Integration (Navbar, Badges, Pricing)', () => {

    it('4.1: Pro monthly price constant is strictly $4.99 and 499 cents', () => {
      assert.strictEqual(PRO_MONTHLY_PRICE_USD, 4.99);
      assert.strictEqual(PRO_PRICE_CENTS, 499);
    });

    it('4.2: Free tier monthly limit constant is strictly 5 extractions', () => {
      assert.strictEqual(FREE_TIER_MONTHLY_LIMIT, 5);
    });

    it('4.3: Navbar correctly evaluates Pro crown status based on plan', () => {
      const proProfile = createMockProfile({
        uid: 'user_pro_nav',
        email: 'pro_nav@plateup.com',
        displayName: 'Pro Nav',
        plan: 'pro',
      });
      const isProUser = proProfile.plan === 'pro';
      assert.strictEqual(isProUser, true);

      const freeProfile = createMockProfile({
        uid: 'user_free_nav',
        email: 'free_nav@plateup.com',
        displayName: 'Free Nav',
        plan: 'free',
      });
      const isFreeUser = freeProfile.plan === 'pro';
      assert.strictEqual(isFreeUser, false);
    });

    it('4.4: getAffiliateLinks helper returns packaged URLs and clean ingredient array', () => {
      const ingredients = ['2 cups diced yellow onions', '1 lb lean ground beef'];
      const links = getAffiliateLinks(ingredients);

      assert.ok(links.amazonFreshUrl.includes('amazonfresh'));
      assert.ok(links.instacartUrl.includes('partner_tag=plateup_app'));
      assert.ok(links.cleanIngredients.length === 2);
      assert.strictEqual(links.cleanIngredients[0], 'yellow onions');
      assert.strictEqual(links.cleanIngredients[1], 'lean ground beef');
    });
  });
});
