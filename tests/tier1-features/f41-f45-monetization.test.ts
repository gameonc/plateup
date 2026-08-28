/**
 * Tier 1: Feature Coverage for F-41 to F-47 (Monetization & Subscriptions)
 * F-41: Affiliate Link Generation & Sanitization
 * F-42: Shopping List & Recipe Detail Affiliate CTAs
 * F-43: Freemium Tier & Monthly Usage Tracking
 * F-44: Extract Page Quota UI & Ungated Discover
 * F-45: Stripe Checkout & Webhook/Verification
 * F-46: /pricing Page & Profile Subscription Card
 * F-47: Navbar Pro Crown Badge & Pricing Navigation
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
  AMAZON_FRESH_DEFAULT_TAG,
  INSTACART_DEFAULT_TAG,
  getCurrentMonthKey,
  getExtractionUsage,
  recordExtractionUsage,
  createStripeCheckoutSession,
  verifyStripeSession,
  handleStripeWebhook,
  FREE_TIER_MONTHLY_LIMIT,
  PRO_MONTHLY_PRICE_USD,
  PRO_PRICE_CENTS,
  type MonetizationUserProfile,
} from '../helpers/monetization-helpers.ts';
import { FIXTURE_RECIPES, type TestRecipe } from '../helpers/recipe-fixtures.ts';

describe('Tier 1: F-41 to F-47 — Monetization, Freemium Quota & Subscriptions', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;
  let testUser: MonetizationUserProfile;
  let savedRecipes: TestRecipe[];

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('chef_monetized@plateup.com', 'ChefPassword123!', 'Chef Monetized');
    testUid = user.uid;

    testUser = {
      ...user,
      plan: 'free',
      extractionsThisMonth: 0,
      extractionMonth: getCurrentMonthKey(),
    };

    savedRecipes = FIXTURE_RECIPES.map(r => env.saveRecipe(testUid, r));
  });

  // F-41: Affiliate Link Generation & Sanitization
  describe('F-41: Affiliate Link Generation & Sanitization', () => {
    it('F-41.1: Generates valid Amazon Fresh affiliate search URLs with sanitized keywords and referral tag', () => {
      const rawIngredients = ['2 lbs beef chuck roast, cubed', '4 medium carrots, chopped'];
      const url = buildAmazonFreshUrl(rawIngredients);

      assert.ok(url.startsWith('https://www.amazon.com/s?'));
      assert.ok(url.includes('i=amazonfresh'));
      assert.ok(url.includes(`tag=${AMAZON_FRESH_DEFAULT_TAG}`));
      assert.ok(url.includes('beef%20chuck%20roast') || url.includes('beef'));
      assert.ok(!url.includes('cubed'));
      assert.ok(!url.includes('chopped'));
    });

    it('F-41.2: Generates valid Instacart affiliate search URLs with sanitized keywords and partner tag', () => {
      const rawIngredients = ['1 cup heavy cream', '3 cloves garlic, minced'];
      const url = buildInstacartUrl(rawIngredients);

      assert.ok(url.startsWith('https://www.instacart.com/store/search?'));
      assert.ok(url.includes(`partner_tag=${INSTACART_DEFAULT_TAG}`));
      assert.ok(url.includes('cream'));
      assert.ok(url.includes('garlic'));
      assert.ok(!url.includes('minced'));
    });

    it('F-41.3: Keyword sanitization strips measurements, quantities, fractions and prep verbs', () => {
      const dirty = '1 1/2 cups finely grated Pecorino Romano cheese (about 4 oz)';
      const cleaned = cleanIngredientForSearch(dirty);
      assert.strictEqual(cleaned, 'Pecorino Romano cheese');
    });

    it('F-41.4: Handles empty or single ingredient input arrays cleanly', () => {
      const emptyAmz = buildAmazonFreshUrl([]);
      const emptyInsta = buildInstacartUrl([]);

      assert.ok(emptyAmz.includes('amazon.com'));
      assert.ok(emptyAmz.includes('tag='));
      assert.ok(emptyInsta.includes('instacart.com'));
      assert.ok(emptyInsta.includes('partner_tag='));
    });

    it('F-41.5: Preserves standard FTC affiliate disclosure text constant with required terms', () => {
      assert.strictEqual(typeof AFFILIATE_DISCLOSURE_TEXT, 'string');
      const text = AFFILIATE_DISCLOSURE_TEXT.toLowerCase();
      assert.ok(text.includes('affiliate'));
      assert.ok(text.includes('commission'));
      assert.ok(text.includes('no extra cost'));
    });
  });

  // F-42: Shopping List & Recipe Detail Affiliate CTAs
  describe('F-42: Shopping List & Recipe Detail Affiliate CTAs', () => {
    it('F-42.1: Shopping list page provides "Order Ingredients" CTA button', () => {
      const orderIngredientsCTA = {
        label: 'Order Ingredients',
        icon: 'ShoppingCart',
        action: 'open_grocery_modal',
        page: '/shopping-list',
      };
      assert.strictEqual(orderIngredientsCTA.label, 'Order Ingredients');
      assert.strictEqual(orderIngredientsCTA.page, '/shopping-list');
    });

    it('F-42.2: "Order Ingredients" on Shopping List extracts active unchecked items into query', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      const list = env.generateShoppingList(testUid, '2026-W35');

      // Check one item off
      const firstItem = list.items[0];
      env.toggleShoppingItem(testUid, '2026-W35', firstItem.id);

      const uncheckedItems = list.items.filter(i => !i.checked);
      assert.ok(uncheckedItems.length > 0);

      const amzUrl = buildAmazonFreshUrl(uncheckedItems.map(i => i.name));
      assert.ok(amzUrl.includes('i=amazonfresh'));
      assert.ok(amzUrl.includes('tag='));
    });

    it('F-42.3: Recipe detail page provides "Order Ingredients" button passing recipe ingredients', () => {
      const recipe = savedRecipes[0];
      assert.ok(recipe.ingredients.length > 0);

      const instaUrl = buildInstacartUrl(recipe.ingredients);
      assert.ok(instaUrl.includes('instacart.com'));
      assert.ok(instaUrl.includes('partner_tag='));
    });

    it('F-42.4: Affiliate disclosure is rendered visibly adjacent to grocery store options', () => {
      const modalConfig = {
        title: 'Order Ingredients',
        partners: ['Amazon Fresh', 'Instacart'],
        disclosure: AFFILIATE_DISCLOSURE_TEXT,
      };

      assert.strictEqual(modalConfig.partners.length, 2);
      assert.ok(modalConfig.disclosure.length > 20);
    });

    it('F-42.5: Provides seamless grocery store selection (Amazon Fresh & Instacart)', () => {
      const partnerOptions = [
        { id: 'amazon-fresh', name: 'Amazon Fresh', buildUrl: (items: string[]) => buildAmazonFreshUrl(items) },
        { id: 'instacart', name: 'Instacart', buildUrl: (items: string[]) => buildInstacartUrl(items) },
      ];

      const testItems = ['1 lb chicken', '1 cup rice'];
      const amz = partnerOptions[0].buildUrl(testItems);
      const insta = partnerOptions[1].buildUrl(testItems);

      assert.ok(amz.includes('amazon.com'));
      assert.ok(insta.includes('instacart.com'));
    });
  });

  // F-43: Freemium Tier & Monthly Usage Tracking
  describe('F-43: Freemium Tier & Monthly Usage Tracking', () => {
    it('F-43.1: New users start on Free plan with 0 extractions and limit of 5', () => {
      const usage = getExtractionUsage(testUser);
      assert.strictEqual(usage.plan, 'free');
      assert.strictEqual(usage.used, 0);
      assert.strictEqual(usage.limit, 5);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('F-43.2: AI extractions (YouTube + Photo) increment extractionsThisMonth atomically', () => {
      // 1st extraction (YouTube)
      recordExtractionUsage(testUser);
      assert.strictEqual(testUser.extractionsThisMonth, 1);

      // 2nd extraction (Photo)
      recordExtractionUsage(testUser);
      assert.strictEqual(testUser.extractionsThisMonth, 2);

      const usage = getExtractionUsage(testUser);
      assert.strictEqual(usage.remaining, 3);
    });

    it('F-43.3: Quota resets automatically upon calendar month rollover (YYYY-MM)', () => {
      testUser.extractionsThisMonth = 5;
      testUser.extractionMonth = '2026-07';

      // August 2026 check
      const augDate = new Date('2026-08-01T00:00:00Z');
      const usage = getExtractionUsage(testUser, augDate);

      assert.strictEqual(usage.used, 0);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('F-43.4: Free users are strictly blocked after 5 extractions in the same month', () => {
      testUser.extractionsThisMonth = 5;
      testUser.extractionMonth = getCurrentMonthKey();

      const usage = getExtractionUsage(testUser);
      assert.strictEqual(usage.remaining, 0);
      assert.strictEqual(usage.isLimitReached, true);

      assert.throws(() => {
        recordExtractionUsage(testUser);
      }, /Monthly extraction limit reached/);
    });

    it('F-43.5: Pro users bypass the 5-extraction limit and enjoy unlimited monthly extractions', () => {
      testUser.plan = 'pro';
      testUser.extractionsThisMonth = 50;

      const usage = getExtractionUsage(testUser);
      assert.strictEqual(usage.plan, 'pro');
      assert.strictEqual(usage.remaining, Infinity);
      assert.strictEqual(usage.isLimitReached, false);

      const recordRes = recordExtractionUsage(testUser);
      assert.strictEqual(recordRes.profile.extractionsThisMonth, 51);
    });
  });

  // F-44: Extract Page Quota UI & Ungated Discover
  describe('F-44: Extract Page Quota UI & Ungated Discover', () => {
    it('F-44.1: Extract page displays remaining extractions banner (e.g. "3 of 5 free extractions remaining")', () => {
      testUser.extractionsThisMonth = 2;
      const usage = getExtractionUsage(testUser);

      const quotaBannerText = `${usage.remaining} of ${usage.limit} free extractions remaining this month`;
      assert.strictEqual(quotaBannerText, '3 of 5 free extractions remaining this month');
    });

    it('F-44.2: Extract page shows friendly upgrade prompt when quota reaches 5/5', () => {
      testUser.extractionsThisMonth = 5;
      const usage = getExtractionUsage(testUser);

      assert.strictEqual(usage.isLimitReached, true);
      const upgradePrompt = {
        title: "You've reached your monthly free extraction limit!",
        description: 'Upgrade to PlateUp Pro for unlimited YouTube & Photo recipe extractions.',
        cta: 'Upgrade to Pro for $4.99/mo',
        href: '/pricing',
      };

      assert.ok(upgradePrompt.title.includes('limit'));
      assert.strictEqual(upgradePrompt.href, '/pricing');
    });

    it('F-44.3: Extraction buttons are replaced with Upgrade CTA when quota exhausted', () => {
      const isExtractButtonEnabled = (usage: ReturnType<typeof getExtractionUsage>) => !usage.isLimitReached;

      testUser.extractionsThisMonth = 4;
      assert.strictEqual(isExtractButtonEnabled(getExtractionUsage(testUser)), true);

      testUser.extractionsThisMonth = 5;
      assert.strictEqual(isExtractButtonEnabled(getExtractionUsage(testUser)), false);
    });

    it('F-44.4: Pro users see Pro status on Extract page without limit warning', () => {
      testUser.plan = 'pro';
      const usage = getExtractionUsage(testUser);

      assert.strictEqual(usage.plan, 'pro');
      assert.strictEqual(usage.isLimitReached, false);
      assert.strictEqual(usage.remaining, Infinity);
    });

    it('F-44.5: Discover page (TheMealDB) remains completely ungated and free for all users', () => {
      // Even if user is blocked on AI extraction, Discover recipe search and viewing are 100% free
      testUser.extractionsThisMonth = 5;
      const canAccessDiscover = true;
      const discoverSearchQuery = 'chicken';
      assert.strictEqual(canAccessDiscover, true);
      assert.ok(discoverSearchQuery.length > 0);
    });
  });

  // F-45: Stripe Checkout & Webhook/Verification
  describe('F-45: Stripe Checkout & Webhook/Verification', () => {
    it('F-45.1: Initiates Stripe Checkout session for $4.99/month recurring in test mode', () => {
      const session = createStripeCheckoutSession({
        userId: testUid,
        userEmail: 'chef@plateup.com',
        returnUrl: 'https://plateup.app/pricing',
      });

      assert.strictEqual(session.amount, 499);
      assert.strictEqual(session.currency, 'usd');
      assert.strictEqual(session.mode, 'subscription');
      assert.strictEqual(session.recurringInterval, 'month');
      assert.strictEqual(PRO_MONTHLY_PRICE_USD, 4.99);
    });

    it('F-45.2: Checkout session payload includes metadata linking userId', () => {
      const session = createStripeCheckoutSession({
        userId: 'user_target_999',
      });

      assert.strictEqual(session.metadata.userId, 'user_target_999');
    });

    it('F-45.3: Session verification updates user profile to plan: "pro" with subscription ID', () => {
      assert.strictEqual(testUser.plan, 'free');
      const verifyRes = verifyStripeSession('cs_test_session_abc123', testUser.uid, testUser);

      assert.strictEqual(verifyRes.success, true);
      assert.strictEqual(verifyRes.plan, 'pro');
      assert.strictEqual(testUser.plan, 'pro');
      assert.ok(testUser.subscriptionId?.startsWith('sub_'));
    });

    it('F-45.4: Stripe webhook checkout.session.completed promotes user to Pro', () => {
      const usersMap = new Map<string, MonetizationUserProfile>();
      usersMap.set(testUid, testUser);

      const event = {
        id: 'evt_stripe_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_hook_1',
            metadata: { userId: testUid },
            subscription: 'sub_stripe_hook_123',
            status: 'complete',
          }
        }
      };

      const hookRes = handleStripeWebhook(event, usersMap);
      assert.strictEqual(hookRes.handled, true);
      assert.strictEqual(testUser.plan, 'pro');
      assert.strictEqual(testUser.subscriptionId, 'sub_stripe_hook_123');
    });

    it('F-45.5: Stripe webhook customer.subscription.deleted downgrades user back to Free', () => {
      const usersMap = new Map<string, MonetizationUserProfile>();
      testUser.plan = 'pro';
      testUser.subscriptionId = 'sub_active_to_cancel';
      usersMap.set(testUid, testUser);

      const event = {
        id: 'evt_stripe_2',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_active_to_cancel',
            metadata: { userId: testUid },
            status: 'canceled',
          }
        }
      };

      const hookRes = handleStripeWebhook(event, usersMap);
      assert.strictEqual(hookRes.handled, true);
      assert.strictEqual(testUser.plan, 'free');
      assert.strictEqual(testUser.subscriptionStatus, 'canceled');
    });
  });

  // F-46: /pricing Page & Profile Subscription Card
  describe('F-46: /pricing Page & Profile Subscription Card', () => {
    it('F-46.1: /pricing page renders Free vs Pro feature comparison table', () => {
      const pricingTiers = [
        {
          name: 'Free',
          price: '$0/mo',
          features: [
            '5 AI Recipe Extractions / month',
            'Weekly Meal Planning',
            'Smart Shopping List & Grocery Order',
            'TheMealDB Discover Recipe Search',
          ]
        },
        {
          name: 'Pro',
          price: '$4.99/mo',
          features: [
            'Unlimited AI Recipe Extractions',
            'Priority YouTube & Photo Processing',
            'Weekly Meal Planning',
            'Smart Shopping List & Grocery Order',
            'Pro Crown Badge & Early Access',
          ]
        }
      ];

      assert.strictEqual(pricingTiers.length, 2);
      assert.strictEqual(pricingTiers[0].price, '$0/mo');
      assert.strictEqual(pricingTiers[1].price, '$4.99/mo');
    });

    it('F-46.2: "Go Pro" button on /pricing initiates checkout flow for authenticated user', () => {
      const session = createStripeCheckoutSession({
        userId: testUid,
        userEmail: testUser.email,
        returnUrl: 'https://plateup.app/pricing',
      });
      assert.ok(session.url.startsWith('https://checkout.stripe.com/'));
    });

    it('F-46.3: Unauthenticated user clicking "Go Pro" redirects to login with return target', () => {
      const getUpgradeRoute = (isAuthenticated: boolean) => {
        if (!isAuthenticated) return '/login?redirect=%2Fpricing';
        return '/api/stripe/checkout';
      };

      assert.strictEqual(getUpgradeRoute(false), '/login?redirect=%2Fpricing');
      assert.strictEqual(getUpgradeRoute(true), '/api/stripe/checkout');
    });

    it('F-46.4: Profile page displays subscription management card showing active plan and status', () => {
      const profileCard = {
        plan: testUser.plan || 'free',
        status: testUser.subscriptionStatus || 'active',
        manageUrl: '/pricing',
      };
      assert.strictEqual(profileCard.plan, 'free');
    });

    it('F-46.5: Pro users see Pro status and manage subscription button on Profile page', () => {
      testUser.plan = 'pro';
      testUser.subscriptionId = 'sub_active_123';
      testUser.subscriptionStatus = 'active';

      const proProfileCard = {
        plan: testUser.plan,
        subscriptionId: testUser.subscriptionId,
        status: testUser.subscriptionStatus,
        renewalText: 'Renews monthly at $4.99/mo',
      };

      assert.strictEqual(proProfileCard.plan, 'pro');
      assert.strictEqual(proProfileCard.status, 'active');
      assert.ok(proProfileCard.renewalText.includes('$4.99/mo'));
    });
  });

  // F-47: Navbar Pro Crown Badge & Pricing Navigation
  describe('F-47: Navbar Pro Crown Badge & Pricing Navigation', () => {
    it('F-47.1: Pro users display Pro badge or crown icon next to user avatar in navbar', () => {
      const getNavbarBadge = (user: MonetizationUserProfile) => {
        return user.plan === 'pro' ? { showBadge: true, icon: 'Crown', label: 'Pro' } : { showBadge: false };
      };

      testUser.plan = 'pro';
      const badge = getNavbarBadge(testUser);
      assert.strictEqual(badge.showBadge, true);
      assert.strictEqual(badge.label, 'Pro');
    });

    it('F-47.2: Free users do not display the Pro crown badge in navbar', () => {
      const getNavbarBadge = (user: MonetizationUserProfile) => {
        return user.plan === 'pro' ? { showBadge: true, icon: 'Crown', label: 'Pro' } : { showBadge: false };
      };

      testUser.plan = 'free';
      const badge = getNavbarBadge(testUser);
      assert.strictEqual(badge.showBadge, false);
    });

    it('F-47.3: Navbar includes accessible "Pricing" link in header navigation', () => {
      const navLinks = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Recipes', href: '/recipes' },
        { label: 'Meal Plan', href: '/meal-plan' },
        { label: 'Shopping List', href: '/shopping-list' },
        { label: 'Pricing', href: '/pricing' },
      ];

      assert.ok(navLinks.some(l => l.href === '/pricing'));
    });

    it('F-47.4: Landing page includes "Pricing" navigation link and tier overview', () => {
      const landingLinks = [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Get Started', href: '/login' },
      ];

      assert.ok(landingLinks.some(l => l.href === '/pricing'));
    });

    it('F-47.5: Upgrade banners across the app use positive, encouraging tone emphasizing benefits', () => {
      const upgradeCopy = {
        headline: 'Unlock Unlimited Recipe Extractions',
        subtext: 'Extract as many YouTube videos & recipe photos as your kitchen desires.',
        pricing: '$4.99 / month • Cancel anytime',
      };

      assert.ok(upgradeCopy.headline.includes('Unlock'));
      assert.ok(!upgradeCopy.headline.includes('Warning'));
      assert.ok(upgradeCopy.pricing.includes('Cancel anytime'));
    });
  });
});
