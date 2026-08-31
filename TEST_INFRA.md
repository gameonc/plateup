# PlateUp Test Infrastructure & Quality Architecture

## 1. Overview & Testing Philosophy

PlateUp's test infrastructure provides an end-to-end, multi-tiered verification framework designed for pre-production quality assurance and continuous regression prevention.

### Core Principles
1. **Opaque-Box Requirement-Driven Testing**: Derived directly from `ORIGINAL_REQUEST.md` and `PROJECT.md` specifications. Tests validate business behaviors, contracts, and invariants rather than internal implementation minutiae.
2. **Deterministic & Self-Contained Execution**: All tests execute in-process using Node.js native test runner (`node:test`) with zero external network dependencies, powered by simulated Firestore/Auth contexts, mock AI responses, and simulated payment workflows.
3. **Multi-Tiered Coverage Methodology**: Combines Category-Partition, Boundary Value Analysis (BVA), Pairwise Combinatorial Testing, Real-World Lifecycle Workloads, and Adversarial White-Box Hardening.

---

## 2. Test Architecture & Runner

### Test Execution Engine
- **Runner**: Node.js built-in test runner (`node:test`) with `--experimental-strip-types`.
- **Command**: `npm test` or `node --experimental-strip-types tests/runner.ts`.
- **Orchestration**: `tests/runner.ts` discovers and executes all 34 test suites concurrently, pipes real-time TAP/spec events, collects fine-grained pass/fail statistics, and outputs a formatted executive verification summary.

### Helper & Simulation Subsystems
The `tests/helpers/` directory encapsulates testing utilities and in-memory mock state:
- `test-context.ts`: High-fidelity in-memory simulation of Firebase Auth, Cloud Firestore (collections, queries, listeners, batch operations), local storage, and dietary/planner engines.
- `monetization-helpers.ts`: Simulation engines for Stripe Checkout session generation, session verification, webhook payload construction, HMAC signature verification, freemium monthly rollover, and affiliate URL generation.
- `recipe-fixtures.ts`: Comprehensive recipe fixtures spanning YouTube transcripts, short/standard URLs, image base64 payloads, multi-cuisine recipes, extreme ingredient counts, and vulgar fraction strings.
- `assertions.ts`: Domain-specific assertion helpers for OKLCH color token conformity, 375px mobile viewport constraints, and ISO week date calculations.

---

## 3. 4-Tier + Adversarial Coverage Methodology

### Tier 1: Feature Coverage (F-01 to F-47)
- **Goal**: Full functional verification of every feature specification in the PlateUp catalog.
- **Rule**: Minimum 5 test cases per feature covering primary happy paths, state transitions, UI rendering invariants, and data persistence.
- **Scope**: 9 test files, 235 distinct tests.

### Tier 2: Boundary Value Analysis & Corner Cases (F-01 to F-47)
- **Goal**: Hardening against edge conditions, extreme inputs, boundary limits, and unexpected user actions.
- **Rule**: Minimum 5 tests per feature domain testing minimum/maximum limits, off-by-one errors, empty states, huge payloads, leap days, and year-boundary calendar rollovers.
- **Scope**: 5 test files, 220 distinct tests.

### Tier 3: Pairwise Combinatorial Cross-Feature Interactions
- **Goal**: Detect multi-feature integration bugs caused by state cross-talk.
- **Methodology**: Systematic pairwise matrix combining User Plan (Free/Pro) × Auth State × Recipe Source (YouTube/Shorts/Photo/MealDB) × Dietary Restrictions (Vegan/Keto/Gluten-Free) × Planner Action (Manual/Auto-fill) × Shopping List Export (Amazon/Instacart).
- **Scope**: 1 test file (`tier3-pairwise/pairwise-interactions.test.ts`), 45 distinct integration tests.

### Tier 4: Real-World Application Scenarios
- **Goal**: Validate complete multi-step user journeys from registration through meal cooking, grocery shopping, and monetization.
- **Scope**: 2 test files (`real-world-scenarios.test.ts`, `monetization-scenarios.test.ts`), 9 end-to-end lifecycle workflows:
  1. *YouTube Video to Cooked Meal & Grocery Run*
  2. *Photo Recipe & Weekly Meal Plan with Duplicate Ingredient Summing*
  3. *Strict Vegan & Gluten-Free Lifestyle Transition*
  4. *Mobile 375px On-The-Go Grocery Shopping*
  5. *High-Frequency Cook History & Live Note Auto-save*
  6. *Free User Quota Limit -> Stripe Checkout Upgrade ($4.99/mo) -> Unlimited Extractions*
  7. *Shopping List & Recipe Detail "Order Ingredients" Partner Affiliate Flow*
  8. *Monthly Quota Rollover, Upgrade, and Subscription Cancellation Lifecycle*
  9. *Discover (TheMealDB) Browsing & Saving Remains 100% Free and Ungated*

