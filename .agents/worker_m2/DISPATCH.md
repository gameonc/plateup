## 2026-08-28T12:15:08Z
You are worker_m2 for Milestone 2: Freemium Tier System & Usage Tracking.
Working directory: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/worker_m2/
Project root: /Users/CLD/.gemini/antigravity/scratch/plateup

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read these specifications before implementing:
1. /Users/CLD/.gemini/antigravity/scratch/plateup/ORIGINAL_REQUEST.md (§R2)
2. /Users/CLD/.gemini/antigravity/scratch/plateup/PROJECT.md (§Interface Contracts & Code Layout)

Scope & Exclusive File Ownership:
- `src/types/index.ts`: Extend `UserProfile` with `plan?: 'free' | 'pro'`, `extractionsThisMonth?: number`, `extractionMonth?: string`, `subscriptionId?: string`. Export `SubscriptionPlan`, `FREE_TIER_MONTHLY_LIMIT = 5`.
- `src/lib/usage.ts`: Implement `getCurrentMonthKey`, `getExtractionUsage`, and Firestore transaction helper `recordExtractionUsage` ensuring calendar month reset and atomic count increments.
- `src/hooks/useProfile.ts`: Ensure real-time snapshot maps `plan`, `extractionsThisMonth`, and `extractionMonth` with fallback defaults.
- `src/hooks/useUsage.ts`: Custom hook for components to easily consume `plan`, `extractionsThisMonth`, `remaining`, `isLimitReached`, and `recordUsage`.
- `src/hooks/useAuth.tsx`: In `createUserProfile`, initialize new user documents with default `plan: 'free'`, `extractionsThisMonth: 0`, and `extractionMonth: YYYY-MM`.
- `src/components/monetization/UpgradePrompt.tsx`: Create an encouraging, friendly upgrade banner/dialog highlighting Pro benefits (unlimited extractions, meal planning tools) without punishing tone, linking to `/pricing`.
- `src/app/(app)/extract/page.tsx`: Display remaining extraction count ("3 of 5 free extractions remaining this month" or "PlateUp Pro: Unlimited Extractions"). If a free user reaches the 5 extraction limit, disable/replace extract actions with `<UpgradePrompt />`. Ensure successful extractions call `recordExtractionUsage`.
- Verify `src/app/(app)/discover/page.tsx` remains completely free and ungated.

Verification Requirements:
1. Run `npx tsc --noEmit` to ensure zero type errors.
2. Run `npm run build` to ensure clean Next.js build.
3. Run `npm test` to ensure tests pass.

Write your completion report to /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/worker_m2/handoff.md and send a message to parent (ID: 3ea14768-fe53-4f59-a65e-376b7022d92b).
