# Orchestration Plan: PlateUp Monetization Features

## Objectives
Implement and rigorously verify two revenue streams in PlateUp:
1. Affiliate Shopping Integration (Amazon Fresh / Instacart query links on Shopping List & Recipe Detail).
2. Freemium Tier System & Usage Tracking (Monthly 5 free extractions tracking in Firestore, blocking & encouraging upgrade prompt, unlimited for Pro, unlimited TheMealDB).
3. Pro Upgrade Page & Stripe Checkout (Stripe checkout session API, test mode, webhook/session completion handling, user plan update to pro, /pricing page, Profile page subscription management).
4. Navigation & UI Integration (Pro badge/crown icon in navbar, Pricing links, friendly upgrade prompts).
5. Build Health & E2E Testing (zero tsc errors, npm run build pass, comprehensive automated tests passing).

## Execution Strategy
- **Phase 0: Architecture & Codebase Survey**
  - Explorer 1: Project structure, pages (shopping list, recipe details, navbar, profile, extract, discover), UI components, styling.
  - Explorer 2: Data layer & auth (Firebase Auth, Firestore models/collections, user profiles, current extraction logic).
  - Explorer 3: Dependencies, environment variables, build setup, existing test setup, Stripe integration requirements.
- **Phase 1: Scope Synthesis & Test Infrastructure Definition**
  - Synthesize findings into `PROJECT.md` and `TEST_INFRA.md`.
- **Phase 2: Implementation & E2E Testing Track**
  - E2E Test Suite Orchestration (Tiers 1-4 tests).
  - Milestone 1: Affiliate Shopping Integration.
  - Milestone 2: Freemium Tier & Extraction Tracking.
  - Milestone 3: Stripe Checkout, Webhooks & Pricing Page.
  - Milestone 4: Navigation, Badges & Profile/Upgrade UI.
- **Phase 3: Final Verification & Adversarial Hardening (Tier 5)**
  - Validate 100% test pass, clean forensic audit, zero typescript/build errors.
- **Phase 4: Completion & Sentinel Reporting**
