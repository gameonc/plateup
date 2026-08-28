/**
 * Monetization Test Helpers & In-Memory Simulators
 * Authoritative interface contracts per PROJECT.md & TEST_INFRA.md
 */

import type { UserProfile as BaseUserProfile } from './test-context.ts';

export type SubscriptionPlan = 'free' | 'pro';

export interface MonetizationUserProfile extends BaseUserProfile {
  plan?: SubscriptionPlan;
  extractionsThisMonth?: number;
  extractionMonth?: string; // "YYYY-MM"
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete';
  stripeCustomerId?: string;
}

export const FREE_TIER_MONTHLY_LIMIT = 5;
export const PRO_MONTHLY_PRICE_USD = 4.99;
export const PRO_PRICE_CENTS = 499;

export const AFFILIATE_DISCLOSURE_TEXT = 
  'Disclosure: As an affiliate partner, PlateUp may earn a small referral commission on grocery orders placed through these links at no extra cost to you.';

export const AMAZON_FRESH_DEFAULT_TAG = 'plateup-20';
export const INSTACART_DEFAULT_TAG = 'plateup_app';

/**
 * Common culinary measurement and preparation noise terms to sanitize
 */
const PREPARATION_WORDS = [
  'diced', 'chopped', 'minced', 'sliced', 'julienned', 'grated', 'shredded', 'crushed',
  'peeled', 'seeded', 'melted', 'softened', 'toasted', 'roasted', 'cubed', 'cubes', 'halved',
  'quartered', 'sifted', 'whisked', 'beaten', 'drained', 'rinsed', 'packed', 'finely',
  'coarsely', 'roughly', 'thinly', 'fresh', 'freshly', 'dried', 'cooked',
  'uncooked', 'divided', 'optional', 'to taste', 'plus more', 'room temperature',
  'warm', 'cold', 'hot', 'chilled', 'frozen', 'canned', 'skinless', 'boneless',
  'skin removed', 'trimmed', 'soft', 'hard', 'large', 'medium', 'small', 'extra large',
  'seasoned', 'lightly', 'coarse', 'cracked', 'sustainably', 'wild-caught', 'serving',
  'portions', 'pieces', 'inch'
];

const UNIT_WORDS = [
  'cups?', 'tablespoons?', 'tbsp', 'tbs', 'teaspoons?', 'tsp', 'ounces?', 'oz',
  'fluid ounces?', 'fl oz', 'pounds?', 'lbs?', 'lb', 'grams?', 'g', 'kilograms?',
  'kg', 'milliliters?', 'ml', 'liters?', 'l', 'quarts?', 'qt', 'pints?', 'pt',
  'gallons?', 'gal', 'pinches?', 'pinch', 'dashes?', 'dash', 'cloves?', 'heads?',
  'bunches?', 'bunch', 'sprigs?', 'cans?', 'bottles?', 'packages?', 'pkg', 'slices?',
  'pieces?', 'stalks?', 'sticks?'
];

const STOP_WORDS = [
  'and', 'or', 'with', 'of', 'for', 'to', 'into', 'at', 'plus', 'extra', 'about', 'as'
];

/**
 * Sanitizes ingredient strings into clean search keywords for grocery partner stores.
 */
