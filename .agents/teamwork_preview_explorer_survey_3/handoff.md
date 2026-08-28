# Architecture & Survey Report: Monetization, Stripe Integration, Affiliate Links & Test Infrastructure

**Agent**: `teamwork_preview_explorer_survey_3`  
**Date**: 2026-08-28  
**Scope**: Build & Test Setup, Stripe Monetization Architecture, Environment Configuration, Affiliate Link Engine, Freemium Usage Gating, and Quality Assurance Test Plan.

---

## 1. Observation

### 1.1 Build and Test Setup
- **`package.json`** (`/Users/CLD/.gemini/antigravity/scratch/plateup/package.json`):
  - **Scripts**:
    - `"dev"`: `"next dev"`
    - `"build"`: `"next build --webpack"`
    - `"start"`: `"next start"`
    - `"lint"`: `"eslint"`
    - `"test"`: `"node --experimental-strip-types tests/runner.ts"`
  - **Core Dependencies**:
    - `next`: `16.3.3`
    - `react`: `19.2.8`, `react-dom`: `19.2.8`
    - `firebase`: `^12.18.0`
    - `@google/generative-ai`: `^0.24.1`
    - `lucide-react`: `^1.34.0`
    - `date-fns`: `^4.4.0`
    - `shadcn`: `^4.19.0`, `@base-ui/react`: `^1.7.0`
    - `clsx`: `^2.1.1`, `tailwind-merge`: `^3.6.0`, `class-variance-authority`: `^0.7.1`, `tw-animate-css`: `^1.4.0`
    - `youtube-transcript`: `^1.3.1`, `youtubei.js`: `^18.0.0`
  - **Dev Dependencies**:
    - `typescript`: `^5`, `@types/node`: `^20`, `@types/react`: `^19`, `@types/react-dom`: `^19`
    - `tailwindcss`: `^4`, `@tailwindcss/postcss`: `^4`
    - `eslint`: `^9`, `eslint-config-next`: `16.3.3`
  - **Stripe Status**: Neither `stripe` nor `@stripe/stripe-js` is currently installed.
- **`tsconfig.json`** (`/Users/CLD/.gemini/antigravity/scratch/plateup/tsconfig.json`):
  - Target: `ES2017`, Module: `esnext`, Module Resolution: `bundler`, Path alias: `@/*` -> `./src/*`.
  - Typecheck execution: `npx tsc --noEmit` exits with status `0` and zero errors.
- **`next.config.ts`** (`/Users/CLD/.gemini/antigravity/scratch/plateup/next.config.ts`):
  - Minimal Next.js config export.
  - Build execution: `npm run build` (`next build --webpack`) compiles all 13 routes cleanly with status `0`.
- **Existing Test Framework**:
  - Test Runner: Built-in Node.js runner (`node:test`) + `spec` reporter in `tests/runner.ts` (`node --experimental-strip-types tests/runner.ts`).
  - Execution result: `npm test` executes **22 test suites**, running **766 total tests** across Tiers 1–5 in ~0.87 seconds with **0 failures**.

