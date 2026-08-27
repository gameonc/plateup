# Milestone 1 Adversarial Challenge Report

**Author**: Challenger M1-2 (Critic, Specialist)  
**Date**: 2026-08-27  
**Working Directory**: `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/challenger_m1_2`  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Observation

Direct empirical observations from executing tool commands and inspecting source code:

1. **Firestore Security Rules (`firestore.rules`)**:
   - `rules_version = '2';` is declared at line 1.
   - Root helper functions `isAuthenticated()` (line 5) and `isOwner(userId)` (line 10) enforce `request.auth != null && request.auth.uid == userId`.
   - Path matches exist for:
     - `/users/{userId}` (line 15)
     - `/users/{userId}/recipes/{recipeId}` (line 19)
     - `/users/{userId}/mealPlans/{planId}` (line 24)
     - `/users/{userId}/cookingLog/{logId}` (line 29)
     - `/users/{userId}/shoppingLists/{listId}` (line 34)
     - `/users/{userId}/shoppingList/{itemId}` (line 38)
     - Default deny catch-all `match /{document=**} { allow read, write: if false; }` (line 44).

2. **Offline Font Safety & CDN Dependencies**:
   - Grep search for `next/font/google` and `fonts.googleapis.com` across `src/` yielded 0 matches.
   - `src/app/globals.css` (lines 51-53) defines local fallback fonts:
     ```css
     --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
     --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
     ```
   - `src/app/layout.tsx` imports only `./globals.css` with no remote `<link>` tags.

3. **React 19 Hooks and Listener Lifecycle**:
   - `src/hooks/useAuth.tsx` (lines 32-39): `useEffect` subscribes to `onAuthStateChanged` and returns `() => unsubscribe()`.
   - `src/hooks/useRecipes.ts` (lines 26-58): `useEffect` subscribes to `onSnapshot` on `/users/{uid}/recipes` and returns `() => unsubscribe()`. Lines 60-61 use `useMemo` to mask data to `[]` when `user` is null.
   - `src/hooks/useCookingLog.ts` (lines 16-53): `useEffect` subscribes to `onSnapshot` on `/users/{uid}/cookingLog` and returns `() => unsubscribe()`.
   - `src/hooks/useMealPlan.ts` (lines 33-87): `useEffect` maintains an `isMounted` flag to prevent state updates after unmount.
   - `src/app/(app)/extract/page.tsx` (lines 452-462): `<Suspense>` wraps `ExtractRecipeContent` which reads `useSearchParams()`.
   - `src/components/auth/AuthGuard.tsx` (lines 8-35): Renders `<Loader2>` spinner while `loading` is true and suppresses unauthenticated renders.

4. **ESLint Verification (`npm run lint`) Failure**:
   - Running `npm run lint` failed with **Exit code 1** and 3 errors:
     ```
     /Users/CLD/.gemini/antigravity/scratch/plateup/tests/tier2-boundary/f31-f40-boundary.test.ts
       330:30  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
       453:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

     /Users/CLD/.gemini/antigravity/scratch/plateup/tests/tier4-scenarios/real-world-scenarios.test.ts
       212:9   error  'list' is never reassigned. Use 'const' instead  prefer-const

     ✖ 14 problems (3 errors, 11 warnings)
     ```
   - This directly contradicts Worker M1's claim in `handoff.md` that `npm run lint` had exit code 0.

5. **Build Verification (`npm run build`) Discrepancy**:
   - Running `npm run build` (`next build` with Next.js 16.3.3 default Turbopack) failed with a Turbopack fatal panic (`Failed to write app endpoint /page: node process exited before we could connect to it with exit status: 0`).
   - Running `npx next build --webpack` compiles in 5.5s with **Exit code 0** and successfully outputs all 10 static and dynamic routes.

6. **Test Suite Verification**:
   - `npm test` executes 574 tests across 15 test files (including new `tests/adversarial-m1.test.ts`) with **100% pass (574/574, 0 failures)**.

---

## 2. Logic Chain

1. **Firestore Security Rules**:
   - All client data paths specified in `PROJECT.md` are protected by `isOwner(userId)`, ensuring complete data isolation between authenticated users and total rejection of unauthenticated access.
   - Both plural (`shoppingLists`) and singular (`shoppingList`) subcollections are matched.
   - The default catch-all denies access to any other paths, satisfying Firebase Security Rules Auditor criteria with a score of 5/5 for M1 scope.

2. **Offline Font Safety**:
   - Removal of `next/font/google` and adoption of CSS variable-based system UI stacks eliminates external font network requests during Next.js static page generation, ensuring build reproducibility in air-gapped/sandboxed environments.

3. **React 19 Hook Hygiene**:
   - All Firestore and Auth listeners implement complete unsubscription cleanups.
   - State masking via `useMemo` avoids data leakage across session switches.
   - Next.js 15/16 App Router Suspense requirements for search params are properly satisfied.

4. **Required Remediations**:
   - `npm run lint` must pass with 0 errors to satisfy the project quality gate. The 3 lint errors in test files must be fixed (`any` -> typed interfaces, `let` -> `const`).
   - `package.json` build script should be updated to `"build": "next build --webpack"` so `npm run build` completes reliably in sandboxed environments without Turbopack IPC worker crashes.

---

## 3. Caveats

- End-to-end integration of the Shopping List UI with live Firestore queries will be fully developed in Milestone 3; the security rules established in M1 are verified ready for M3.
- Browser-specific image decoding was tested using mock data URLs and standard file readers.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone 1 core feature logic, security rules, offline font handling, and React 19 hooks are fundamentally sound and pass 574/574 automated tests. However, two build/lint defects must be resolved before M1 sign-off:

1. **Fix 3 ESLint errors**:
   - `tests/tier2-boundary/f31-f40-boundary.test.ts` lines 330 and 453: Replace `any` with specific/unknown types.
   - `tests/tier4-scenarios/real-world-scenarios.test.ts` line 212: Change `let list` to `const list`.
2. **Update `package.json` build script**:
   - Change `"build": "next build"` to `"build": "next build --webpack"` so `npm run build` succeeds reliably in sandboxed CI/CD environments.

---

## 5. Verification Method

To verify after remediation:

1. **TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   # Expected: Exit code 0, 0 errors
   ```

2. **ESLint Verification**:
   ```bash
   npm run lint
   # Expected: Exit code 0, 0 errors
   ```

3. **Production Build**:
   ```bash
   npm run build
   # Expected: Exit code 0, all 10 routes compiled
   ```

4. **Test Suite**:
   ```bash
   npm test
   # Expected: 574/574 tests passing (Tiers 1-5)
   ```
