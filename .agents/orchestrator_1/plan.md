# PlateUp Pre-Production QA Audit & Remediation Plan

## Overview
Comprehensive QA audit and bug fixing of PlateUp (Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Firebase Auth/Firestore, Gemini API, Stripe).

## Strategy & Topology (Project Pattern: Dual Track)

### Phase 0: Survey & Discovery (3 Explorers in parallel)
- Explorer 1 (Survey: Code Quality, Build & Security): Investigate TypeScript compilation, Next.js build, Jest/test suite, Firebase security rules, Stripe webhook signature verification, GEMINI_API_KEY exposure check, console.log usage, dead code.
- Explorer 2 (Survey: User Journeys & Core Features): Investigate all primary user paths (Auth, YouTube/Photo Recipe Extraction, Recipe Detail/CRUD/Rating/CookCount, Discover page, Meal Plan, Shopping List, Profile/Preferences, Pricing/Stripe checkout).
- Explorer 3 (Survey: Edge Cases, A11y, Mobile & Error Handling): Investigate empty states, input boundary conditions, YouTube/Photo error cases, rate limits / subscription tiers, servings scaling, 375px mobile responsiveness, WCAG accessibility, loading/error UI states.

### Phase 1: Decomposition & Dual Track Setup
- Synthesize all Survey findings into `PROJECT.md` at project root with complete Feature Inventory, Milestones, and Interface Contracts.
- Launch E2E Testing Orchestrator (Opaque-box test suite: Tiers 1-4).
- Launch Implementation Milestones through Sub-Orchestrators.

### Phase 2: Implementation Milestones Execution
- Sub-Orchestrators run the standard loop: Explorer (x3) -> Worker -> Reviewer (x2) -> Challenger (x2) -> Auditor -> Gate check.
- Milestone 1: Code Quality, Security & Backend Integrity (Fix tsc errors, build issues, test runner, security rules, webhook verification, API error handlers).
- Milestone 2: Extraction & Recipe Collections (Fix YouTube/Photo extraction, image handling, CRUD, ratings, 'I Made This' count).
- Milestone 3: Meal Planning, Shopping List & Profile/Billing (Fix meal plan slots, auto-fill, shopping list generation & checking, affiliate links, dietary filters, subscription).
- Milestone 4: Edge Cases, UI/UX, A11y & Mobile (Empty states, servings math fractions, 375px layouts, aria-labels, loading/error banners).

### Phase 3: Final Verification & Hardening
- 100% E2E test pass across Tiers 1-4.
- Tier 5 White-box Adversarial Coverage Hardening (Challenger-driven).
- Final Full Audit & Gate Confirmation.
