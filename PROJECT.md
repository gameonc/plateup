# Project: PlateUp Monetization Features

## Architecture
PlateUp is a Next.js 15 recipe extraction and meal planning web application using TypeScript, Tailwind CSS v4, Base UI / shadcn components, Firebase (Auth + Firestore), and Google Generative AI (Gemini 2.5 Flash).

The monetization layer adds two revenue streams:
1. **Affiliate Shopping Integration**:
   - URL generators for partner grocery stores (Amazon Fresh, Instacart) with clean ingredient query sanitization and affiliate referral parameters.
   - UI CTAs on Shopping List page and Recipe Detail page with transparent affiliate disclosures.
2. **Freemium Tier System & Stripe Subscription**:
   - Monthly extraction quota tracking (5 free extractions/month for Free tier, unlimited for Pro tier) reset by calendar month (`YYYY-MM`).
   - Friendly upgrade banners and disabled extraction buttons upon reaching quota; Discover page remains completely free & ungated.
   - Stripe Checkout session creation for $4.99/mo recurring subscription, session verification, and Firestore user profile update to `plan: 'pro'`.
   - Visual Pro badges/crowns in navbar and pricing navigation links.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F-41 | Affiliate Link Generation & Sanitization | `src/lib/affiliate.ts` generating sanitized query URLs with affiliate tags for Amazon Fresh and Instacart + disclosure text | M1 | ORIGINAL_REQUEST §R1 |
| F-42 | Shopping List & Recipe Detail Affiliate CTAs | "Order Ingredients" buttons and modal/dropdown with affiliate disclosure on Shopping List and Recipe Detail pages | M1 | ORIGINAL_REQUEST §R1 |
| F-43 | Freemium Tier & Monthly Usage Tracking | `UserProfile` extension, `src/lib/usage.ts` tracking 5 free monthly extractions, ISO month reset (`YYYY-MM`), atomic increment | M2 | ORIGINAL_REQUEST §R2 |
| F-44 | Extract Page Quota UI & Ungated Discover | Remaining extractions banner ("3 of 5 free extractions remaining"), friendly upgrade prompt on quota limit, unrestricted Discover page | M2 | ORIGINAL_REQUEST §R2 |
| F-45 | Stripe Checkout & Webhook/Verification | `stripe` package integration, `/api/stripe/checkout` route ($4.99/mo), session verification & Firestore sync to `plan: 'pro'` | M3 | ORIGINAL_REQUEST §R3 |
| F-46 | /pricing Page & Profile Subscription Card | `/pricing` page with Free vs Pro comparison table and "Go Pro" button; Profile page subscription management section | M3 | ORIGINAL_REQUEST §R3 |
| F-47 | Navbar Pro Crown Badge & Pricing Navigation | Pro crown icon / badge next to user avatar in navbar when `plan: 'pro'`; "Pricing" link in landing page and in-app navigation | M4 | ORIGINAL_REQUEST §R4 |
| F-48 | E2E Testing Suite & Build Health | Comprehensive 4-tier test suites (Tiers 1-4) + adversarial hardening (Tier 5), zero TypeScript errors, build pass | M-Final / E2E Track | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M-E2E | E2E Test Suite Development | Requirement-driven test suite (Unit, Tier 1 Feature, Tier 2 Boundary, Tier 3 Interaction, Tier 4 Real-World Scenarios), update runner.ts, publish TEST_READY.md | none | DONE |
| M1 | Affiliate Shopping Integration | `src/lib/affiliate.ts`, `src/components/shopping/OrderIngredientsButton.tsx`, Shopping List page & Recipe Detail page integration with disclosure text | none | DONE |
| M2 | Freemium Tier & Usage Tracking | `src/types/index.ts`, `src/lib/usage.ts`, `src/hooks/useProfile.ts`, `src/hooks/useAuth.tsx`, `src/app/(app)/extract/page.tsx` quota display & upgrade prompt | none | DONE |
| M3 | Stripe Checkout & Pricing Page | Install `stripe`, `/api/stripe/checkout`, `/api/stripe/verify-session`, `/api/stripe/webhook`, `/pricing` page, `/profile` subscription management | M2 | DONE |
| M4 | Navigation, Badges & UI Integration | `Navbar.tsx` Pro crown/badge & pricing links, `src/app/page.tsx` landing page pricing links, upgrade prompt styling | M2, M3 | DONE |
| M-Final | 100% E2E Pass & Coverage Hardening | Run full test suite across all tiers, fix any regressions, execute white-box adversarial coverage checks | M1, M2, M3, M4, M-E2E | DONE |