### Tier 5: Adversarial Stress & Hardening Suites
- **Goal**: White-box stress testing, security validation, and empirical regression testing.
- **Scope**: 7 test files + 10 unit suites (over 500 tests) verifying:
  - Stripe webhook signature verification (HMAC and mock provider)
  - Firestore security rule invariants (preventing client privilege escalation)
  - Unicode vulgar fraction parsing (`½`, `¾`, `⅝`, `⅜`, `⅞`, compound fractions) and scaling
  - Client-side large image upload downscaling & canvas compression
  - A11y `aria-label` attributes on icon buttons
  - Zero horizontal overflow on 375px mobile viewports

---

## 4. Feature Inventory & Test Mapping Matrix

| # | Feature / Milestone | Key Components | Test Suites | Test Count |
|---|---|---|---|:---:|
| 1 | **Stripe Webhook Signature Verification** (M1) | `src/lib/stripe.ts`, `src/app/api/stripe/webhook/route.ts` | `unit-stripe.test.ts`, `unit-stripe-m3.test.ts`, `f41-f45-monetization.test.ts`, `adversarial-monetization-stress.test.ts` | 38 |
| 2 | **Firestore Security Rules Hardening** (M1) | `firestore.rules`, `src/hooks/useAuth.ts` | `f01-f05-auth-safety.test.ts`, `f41-f45-monetization.test.ts`, `adversarial-m1.test.ts`, `adversarial-monetization-lifecycle.test.ts` | 35 |
| 3 | **Code Hygiene & Dead Code Removal** (M1) | `src/lib/ai-server.ts`, `eslint.config.mjs`, TypeScript | `npx tsc --noEmit`, `npm run lint`, `unit-qa-improvements.test.ts` | 24 |
| 4 | **Servings Adjuster Unicode Fractions** (M2) | `src/lib/ingredient-parser.ts`, `src/app/(app)/recipes/[id]/page.tsx` | `unit-qa-improvements.test.ts`, `adversarial-tier5-hardening.test.ts`, `adversarial-monetization-stress.test.ts` | 52 |
| 5 | **Large Image Upload Optimization** (M2) | `src/app/(app)/extract/page.tsx`, `src/lib/image-utils.ts` | `f06-f10-extraction-persistence.test.ts`, `f01-f10-boundary.test.ts`, `adversarial-challenger-m1.test.ts` | 28 |
| 6 | **Recipe Extraction & Collection Flows** (M2) | `src/lib/youtube.ts`, `src/lib/ai-server.ts`, `src/hooks/useRecipes.ts` | `f06-f10-extraction-persistence.test.ts`, `f11-f15-recipe-actions.test.ts`, `real-world-scenarios.test.ts` | 65 |
| 7 | **Meal Plan UX & Confirmation Guards** (M3) | `src/app/(app)/meal-plan/page.tsx`, `src/lib/meal-planner.ts` | `f16-f20-search-planner.test.ts`, `f21-f24-autofill-dashboard.test.ts`, `unit-qa-improvements.test.ts` | 45 |
| 8 | **Legal & Navigation Polish** (M3) | `src/app/not-found.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` | `f25-f31-ui-mobile-landing.test.ts`, `unit-navigation-badges-m4.test.ts` | 22 |
| 9 | **Shopping List & Affiliate Links** (M3) | `src/lib/shopping-aggregator.ts`, `src/lib/affiliate.ts`, `src/app/(app)/shopping-list/page.tsx` | `f32-f37-shopping-list.test.ts`, `unit-affiliate.test.ts`, `unit-shopping-m3.test.ts`, `adversarial-monetization-lifecycle.test.ts` | 76 |
| 10 | **Icon Buttons Accessibility (A11y)** (M4) | `src/components/`, `src/app/` | `f25-f31-ui-mobile-landing.test.ts`, `unit-qa-improvements.test.ts`, `adversarial-empirical-verification.test.ts` | 32 |
| 11 | **Mobile Responsiveness (375px) & Error States** (M4) | `src/app/(app)/layout.tsx`, `src/components/ui/` | `f25-f31-ui-mobile-landing.test.ts`, `f21-f30-boundary.test.ts`, `adversarial-challenger-m1.test.ts` | 40 |
| 12 | **100% E2E Test Suite & Adversarial Hardening** (M5) | `tests/runner.ts`, `tests/**/*.test.ts` | All 34 Test Suites | 1057 |

---

## 5. Verification & Continuous Quality Commands

Run tests and verification suites using the standard project commands:

```bash
# 1. Execute all 34 test suites (Tiers 1-5)
npm test

# 2. Verify static type safety (zero TypeScript errors)
npx tsc --noEmit

# 3. Verify production Next.js build compilation
npm run build

# 4. Check ESLint code style and rules
npm run lint
```
