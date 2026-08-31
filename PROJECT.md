# Project: PlateUp Pre-Production QA & Hardening

## Architecture
PlateUp is an AI-powered smart recipe extraction and meal planning web application.
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide icons, Radix UI / shadcn/ui.
- **Authentication & Database**: Firebase Auth (email/password & Google popup) + Cloud Firestore with real-time listeners and security rules.
- **AI Processing**: Google Generative AI (Gemini Flash / Gemini Pro Vision) for structured recipe extraction from YouTube transcripts, video metadata, and food photos.
- **Third-Party Integrations**: TheMealDB for recipe discovery, Stripe for Pro subscription billing ($4.99/mo) and webhooks, Amazon/Instacart affiliate link generation.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Stripe Webhook Signature Verification | Verify `stripe-signature` header via HMAC-SHA256 in `src/app/api/stripe/webhook/route.ts` | M1 | Done |
| 2 | Firestore Security Rules Hardening | Prevent client-side escalation of `plan` and `stripeCustomerId` | M1 | Done |
| 3 | Code Cleanliness & Dead Code Removal | Remove `src/lib/ai.ts`, duplicate `RecipeCard.tsx`, fix ESLint `any` and unused imports | M1 | Done |
| 4 | Servings Adjuster Unicode Fractions | Support vulgar fractions (`½`, `¾`, etc.) in servings scaling | M2 | Done |
| 5 | Large Image Upload Optimization | Client-side downscaling / canvas compression for >4.5MB photos | M2 | Done |
| 6 | Recipe Extraction & Collection Flows | YouTube (standard + shorts), photo formats (jpg, png, heic, webp), CRUD, ratings, 'I Made This' | M2 | Done |
| 7 | Meal Plan UX & Confirmation Guards | Add `isAutoFilling` state and confirmation dialog for Clear All | M3 | Done |
| 8 | Legal & Navigation Polish | Replace draft placeholders in Privacy/Terms, add custom `not-found.tsx` | M3 | Done |
| 9 | Shopping List & Affiliate Links | Meal plan aggregation, check-off persistence, Amazon/Instacart links | M3 | Done |
| 10 | Icon Buttons Accessibility (A11y) | Add explicit `aria-label` attributes to all icon-only buttons | M4 | Done |
| 11 | Mobile Responsiveness (375px) & Error States | Verify mobile 375px layout, zero horizontal overflow, error banners | M4 | Done |
| 12 | 100% E2E Test Suite & Adversarial Hardening | Verify all test tiers (1-5), run test suite, ensure 0 regressions | M5 (Final) | Done |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Backend Security & Code Hygiene | Stripe webhook signature, Firestore security rules, dead code removal, ESLint | none | DONE |
| 2 | Extraction & Recipe Scaling Optimization | Servings vulgar fraction scaling, image upload downscaling, extraction flows | none | DONE |
| 3 | Meal Plan, Shopping & Legal Polish | Meal plan action guards, custom 404, legal terms/privacy finalization | none | DONE |
| 4 | Accessibility & Mobile UX Polish | Icon button aria-labels, 375px mobile responsive polish, loading/error states | none | DONE |
| 5 | E2E Testing & Adversarial Hardening | Final verification: 2 Reviewers, 2 Challengers, Forensic Integrity Auditor | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Webhook ↔ Stripe Service
- `src/app/api/stripe/webhook/route.ts` parses raw request text, retrieves `stripe-signature` header, invokes `verifyStripeWebhookSignature(rawBody, signature)` from `src/lib/stripe.ts`, and executes `handleStripeWebhookEvent(event)`.

### Servings Scaling ↔ Ingredient Parser
- `scaleAmount(amount: string, scale: number)` in `src/app/(app)/recipes/[id]/page.tsx` uses `scaleIngredientAmount` from `src/lib/ingredient-parser.ts` to reliably parse decimal, fraction, mixed, and Unicode vulgar fraction amounts, and formats scaled numbers accurately.

### Firestore Rules ↔ Client Auth
- `firestore.rules` allows `write` to `/users/{userId}` only if `isOwner(userId)` AND `isValidUserUpdate()` / `isValidUserCreate()`, protecting `plan` and `stripeCustomerId` modification against client-side tampering.

## Code Layout
- `src/app/` — Next.js 15 App Router pages and API routes
- `src/components/` — React UI components (auth, layout, meal-plan, recipe, shopping, ui)
- `src/hooks/` — React Firestore and state hooks (`useAuth`, `useRecipes`, `useMealPlan`, `useShoppingList`, `useProfile`)
- `src/lib/` — Business logic, API clients (`ai-server.ts`, `stripe.ts`, `youtube.ts`, `mealdb.ts`, `meal-planner.ts`, `shopping-aggregator.ts`, `ingredient-parser.ts`, `usage.ts`, `affiliate.ts`)
- `tests/` — Automated test suites across Tiers 1-4 and Tier 5 adversarial tests