## Interface Contracts

### Affiliate Engine ↔ UI Pages
```typescript
// src/lib/affiliate.ts
export function cleanIngredientForSearch(raw: string): string;
export function buildAmazonFreshUrl(ingredients: ({ item?: string; name?: string } | string | null | undefined)[], affiliateTag?: string): string;
export function buildInstacartUrl(ingredients: ({ item?: string; name?: string } | string | null | undefined)[], partnerTag?: string): string;
export const AFFILIATE_DISCLOSURE_TEXT: string;
```

### Usage Engine ↔ Profile & Extract Page
```typescript
// src/lib/usage.ts & src/types/index.ts
export type SubscriptionPlan = 'free' | 'pro';
export interface UserProfile {
  // ... existing fields
  plan?: SubscriptionPlan;
  extractionsThisMonth?: number;
  extractionMonth?: string; // "YYYY-MM"
  subscriptionId?: string;
  subscriptionStatus?: string;
}
export const FREE_TIER_MONTHLY_LIMIT = 5;
export function getCurrentMonthKey(date?: Date): string;
export function getExtractionUsage(profile: UserProfile | null | undefined): {
  plan: 'free' | 'pro';
  used: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
};
export async function recordExtractionUsage(userId: string): Promise<{ remaining: number; plan: SubscriptionPlan }>;
```

### Stripe API ↔ Client Checkout
```typescript
// POST /api/stripe/checkout
// Request: { userId: string; userEmail?: string; returnUrl?: string }
// Response: { url: string; sessionId: string }

// POST /api/stripe/verify-session
// Request: { sessionId: string; userId: string }
// Response: { success: boolean; plan: 'pro'; subscriptionId: string }
```

## Code Layout
- `src/types/index.ts`: Shared types for UserProfile, SubscriptionPlan, Affiliate interfaces.
- `src/lib/affiliate.ts`: URL building & keyword sanitization for grocery partners.
- `src/lib/usage.ts`: Quota calculation, calendar month reset, usage tracking.
- `src/lib/stripe.ts`: Stripe client/server initialization.
- `src/hooks/useProfile.ts`: Firestore user profile subscription listener & state.
- `src/hooks/useUsage.ts`: Convenience hook for extraction usage & limits.
- `src/components/layout/Navbar.tsx`: Pro crown badge, pricing link.
- `src/components/shopping/OrderIngredientsButton.tsx`: Reusable affiliate shopping action & dialog.
- `src/components/monetization/UpgradePrompt.tsx`: Friendly, encouraging upgrade prompt banner.
- `src/components/monetization/ProBadge.tsx`: Reusable Pro crown badge.
- `src/app/(app)/shopping-list/page.tsx`: Shopping list page with order CTA.
- `src/app/(app)/recipes/[id]/page.tsx`: Recipe detail page with order CTA.
- `src/app/(app)/extract/page.tsx`: Extract page with remaining quota and upgrade gating.
- `src/app/(app)/profile/page.tsx`: Profile page with subscription management card.
- `src/app/pricing/page.tsx`: Pricing comparison page ($0 Free vs $4.99/mo Pro).
- `src/app/api/stripe/checkout/route.ts`: Stripe checkout session creation.
- `src/app/api/stripe/verify-session/route.ts`: Instant session verification for Firestore sync.
- `src/app/api/stripe/webhook/route.ts`: Stripe webhook handler.
- `tests/`: Unit, feature, boundary, and scenario test suites executed via `tests/runner.ts`.
