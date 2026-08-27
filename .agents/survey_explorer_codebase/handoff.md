# Handoff Report — PlateUp Codebase Investigation

**Date**: 2026-08-27  
**Agent**: survey_explorer_codebase (Explorer)  
**Task**: Comprehensive survey and audit of the PlateUp codebase  
**Target File**: `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/survey_explorer_codebase/survey_codebase.md`

---

## 1. Observation

### Build and Compilation
- `npx tsc --noEmit` exited with code `0` (zero TypeScript compilation errors).
- `npm run build` compiled successfully in 2.6s with code `0`. All 9 routes (`/`, `/_not-found`, `/api/youtube-recipe`, `/dashboard`, `/extract`, `/login`, `/meal-plan`, `/recipes`, `/recipes/[id]`) compiled into static/dynamic endpoints.
- `npm run lint` exited with code `1` showing 13 errors and 22 warnings across `src/hooks/useRecipes.ts`, `src/hooks/useCookingLog.ts`, `src/app/page.tsx`, `src/app/(app)/recipes/[id]/page.tsx`, `src/app/layout.tsx`, `src/app/login/page.tsx`, `src/app/api/youtube-recipe/route.ts`, and `src/lib/meal-planner.ts`.

### Dependencies & Setup
- Next.js `16.3.3`, React `19.2.8`, Firebase `^12.18.0`, Tailwind CSS `^4`, `@base-ui/react` `^1.7.0`, `date-fns` `^4.4.0`, `youtubei.js` `^18.0.0`.
- Firebase config initialized with Auth, Firestore, and AI Logic (`firebase/ai` with `GoogleAIBackend` and Gemini Developer API).

### Direct Code Observations
1. **Photo Thumbnail Persistence (`src/app/(app)/extract/page.tsx:163`)**:
   `thumbnailUrl` is only populated when `currentSource === 'youtube'`. For image extraction (`currentSource === 'image'`), `thumbnailUrl` is set to `undefined`, so saved photo recipes have no thumbnail image in Firestore.
2. **Dashboard Query Param Disconnect (`src/app/(app)/dashboard/page.tsx:89` vs `src/app/(app)/extract/page.tsx:200`)**:
   Dashboard links to `/extract?tab=photo`, but `extract/page.tsx` uses `<Tabs defaultValue="youtube">` without reading `searchParams`, ignoring the tab param.
3. **Mobile Layout Z-Index Overlap (`src/app/(app)/recipes/[id]/page.tsx:270` vs `src/components/layout/Navbar.tsx:95`)**:
   `RecipeDetailPage` has a fixed bottom action bar at `z-10`, while `Navbar.tsx` has a fixed bottom navigation bar at `z-50`, overlapping the "I Made This" button on mobile viewports.
4. **Mobile Navigation Missing User Actions (`src/components/layout/Navbar.tsx:63`)**:
   The user Avatar and Logout dropdown are only rendered inside the desktop navigation wrapper (`hidden md:flex`), leaving mobile users with no way to access profile/logout.
5. **Theme Mismatch (`src/app/globals.css:58`)**:
   `--primary` is set to monochrome black (`oklch(0.205 0 0)`), violating Requirement R2's warm orange/amber theme specification.
6. **Missing Shopping List (`ORIGINAL_REQUEST.md` R3)**:
   No route `src/app/(app)/shopping-list`, no navigation link, no ingredient aggregation logic, and no Firestore security rules for `users/{userId}/shoppingLists`.
7. **Missing Dietary Preferences (`ORIGINAL_REQUEST.md` R4)**:
   No settings/profile UI to select dietary preferences, no dietary category filter pills on `/recipes`, no dietary filtering in `generateMealPlan` auto-fill algorithm, and no dietary guidance in AI prompts.

---

## 2. Logic Chain

1. **Build Health**: Since `npx tsc --noEmit` and `npm run build` succeed, the current codebase has sound type definitions and valid imports.
2. **Runtime UX Gaps**: Because `extract/page.tsx` omits `selectedImage` from `thumbnailUrl`, users who upload food photos see broken/missing images across the dashboard, recipe catalog, and meal plan.
3. **Mobile Usability**: Because the mobile bottom navigation bar has `z-50` at `bottom-0` and `recipes/[id]/page.tsx` fixed actions have `z-10` at `bottom-0`, on mobile devices the "I Made This!" and "Delete Recipe" buttons are obstructed.
4. **Missing R3 / R4**: Comparing the authoritative requirements in `ORIGINAL_REQUEST.md` with the file tree confirms that the Shopping List feature (R3) and Dietary Preferences & Filtering (R4) must be newly developed and integrated into the existing architecture.
5. **Security & Rules**: Adding Shopping List requires updating `firestore.rules` to permit authenticated owners to read and write `users/{userId}/shoppingLists/{listId}` and `users/{userId}/shoppingList/{itemId}`.

---

## 3. Caveats

- **Firebase AI Logic in Production / Sandbox**: Client-side calls to Firebase AI Logic (`firebase/ai`) require valid network access to Google AI Developer API and an authorized Firebase project.
- **YouTube InnerTube Scraper**: `youtubei.js` runs in the Next.js Route Handler (`/api/youtube-recipe`). Videos without transcripts will fall back to description or return 404.
- **Dietary Categories**: A standardized set of dietary categories (`Vegetarian`, `Vegan`, `Gluten-Free`, `Dairy-Free`, `Keto`, `Low-Carb`, `Pescatarian`, `Nut-Free`) should be used consistently across types, AI prompts, user profile, and filtering UI.

---

## 4. Conclusion

The PlateUp codebase is well-structured with modern Next.js 16 + React 19 + Firebase primitives, but requires:
1. **Bug fixes**: Photo recipe thumbnail persistence, `?tab=photo` parameter reading, mobile bottom bar z-index overlap, mobile user profile/logout navigation, and ESLint rule compliance.
2. **UI Theme Polish**: Unifying the application theme with a warm orange/amber palette.
3. **Shopping List Feature (R3)**: Complete implementation of grocery aggregation, checklist UI, Firestore hook, and security rules.
4. **Dietary Preferences & Filtering (R4)**: User profile dietary toggles, recipe catalog category filters, auto-fill dietary filtering, and prompt enhancements.

The complete survey report is documented in `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/survey_explorer_codebase/survey_codebase.md`.

---

## 5. Verification Method

To verify these findings independently:
1. **Typecheck**: Run `npx tsc --noEmit` in `/Users/CLD/.gemini/antigravity/scratch/plateup`.
2. **Build**: Run `npm run build` (with `BypassSandbox: true` if running Turbopack).
3. **Lint**: Run `npm run lint` to inspect the 13 reported ESLint errors.
4. **Inspect Source Files**:
   - `src/app/(app)/extract/page.tsx` line 163 (missing image thumbnail).
   - `src/app/(app)/recipes/[id]/page.tsx` line 270 vs `src/components/layout/Navbar.tsx` line 95 (mobile z-index overlap).
   - `src/components/layout/Navbar.tsx` lines 19-24 & 63-90 (missing shopping list nav & mobile user menu).
   - `src/app/globals.css` line 58 (black primary theme token).
   - `firestore.rules` lines 18-32 (missing shopping list match rule).
