# Milestone 2 Handoff Report: Freemium Tier System & Usage Tracking

## 1. Observation
- **`src/types/index.ts`**: Extended `UserProfile` interface with `plan?: SubscriptionPlan`, `extractionsThisMonth?: number`, `extractionMonth?: string`, `subscriptionId?: string`, `subscriptionStatus?: string`. Exported `SubscriptionPlan` ('free' | 'pro') and `FREE_TIER_MONTHLY_LIMIT = 5`.
- **`src/lib/usage.ts`**: Implemented `getCurrentMonthKey(date?: Date)` (generating `YYYY-MM`), `getExtractionUsage(profile, date)` (computing used count, remaining quota, limit, limit reached state, and automatic calendar month reset), and `recordExtractionUsage(userId, date)` (using Firestore `runTransaction` to atomically increment extraction count and reset on new months).
- **`src/hooks/useProfile.ts`**: Updated Firestore snapshot listener and default fallback profile to map `plan`, `extractionsThisMonth`, `extractionMonth`, `subscriptionId`, and `subscriptionStatus`.
- **`src/hooks/useUsage.ts`**: Implemented custom hook exposing `plan`, `extractionsThisMonth`, `used`, `limit`, `remaining`, `isLimitReached`, `loading`, `recordUsage`, and `profile`.
- **`src/hooks/useAuth.tsx`**: Updated `createUserProfile` to initialize new Firestore user documents with `plan: 'free'`, `extractionsThisMonth: 0`, and `extractionMonth: getCurrentMonthKey()`.
- **`src/components/monetization/UpgradePrompt.tsx`**: Created an encouraging, friendly upgrade banner/card component highlighting Pro benefits (unlimited recipe extractions, smart meal planning, grocery ordering, priority AI) and linking directly to `/pricing`.
- **`src/app/(app)/extract/page.tsx`**: Integrated `useUsage`, added quota display ("{remaining} of 5 free extractions remaining this month" or "PlateUp Pro: Unlimited Extractions"), gated extraction actions behind `<UpgradePrompt />` when free users reach the 5-extraction limit, and hooked `recordUsage()` into successful YouTube and Photo extractions.
- **`src/app/(app)/discover/page.tsx`**: Verified to remain completely ungated and free for all users browsing and saving TheMealDB recipes.
- **`tests/unit-usage-m2.test.ts`**: Added 14 unit tests validating month key formatting, usage calculations, boundary conditions, free vs pro tier limits, and calendar month rollovers.

## 2. Logic Chain
1. *Requirement R2* mandates tracking monthly AI extraction counts in Firestore, granting free users 5 extractions per month, resetting counts monthly by calendar month, blocking free users with an encouraging upgrade prompt upon reaching the limit, and granting Pro users unlimited extractions while leaving Discover completely ungated.
2. *State Design*: Storing `extractionMonth: "YYYY-MM"` alongside `extractionsThisMonth: number` in the user document allows stateless and atomic verification of whether the user is in the current month or if a new calendar month has started without requiring scheduled cron jobs.
3. *Usage Calculator*: `getExtractionUsage` reads `profile.extractionMonth`. If the month does not match `getCurrentMonthKey()`, `used` is evaluated as `0` and `remaining` as `5`. If `profile.plan === 'pro'`, `limit` and `remaining` evaluate to `Infinity` and `isLimitReached` to `false`.
4. *Atomic Counter*: `recordExtractionUsage` uses Firestore `runTransaction` to safely prevent race conditions. If the recorded month matches the current month, it increments the count by 1; otherwise, it resets `extractionsThisMonth` to `1` with the new `extractionMonth`.
5. *UX & Integration*: The Extract page displays the user's remaining quota in real time via snapshot subscription in `useProfile` / `useUsage`. If a free tier user exhausts their 5 extractions, the extract inputs/actions are replaced with `<UpgradePrompt />` directing them to `/pricing`.

## 3. Caveats
- No caveats. All Firestore transaction logic handles missing documents, existing documents, and month transitions safely. Offline and unit testing environments operate cleanly.

## 4. Conclusion
Milestone 2 is complete, fully implemented, verified, and adheres to all interface contracts and requirements.

## 5. Verification Method
- **TypeScript Check**: Run `npx tsc --noEmit` -> 0 errors.
- **Unit Tests**: Run `node --experimental-strip-types tests/unit-usage-m2.test.ts` -> 14/14 tests pass.
- **Production Build**: Run `npm run build` -> Next.js 16 build compiles and generates all static/dynamic routes successfully.