### 1.2 Environment Variables & Firebase
- **`.env.local`** (`/Users/CLD/.gemini/antigravity/scratch/plateup/.env.local`):
  - Currently contains Firebase keys: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
  - `src/lib/ai.ts` line 6 uses `process.env.NEXT_PUBLIC_FIREBASE_API_KEY` to initialize `@google/generative-ai` with model `gemini-3.6-flash`.
  - Missing Monetization Keys: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG`, `NEXT_PUBLIC_INSTACART_AFFILIATE_TAG`.

### 1.3 Firestore Security Rules & User Schema
- **`firestore.rules`** (`/Users/CLD/.gemini/antigravity/scratch/plateup/firestore.rules`):
  - Rules permit owners to read/write under `users/{userId}` and subcollections: `recipes`, `mealPlans`, `cookingLog`, `shoppingLists`, `shoppingList`.
  - Updating `users/{userId}` with subscription plan fields (`plan`, `extractionsThisMonth`, `extractionResetMonth`, `subscriptionId`) is already fully permitted under `match /users/{userId} { allow read, write: if isOwner(userId); }`.
- **`src/types/index.ts`** & **`src/hooks/useProfile.ts`**:
  - Currently defines `UserProfile` with `displayName`, `email`, `photoURL`, `preferences`, `createdAt`, `updatedAt`.
  - Does not yet include `plan`, `extractionsThisMonth`, `extractionResetMonth`, or `subscriptionId`.

### 1.4 Existing User Interface Points
- **Shopping List Page** (`src/app/(app)/shopping-list/page.tsx`):
  - Toolbar contains `AddItemDialog`, `Generate from Plan` button, `Clear Done` button, `Clear All` button.
  - Currently lacks an "Order Ingredients" affiliate link CTA.
- **Recipe Detail Page** (`src/app/(app)/recipes/[id]/page.tsx`):
  - Bottom action bar contains `Delete Recipe`, `Add to Shopping List` (+ list button in card header), and `I Made This!`.
  - Currently lacks an "Order Ingredients" affiliate link CTA.
- **Extract Recipe Page** (`src/app/(app)/extract/page.tsx`):
  - Supports YouTube URL and Photo upload/camera.
  - Currently does not display extraction limits or block extraction when monthly quota is reached.
- **Navbar** (`src/components/layout/Navbar.tsx`):
  - Nav items: `Home`, `Extract`, `Discover`, `Recipes`, `Meal Plan`, `Shopping List`.
  - Avatar dropdown links to `/profile` and log out.
  - Lacks `Pricing` navigation link and Pro badge/crown indicator.
- **Landing Page** (`src/app/page.tsx`):
  - Header and footer currently link only to `/login`. Lacks links to `/pricing`.

---

## 2. Logic Chain

1. **Dependency Requirements**:
   - To integrate Stripe Checkout, server-side code requires the official `stripe` SDK (`npm install stripe`), and client-side code can use `@stripe/stripe-js` (or direct browser redirect to `session.url` returned by the checkout session API route).
   - Because Next.js 16 is running on Node 20+, `stripe` package integrates seamlessly with Next.js App Router route handlers (`POST /api/stripe/checkout`, `POST /api/stripe/webhook`).

2. **Stripe Integration & Webhook Architecture**:
   - Creating a checkout session:
     - Client calls `POST /api/stripe/checkout` with `{ planId: 'pro', returnUrl?: string }`.
     - Server initializes `new Stripe(process.env.STRIPE_SECRET_KEY)` and creates a `stripe.checkout.sessions.create` with:
       - `mode: 'subscription'`
       - `line_items`: Recurring monthly price ($4.99/mo USD)
       - `customer_email`: User's authenticated email
       - `client_reference_id`: User's Firebase UID
       - `metadata`: `{ userId: user.uid }`
       - `success_url`: `${origin}/pricing?session_id={CHECKOUT_SESSION_ID}&status=success` (or `/profile?session_id={CHECKOUT_SESSION_ID}`)
       - `cancel_url`: `${origin}/pricing?status=cancelled`
     - Returns `{ url: session.url }` which redirects the client to Stripe's hosted checkout.
   - Subscription Fulfillment & Verification:
     - Primary automated path: Webhook endpoint `POST /api/stripe/webhook` listens for `checkout.session.completed` and `customer.subscription.updated` / `deleted`. When valid, it updates Firestore `users/{userId}` to set `plan: 'pro'`, `subscriptionId: session.subscription`, `updatedAt: serverTimestamp()`.
     - Fallback / instant verification path: In local test mode or environments without webhook forwarding, `/api/stripe/verify-session?session_id=...` or client-side handler on `/pricing?session_id=...` retrieves session details securely and updates the user's Firestore document immediately so the user experiences zero delay in Pro activation.

3. **Freemium Tier & Monthly Usage Tracking**:
   - Free tier users get 5 AI extractions (YouTube + Photo combined) per calendar month.
   - Discover page (`TheMealDB`) remains 100% free and unlimited.
   - Monthly reset mechanism: Store `extractionResetMonth` (e.g. `"2026-08"` formatted as `YYYY-MM`). Whenever an extraction is initiated, if current month string != `extractionResetMonth`, reset `extractionsThisMonth` to 0.
   - Extract page displays remaining count (`3 of 5 free extractions remaining` or `Unlimited (Pro)`). When `extractionsThisMonth >= 5` and user is on `free` tier, disable extraction buttons and display a friendly upgrade banner linking to `/pricing`.

4. **Affiliate Link Generation (Amazon Fresh & Instacart)**:
   - Ingredient query formatting: Grocery store search queries work best when unit and quantity noise (e.g., "2 lbs", "1/2 cup", "minced") is stripped, leaving clean item names (e.g., "chicken breast", "heavy cream", "garlic", "parmesan cheese").
   - **Amazon Fresh URL Pattern**:
     - `https://www.amazon.com/s?k=${encodeURIComponent(cleanQuery)}&i=amazonfresh&tag=${AMAZON_AFFILIATE_TAG}`
     - Fallback / Grocery general: `https://www.amazon.com/s?k=${encodeURIComponent(cleanQuery)}&i=grocery&tag=${AMAZON_AFFILIATE_TAG}`
   - **Instacart URL Pattern**:
     - `https://www.instacart.com/store/s?k=${encodeURIComponent(cleanQuery)}&utm_source=${INSTACART_AFFILIATE_ID}&utm_medium=affiliate&utm_campaign=plateup_recipe`
   - UI Disclosure: Small, transparent disclosure text adjacent to button: *"PlateUp may earn an affiliate commission from qualifying grocery purchases at no extra cost to you."*

