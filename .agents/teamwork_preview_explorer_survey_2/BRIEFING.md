# BRIEFING — 2026-08-28T12:14:30Z

## Mission
Map the Data Layer, Firebase Auth, Firestore schema, User Profile state, and AI Extraction workflows for PlateUp monetization & freemium features.

## 🔒 My Identity
- Archetype: explorer
- Roles: survey, analysis, synthesis
- Working directory: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/teamwork_preview_explorer_survey_2
- Original parent: 3ea14768-fe53-4f59-a65e-376b7022d92b
- Milestone: monetization-freemium-investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Produce 5-component handoff report
- Deliver structured findings on Firebase, Auth, Firestore schema, Profile, Extraction workflows, Monthly count checks, Discover page, and types.

## Current Parent
- Conversation ID: 3ea14768-fe53-4f59-a65e-376b7022d92b
- Updated: 2026-08-28T12:14:30Z

## Investigation State
- **Explored paths**:
  - `src/lib/firebase.ts`, `firestore.rules`, `.env.local`
  - `src/hooks/useAuth.tsx`, `src/hooks/useProfile.ts`, `src/hooks/useRecipes.ts`, `src/hooks/useShoppingList.ts`, `src/hooks/useMealPlan.ts`, `src/hooks/useCookingLog.ts`
  - `src/components/auth/AuthGuard.tsx`, `src/components/layout/Navbar.tsx`
  - `src/types/index.ts`
  - `src/lib/ai.ts`, `src/lib/extract-recipe.ts`, `src/lib/youtube.ts`, `src/app/api/youtube-recipe/route.ts`, `src/app/(app)/extract/page.tsx`
  - `src/lib/mealdb.ts`, `src/app/(app)/discover/page.tsx`
  - `src/app/(app)/profile/page.tsx`, `src/app/(app)/recipes/[id]/page.tsx`, `src/app/(app)/shopping-list/page.tsx`, `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/(app)/dashboard/page.tsx`
  - `tests/runner.ts`, `tests/helpers/test-context.ts`, all 22 test suites.
- **Key findings**:
  - Full client-side Firebase Auth and Firestore architecture; client has direct write access to `users/{userId}` and subcollections via security rules.
  - User document at `users/{userId}` currently lacks `plan`, `extractionsThisMonth`, `extractionMonth`, `subscriptionId`.
  - Recipe extraction happens client-side using `@google/generative-ai` with Firebase API key directly (`gemini-3.6-flash`).
  - Monthly extraction count check & reset requires month string tracking (`YYYY-MM`) and atomicity (Firestore transaction or client helper with optimistic checks).
  - Discover page (TheMealDB) is 100% free and requires zero extraction quota gating.
- **Unexplored areas**: None for this investigation scope.

## Key Decisions Made
- Mapped all data types and state flows to integrate cleanly with Stripe and affiliate links without breaking existing 766 passing tests.

## Artifact Index
- handoff.md — Complete 5-component survey report
- progress.md — Liveness & heartbeat log
- DISPATCH.md — Task dispatches