export function cleanIngredientForSearch(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let cleaned = raw.trim();

  // 1. Remove parenthetical instructions e.g. "(about 2 cups)", "(optional)"
  cleaned = cleaned.replace(/\([^)]*\)/g, ' ');

  // 2. Remove numeric fractions (1/2, 3/4, 1 1/2) and decimals/integers with attached units (e.g. 100g, 200ml)
  cleaned = cleaned.replace(/\b\d+\s+\d+\/\d+\b/g, ' ');
  cleaned = cleaned.replace(/\b\d+\/\d+\b/g, ' ');
  cleaned = cleaned.replace(/[\u00BC-\u00BE\u2150-\u215E]/g, ' '); // Vulgar unicode fractions
  cleaned = cleaned.replace(/\b\d+(\.\d+)?[a-zA-Z]*\b/g, ' ');

  // 3. Remove standalone unit words
  const unitRegex = new RegExp(`\\b(${UNIT_WORDS.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(unitRegex, ' ');

  // 4. Remove preparation and descriptor words
  const prepRegex = new RegExp(`\\b(${PREPARATION_WORDS.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(prepRegex, ' ');

  // 5. Remove connector and stop words
  const stopRegex = new RegExp(`\\b(${STOP_WORDS.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(stopRegex, ' ');

  // 6. Remove punctuation, extra symbols, and redundant commas
  cleaned = cleaned.replace(/[,\-_/*+~;:!@#$%^&()=[\]{}|\\<>?]/g, ' ');

  // 7. Normalize multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Builds an affiliate URL for Amazon Fresh grocery search
 */
export function buildAmazonFreshUrl(
  ingredients: ({ item?: string; name?: string } | string | null | undefined)[],
  affiliateTag: string = AMAZON_FRESH_DEFAULT_TAG
): string {
  const items: string[] = [];

  for (const entry of ingredients || []) {
    const rawName = typeof entry === 'string' ? entry : (entry?.item || entry?.name || '');
    const clean = cleanIngredientForSearch(rawName);
    if (clean) {
      items.push(clean);
    }
  }

  const tag = encodeURIComponent(affiliateTag || AMAZON_FRESH_DEFAULT_TAG);

  if (items.length === 0) {
    return `https://www.amazon.com/alm/category?almBrandId=QW1hem9uIEZyZXNo&tag=${tag}`;
  }

  // Combine unique cleaned ingredients into a targeted search query
  const uniqueItems = Array.from(new Set(items));
  const query = encodeURIComponent(uniqueItems.slice(0, 5).join(' '));
  return `https://www.amazon.com/s?k=${query}&i=amazonfresh&tag=${tag}`;
}

/**
 * Builds an affiliate URL for Instacart grocery search
 */
export function buildInstacartUrl(
  ingredients: ({ item?: string; name?: string } | string | null | undefined)[],
  partnerTag: string = INSTACART_DEFAULT_TAG
): string {
  const items: string[] = [];

  for (const entry of ingredients || []) {
    const rawName = typeof entry === 'string' ? entry : (entry?.item || entry?.name || '');
    const clean = cleanIngredientForSearch(rawName);
    if (clean) {
      items.push(clean);
    }
  }

  const tag = encodeURIComponent(partnerTag || INSTACART_DEFAULT_TAG);

  if (items.length === 0) {
    return `https://www.instacart.com/?partner_tag=${tag}`;
  }

  const uniqueItems = Array.from(new Set(items));
  const query = encodeURIComponent(uniqueItems.slice(0, 5).join(' '));
  return `https://www.instacart.com/store/search?q=${query}&partner_tag=${tag}`;
}

/**
 * Generates ISO calendar month key formatted as "YYYY-MM"
 */
export function getCurrentMonthKey(date: Date = new Date()): string {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export interface ExtractionUsageResult {
  plan: SubscriptionPlan;
  used: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  extractionMonth: string;
}

/**
 * Calculates extraction usage and remaining quota for a user profile
 */
export function getExtractionUsage(
  profile: MonetizationUserProfile | null | undefined,
  now: Date = new Date()
): ExtractionUsageResult {
  const currentMonth = getCurrentMonthKey(now);

  if (!profile) {
    return {
      plan: 'free',
      used: 0,
      limit: FREE_TIER_MONTHLY_LIMIT,
      remaining: FREE_TIER_MONTHLY_LIMIT,
      isLimitReached: false,
      extractionMonth: currentMonth,
    };
  }

  const plan: SubscriptionPlan = profile.plan === 'pro' ? 'pro' : 'free';
  const recordedMonth = profile.extractionMonth || currentMonth;

  // If new month rollover, active month count resets to 0
  const used = recordedMonth === currentMonth ? (profile.extractionsThisMonth || 0) : 0;

  if (plan === 'pro') {
    return {
      plan: 'pro',
      used,
      limit: Infinity,
      remaining: Infinity,
      isLimitReached: false,
      extractionMonth: currentMonth,
    };
  }

  const limit = FREE_TIER_MONTHLY_LIMIT;
  const remaining = Math.max(0, limit - used);
  const isLimitReached = used >= limit;

  return {
    plan: 'free',
    used,
    limit,
    remaining,
    isLimitReached,
    extractionMonth: currentMonth,
  };
}

/**
 * Simulates recording an extraction event and atomically incrementing the usage counter
 */
export function recordExtractionUsage(
  profile: MonetizationUserProfile,
  now: Date = new Date()
): { profile: MonetizationUserProfile; remaining: number; plan: SubscriptionPlan } {
  const currentMonth = getCurrentMonthKey(now);
  const usage = getExtractionUsage(profile, now);

  if (usage.plan === 'free' && usage.isLimitReached) {
    throw new Error('Monthly extraction limit reached for Free plan. Upgrade to Pro for unlimited extractions.');
  }

  const newUsed = usage.used + 1;
  profile.extractionsThisMonth = newUsed;
  profile.extractionMonth = currentMonth;

  const updatedUsage = getExtractionUsage(profile, now);

  return {
    profile,
    remaining: updatedUsage.remaining,
    plan: profile.plan === 'pro' ? 'pro' : 'free',
  };
}

/**
 * Stripe Checkout & Webhook Mock Simulation Helper
 */
export interface StripeCheckoutRequest {
  userId: string;
  userEmail?: string;
  returnUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface StripeCheckoutResponse {
  sessionId: string;
  url: string;
  amount: number;
  currency: string;
  mode: 'subscription';
  recurringInterval: 'month';
  metadata: { userId: string };
  customerEmail?: string;
}

export function createStripeCheckoutSession(req: StripeCheckoutRequest): StripeCheckoutResponse {
  if (!req.userId) {
    throw new Error('Missing required field: userId');
  }

  const sessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
  const baseUrl = req.returnUrl || 'https://plateup.app';

  return {
    sessionId,
    url: `https://checkout.stripe.com/c/pay/${sessionId}`,
    amount: PRO_PRICE_CENTS,
    currency: 'usd',
    mode: 'subscription',
    recurringInterval: 'month',
    metadata: { userId: req.userId },
    customerEmail: req.userEmail,
  };
}

export function verifyStripeSession(
  sessionId: string,
  userId: string,
  userProfile: MonetizationUserProfile
): { success: boolean; plan: 'pro'; subscriptionId: string; subscriptionStatus: 'active' } {
  if (!sessionId || !sessionId.startsWith('cs_test_')) {
    throw new Error('Invalid or expired Stripe session ID');
  }
  if (!userId) {
    throw new Error('User ID required for verification');
  }

  const subscriptionId = `sub_${Math.random().toString(36).substring(2, 12)}`;
  userProfile.plan = 'pro';
  userProfile.subscriptionId = subscriptionId;
  userProfile.subscriptionStatus = 'active';

  return {
    success: true,
    plan: 'pro',
    subscriptionId,
    subscriptionStatus: 'active',
  };
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      customer?: string;
      client_reference_id?: string;
      metadata?: { userId?: string };
      subscription?: string;
      status?: string;
      customer_email?: string;
    };
  };
}

export function handleStripeWebhook(
  event: StripeWebhookEvent,
  usersMap: Map<string, MonetizationUserProfile>
): { handled: boolean; action: string; userId?: string } {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId || session.client_reference_id;
      if (!userId) return { handled: false, action: 'missing_user_id' };

      const user = usersMap.get(userId);
      if (user) {
        user.plan = 'pro';
        user.subscriptionId = (session.subscription as string) || `sub_${session.id.substring(8)}`;
        user.subscriptionStatus = 'active';
        return { handled: true, action: 'upgraded_to_pro', userId };
      }
      return { handled: false, action: 'user_not_found', userId };
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;
      // If metadata userId is absent, lookup user by subscriptionId
      let targetUser: MonetizationUserProfile | undefined;
      if (userId) {
        targetUser = usersMap.get(userId);
      } else {
        for (const u of usersMap.values()) {
          if (u.subscriptionId === sub.id) {
            targetUser = u;
            break;
          }
        }
      }

      if (targetUser) {
        targetUser.plan = 'free';
        targetUser.subscriptionStatus = 'canceled';
        return { handled: true, action: 'downgraded_to_free', userId: targetUser.uid };
      }
      return { handled: false, action: 'subscription_user_not_found' };
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const status = sub.status;
      for (const u of usersMap.values()) {
        if (u.subscriptionId === sub.id) {
          u.subscriptionStatus = status as MonetizationUserProfile['subscriptionStatus'];
          if (status === 'active' || status === 'trialing') {
            u.plan = 'pro';
          } else if (status === 'canceled' || status === 'unpaid') {
            u.plan = 'free';
          }
          return { handled: true, action: `updated_status_${status}`, userId: u.uid };
        }
      }
      return { handled: false, action: 'subscription_not_tracked' };
    }

    default:
      return { handled: false, action: 'unhandled_event_type' };
  }
}