5. **Testing Strategy**:
   - The project uses `node:test` executed via `tests/runner.ts`.
   - New test suites should be added to `tests/` following the existing Tier 1–4 pattern:
     - `tests/unit-affiliate.test.ts` (Affiliate URL generation, parameter encoding, unit stripping)
     - `tests/unit-freemium.test.ts` (Monthly reset, 5-limit threshold, Pro unlimited bypass, usage counters)
     - `tests/unit-stripe.test.ts` (Checkout session params, webhook payload parsing, security validation)
     - `tests/tier1-features/f41-f45-monetization.test.ts` (Feature coverage F-41 to F-45)
     - `tests/tier2-boundary/f41-f45-monetization-boundary.test.ts` (Boundary conditions & edge cases)
     - Tier 4 Real-World Scenario additions (Scenario 6: Free limit reached -> upgrade to Pro -> unblocked extraction; Scenario 7: Shopping list & recipe affiliate order flows).

---

## 3. Caveats

1. **Stripe Test Mode**: Real credit cards should not be charged during development. Tests and implementation will utilize Stripe Test Mode keys (`sk_test_...`, `pk_test_...`) and standard Stripe test cards (`4242...`).
2. **Affiliate Partner Application Status**: Affiliate tags (`plateup-20` for Amazon, `plateup` for Instacart) will be configured via environment variables with sensible defaults so that link generation and URL structure are fully functional and verifiable immediately.
3. **No Breaking Changes to Existing Tests**: All 766 existing tests in Tiers 1–5 must continue passing without regression.

---

## 4. Conclusion & Actionable Architecture Plan

### 4.1 Required Dependencies to Install
Run in project root:
```bash
npm install stripe @stripe/stripe-js
```

### 4.2 Environment Configuration
Update `.env.local` (and add `.env.example`):
```env
# Firebase Configuration (Existing)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAwgUBtFcWp91beEUn1-hpYKaGpm5ScQxs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=plateup-ai-2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=plateup-ai-2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=plateup-ai-2026.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1079682535196
NEXT_PUBLIC_FIREBASE_APP_ID=1:1079682535196:web:fe61e84acc7a1da21834d9

# Stripe Integration (New)
STRIPE_SECRET_KEY=sk_test_51MockPlateUpSecretKeyForDev2026
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51MockPlateUpPubKeyForDev2026
STRIPE_WEBHOOK_SECRET=whsec_mock_stripe_webhook_secret_2026
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_plateup_pro_monthly

# Grocery Affiliate Tracking (New)
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG=plateup-20
NEXT_PUBLIC_INSTACART_AFFILIATE_ID=plateup
```

### 4.3 Proposed File Structure & Implementation Map

```
src/
├── types/
│   └── index.ts                 # Add SubscriptionPlan, UserProfile.plan, extractionsThisMonth, extractionResetMonth
├── lib/
│   ├── stripe.ts                # Stripe SDK initialization & helpers
│   ├── affiliate.ts             # Amazon Fresh & Instacart URL builders + query cleaners
│   └── usage.ts                 # Usage checking, monthly reset logic & limit helpers
├── hooks/
│   ├── useProfile.ts            # Update to support plan, usage counters & upgrade state
│   └── useUsage.ts              # Custom hook for extraction limits & remaining count
├── components/
│   ├── layout/
│   │   └── Navbar.tsx           # Add Pro Badge (Crown), Pricing link
│   ├── monetization/
│   │   ├── OrderIngredientsModal.tsx # Dropdown/Modal for Amazon Fresh / Instacart ordering + disclosure
│   │   ├── UpgradePrompt.tsx         # Encouraging, non-punishing upgrade banner/card
│   │   └── ProBadge.tsx              # Shiny Pro badge/crown indicator
│   ├── recipe/
│   │   └── RecipePreview.tsx
│   └── shopping/
│       └── OrderIngredientsButton.tsx # Action button on Shopping List & Recipe details
├── app/
│   ├── page.tsx                 # Add Pricing link in navbar and footer
│   ├── (app)/
│   │   ├── extract/page.tsx     # Display remaining extractions, gate 5/month limit with upgrade prompt
│   │   ├── pricing/page.tsx     # New: Free vs Pro comparison table & "Go Pro" Stripe Checkout button
│   │   ├── profile/page.tsx     # Add Subscription & Plan management section
│   │   ├── shopping-list/page.tsx # Add "Order Ingredients" CTA button & affiliate disclosure
│   │   └── recipes/[id]/page.tsx  # Add "Order Ingredients" CTA button & affiliate disclosure
│   └── api/
│       ├── stripe/
│       │   ├── checkout/route.ts # POST: Creates Stripe Checkout session ($4.99/mo)
│       │   ├── webhook/route.ts  # POST: Handles Stripe webhooks & updates Firestore
│       │   └── verify-session/route.ts # GET/POST: Session verification & instant Firestore sync
│       └── youtube-recipe/route.ts
tests/
├── unit-affiliate.test.ts       # Unit tests for affiliate URL builders
├── unit-freemium.test.ts        # Unit tests for usage tracking & monthly reset logic
├── unit-stripe.test.ts          # Unit tests for Stripe session creation & webhook parsing
├── tier1-features/
│   └── f41-f45-monetization.test.ts # Tier 1 Feature tests (F-41 to F-45)
├── tier2-boundary/
│   └── f41-f45-monetization-boundary.test.ts # Tier 2 Boundary tests
├── tier4-scenarios/
│   └── real-world-scenarios.test.ts # Added Scenario 6 & Scenario 7
└── runner.ts                    # Updated master test runner
```

### 4.4 Detailed Code Design Specs

#### A. Type Definitions (`src/types/index.ts`)
```ts
export type SubscriptionPlan = 'free' | 'pro';

export interface UserProfile {
  uid?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  plan: SubscriptionPlan; // 'free' | 'pro'
  extractionsThisMonth: number; // 0..5 for free, unlimited for pro
  extractionResetMonth: string; // "YYYY-MM" (e.g. "2026-08")
  subscriptionId?: string; // Stripe Subscription ID
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing';
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt?: Date;
}

export const FREE_TIER_MONTHLY_LIMIT = 5;
export const PRO_PLAN_PRICE_USD = 4.99;
```

#### B. Affiliate Link Engine (`src/lib/affiliate.ts`)
```ts
export interface AffiliateLinks {
  amazonFreshUrl: string;
  instacartUrl: string;
  ingredientCount: number;
}

/**
 * Clean ingredient line into searchable grocery product keyword
 * e.g., "2 lbs skinless chicken breast, diced" -> "chicken breast"
 */
export function cleanIngredientForSearch(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/^[\d\s/.,¼½¾⅓⅔⅛⅜⅝⅞-]+/, '') // remove leading numbers and fractions
    .replace(/\b(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|cloves?|grams?|g|ml|kg|sticks?|pints?|quarts?|cans?|bottles?|packages?|pinch|dashes?|handful)\b/gi, '')
    .replace(/\b(chopped|diced|minced|sliced|peeled|grated|melted|cooked|shredded|crushed|fresh|frozen|organic|warm|cold|boneless|skinless)\b/gi, '')
    .replace(/[(),]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildAmazonFreshUrl(
  ingredients: { item?: string; name?: string }[] | string[],
  affiliateTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'plateup-20'
): string {
  const items = ingredients
    .map(i => typeof i === 'string' ? i : (i.item || i.name || ''))
    .map(cleanIngredientForSearch)
    .filter(Boolean)
    .slice(0, 5); // Take primary top 5 items for search

  const query = items.length > 0 ? items.join(' ') : 'groceries';
  const encodedQuery = encodeURIComponent(query);
  return `https://www.amazon.com/s?k=${encodedQuery}&i=amazonfresh&tag=${encodeURIComponent(affiliateTag)}`;
}

export function buildInstacartUrl(
  ingredients: { item?: string; name?: string }[] | string[],
  partnerTag = process.env.NEXT_PUBLIC_INSTACART_AFFILIATE_ID || 'plateup'
): string {
  const items = ingredients
    .map(i => typeof i === 'string' ? i : (i.item || i.name || ''))
    .map(cleanIngredientForSearch)
    .filter(Boolean)
    .slice(0, 5);

  const query = items.length > 0 ? items.join(' ') : 'groceries';
  const encodedQuery = encodeURIComponent(query);
  return `https://www.instacart.com/store/s?k=${encodedQuery}&utm_source=${encodeURIComponent(partnerTag)}&utm_medium=affiliate&utm_campaign=recipe_ingredients`;
}

export const AFFILIATE_DISCLOSURE_TEXT =
  'PlateUp may earn a commission on qualifying purchases made through grocery partner links at no extra cost to you.';
```

#### C. Usage Gating & Reset Engine (`src/lib/usage.ts`)
```ts
import { FREE_TIER_MONTHLY_LIMIT } from '@/types';

export function getCurrentMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getRemainingExtractions(
  plan: 'free' | 'pro' = 'free',
  extractionsThisMonth = 0,
  extractionResetMonth = ''
): {
  remaining: number;
  isUnlimited: boolean;
  canExtract: boolean;
  effectiveCount: number;
} {
  if (plan === 'pro') {
    return { remaining: Infinity, isUnlimited: true, canExtract: true, effectiveCount: extractionsThisMonth };
  }

  const currentMonth = getCurrentMonthKey();
  const effectiveCount = extractionResetMonth === currentMonth ? extractionsThisMonth : 0;
  const remaining = Math.max(0, FREE_TIER_MONTHLY_LIMIT - effectiveCount);

  return {
    remaining,
    isUnlimited: false,
    canExtract: remaining > 0,
    effectiveCount,
  };
}
```

#### D. Stripe Checkout Route (`src/app/api/stripe/checkout/route.ts`)
```ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userEmail, returnUrl } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const origin = returnUrl || request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail || undefined,
      client_reference_id: userId,
      metadata: {
        userId,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PlateUp Pro Subscription',
              description: 'Unlimited AI recipe extractions & premium meal planning tools',
            },
            unit_amount: 499, // $4.99 USD
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${origin}/pricing?status=cancelled`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

---

## 5. Verification Method

### 5.1 Verification Commands
1. **Type Safety**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected: Zero TypeScript errors (status code 0).*

2. **Production Build**:
   ```bash
   npm run build
   ```
   *Expected: Successful Next.js webpack build with all static and dynamic routes compiled.*

3. **Existing & New Test Suite Execution**:
   ```bash
   npm test
   ```
   *Expected: All test suites across Tiers 1–5 pass 100% with 0 failed tests.*

### 5.2 Specific Test Cases to Verify
- **Affiliate URLs**:
  - `buildAmazonFreshUrl` produces valid `amazon.com/s?k=...&i=amazonfresh&tag=plateup-20`
  - `buildInstacartUrl` produces valid `instacart.com/store/s?k=...&utm_source=plateup...`
  - Special characters and fraction quantities are sanitized without crashing or emitting raw regex artifacts.
- **Freemium Quota**:
  - Free user at count `0` -> `5` remaining, can extract.
  - Free user at count `4` -> `1` remaining, can extract.
  - Free user at count `5` -> `0` remaining, blocked with friendly upgrade card.
  - Month change (e.g. `2026-07` -> `2026-08`) resets available extractions to `5`.
  - Pro user (`plan: 'pro'`) gets unlimited extractions regardless of count.
- **Stripe Checkout**:
  - `/api/stripe/checkout` returns valid session URL with `$4.99/mo` line item and `userId` metadata.
  - Session verification marks `plan: 'pro'` in Firestore user document.
- **UI Integration**:
  - Shopping List and Recipe detail pages render "Order Ingredients" button + affiliate disclosure text.
  - Navbar displays "Pro" badge / crown when user is Pro.
  - Pricing page `/pricing` renders comparison table and initiates Stripe Checkout.

### 5.3 Invalidation Conditions
- Any TypeScript error on `npx tsc --noEmit`.
- Any failure in existing 766 tests.
- Breaking changes to user profile Firestore structure without fallback defaults.
