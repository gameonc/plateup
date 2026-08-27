# PlateUp Codebase Survey & Gap Analysis Report

**Date**: 2026-08-27  
**Explorer**: Teamwork Explorer Subagent  
**Project Root**: `/Users/CLD/.gemini/antigravity/scratch/plateup`  
**Authoritative Requirements**: `ORIGINAL_REQUEST.md`

---

## 1. Executive Summary

PlateUp is an AI-powered recipe extraction and smart meal planning web application built with **Next.js 16.3.3 (Turbopack)**, **React 19.2.8**, **Tailwind CSS v4**, **shadcn/ui (using @base-ui/react primitives)**, and **Firebase 12.18.0 (Auth, Firestore, and AI Logic via Gemini Developer API)**.

### Current Health Overview
- **TypeScript Compilation (`npx tsc --noEmit`)**: **0 Errors (PASS)**
- **Production Build (`npm run build`)**: **Compiled successfully in 2.6s (PASS)**
- **Linting (`npm run lint`)**: **13 Errors, 22 Warnings (FAIL)**
- **Feature Completion**:
  - Core flows (Auth, YouTube extraction, Photo extraction, Recipe collection, Weekly meal planner, Cooking log) exist and are mostly functional.
  - **Requirement R3 (Shopping List)** is **completely missing** (no route, no nav link, no aggregation logic, no Firestore schema or rules).
  - **Requirement R4 (Dietary Preferences & Recipe Filtering)** is **partially implemented** (recipes have basic freeform `tags`, but there is no user profile/settings UI for dietary preferences, no dietary category filtering in recipe catalog, no dietary awareness in the meal plan auto-fill algorithm, and no explicit dietary guidance in Gemini AI extraction prompts).
  - **UI/UX Polish (Requirement R2)** has theme inconsistencies (monochrome default tokens in `globals.css` vs. required warm orange/amber palette) and mobile viewport overlap issues on the recipe details action bar and missing mobile profile/logout menu.

---

## 2. Build, Compilation & Lint Status

### 2.1 TypeScript Compilation
- **Command**: `npx tsc --noEmit`
- **Result**: Exited with code `0`. Zero type errors across all `.ts` and `.tsx` files.
- **Config**: `tsconfig.json` target `ES2017`, `strict: true`, path alias `@/* -> ./src/*`.

### 2.2 Next.js Build
- **Command**: `npm run build`
- **Result**: Successfully compiled in 2.6s.
- **Routes Generated**:
  - `○ /` (Static - Landing Page)
  - `○ /_not-found` (Static)
  - `ƒ /api/youtube-recipe` (Dynamic Route Handler)
  - `○ /dashboard` (Static - Authenticated Dashboard)
  - `○ /extract` (Static - Recipe Extraction)
  - `○ /login` (Static - Sign In / Sign Up)
  - `○ /meal-plan` (Static - Weekly Planner)
  - `○ /recipes` (Static - Recipe Catalog)
  - `ƒ /recipes/[id]` (Dynamic - Recipe Detail)

### 2.3 ESLint Diagnostics (`npm run lint`)
ESLint found **13 errors and 22 warnings**:
1. **`react-hooks/set-state-in-effect` (Cascading render errors)**:
   - `src/hooks/useRecipes.ts:28:7`: Calling `setRecipes([])` directly in `useEffect` when `!user`.
   - `src/hooks/useCookingLog.ts:18:7`: Calling `setLogs([])` directly in `useEffect` when `!user`.
2. **`react/no-unescaped-entities`**:
   - `src/app/page.tsx:108:92`: Unescaped double quotes `"` in JSX.
   - `src/app/(app)/recipes/[id]/page.tsx:280:63`: Unescaped double quotes in modal prompt.
3. **`@typescript-eslint/ban-ts-comment`**:
   - `src/app/layout.tsx:32:12`: `@ts-ignore` used above `<Toaster />`.
   - `src/app/login/page.tsx:12:1`: `@ts-ignore` used above FirebaseError import.
4. **`@typescript-eslint/no-explicit-any`**:
   - `src/app/login/page.tsx:31:33`: `handleAuthError(err: any)`.
   - `src/app/api/youtube-recipe/route.ts:28:19`: `catch (error: any)`.
5. **`prefer-const`**:
   - `src/app/(app)/recipes/page.tsx:22:9`: `let filtered = ...` should be `const`.
   - `src/lib/meal-planner.ts:70:11`: `let validRecipes = ...` should be `const`.
6. **Unused Variables**:
   - `src/components/layout/Navbar.tsx`: Unused `Button`.
   - `src/app/(app)/recipes/page.tsx`: Unused `CardFooter`, `CardHeader`, `Recipe`.
   - `src/app/login/page.tsx`: Unused `CardDescription`, `CardFooter`, `CardTitle`, `FirebaseError`.
   - `src/lib/meal-planner.ts`: Unused `MealSlot`, `DayMeals`, `repeatWindowDays`.
   - `src/lib/extract-recipe.ts`: Unused `error` in catch blocks.

---

## 3. Architecture & Dependency Breakdown

### Dependencies Matrix (`package.json`)
| Package | Version | Purpose | Notes |
|---|---|---|---|
| `next` | `16.3.3` | App Router framework | Next.js 16 with Turbopack |
| `react` / `react-dom` | `19.2.8` | UI Library | React 19 compiler & hooks rules |
| `firebase` | `^12.18.0` | Backend services | Auth, Firestore, and AI Logic (`firebase/ai`) |
| `tailwindcss` | `^4` | Utility styling | Tailwind v4 with `@tailwindcss/postcss` |
| `@base-ui/react` | `^1.7.0` | Headless UI primitives | Backing for shadcn/ui components |
| `class-variance-authority` | `^0.7.1` | Component variant styling | Button, Badge, Tabs variants |
| `clsx` / `tailwind-merge` | `^2.1.1` / `^3.6.0` | CSS utility class combiner | Used in `cn()` |
| `date-fns` | `^4.4.0` | Date manipulation | Used in meal planner & logs |
| `lucide-react` | `^1.34.0` | Iconography | Modern icon suite |
| `youtubei.js` | `^18.0.0` | YouTube metadata & transcript scraper | Server-side API route helper |

### Directory Structure & Roles
```
src/
├── app/
│   ├── (app)/                       # Authenticated layout group
│   │   ├── layout.tsx               # App layout: AuthGuard + Navbar + Main
│   │   ├── dashboard/page.tsx       # Main dashboard: stats, today's menu, quick actions
│   │   ├── extract/page.tsx         # YouTube & Photo AI extraction
│   │   ├── meal-plan/page.tsx       # 7-day x 3-meal weekly planner + auto-fill
│   │   ├── recipes/
│   │   │   ├── page.tsx             # Recipe catalog: search, sort, cards
│   │   │   └── [id]/page.tsx        # Recipe detail: ingredients, steps, notes, I Made This
│   │   └── [MISSING: shopping-list] # Requirement R3
│   │   └── [MISSING: settings]      # Requirement R4
│   ├── api/
│   │   └── youtube-recipe/route.ts  # POST endpoint extracting video transcript/metadata
│   ├── globals.css                  # Tailwind v4 theme & base styles
│   ├── layout.tsx                   # Root layout with Geist font, AuthProvider, Toaster
│   ├── login/page.tsx               # Email/Password + Google popup sign-in/up
│   └── page.tsx                     # Landing page with hero, features, CTA
├── components/
│   ├── auth/AuthGuard.tsx           # Client-side route protection & auth loading state
│   ├── layout/Navbar.tsx            # Desktop top navigation & mobile bottom navigation
│   ├── recipe/RecipePreview.tsx     # Extracted recipe preview card with save action
│   └── ui/                          # shadcn UI components based on @base-ui/react
├── hooks/
│   ├── useAuth.tsx                  # Firebase auth state, sign-in/up/Google, user profile
│   ├── useCookingLog.ts             # Firestore cookingLog subcollection query & history
│   ├── useMealPlan.ts               # Firestore mealPlans subcollection fetch & update
│   └── useRecipes.ts                # Firestore recipes CRUD, rating, lastMadeAt
├── lib/
│   ├── ai.ts                        # Firebase AI Logic setup, recipe schema, prompt templates
│   ├── extract-recipe.ts            # Client helpers calling Gemini for transcript & image
│   ├── firebase.ts                  # Firebase app, auth, db, ai initialization
│   ├── meal-planner.ts              # Meal plan auto-fill algorithm with tag/difficulty rules
│   ├── utils.ts                     # cn() helper
│   └── youtube.ts                   # InnerTube client fetching transcripts & thumbnails
└── types/
    └── index.ts                     # TypeScript interfaces (Recipe, MealPlan, UserProfile, etc.)
```

---

## 4. Firebase Integration Audit

### 4.1 Firebase Authentication
- **Location**: `src/hooks/useAuth.tsx`
- **Supported Methods**:
  1. `signInWithEmailAndPassword(auth, email, password)`
  2. `createUserWithEmailAndPassword(auth, email, password)` with `updateProfile(displayName)`
  3. `signInWithPopup(auth, GoogleAuthProvider)`
- **Profile Initialization**:
  - `createUserProfile` initializes `users/{userId}` with `{ uid, email, displayName, createdAt, preferences }`.
  - **Gap**: Default profile preferences currently only contain `{ repeatWindowDays: 5, mealsPerDay: [...] }`. Dietary preferences (e.g. `dietaryPreferences: string[]`) are **not initialized or exposed**.

### 4.2 Cloud Firestore Architecture
- **Config**: `.env.local` contains all standard `NEXT_PUBLIC_FIREBASE_*` credentials for project `plateup-ai-2026`.
- **Collection Structure**:
  ```
  users/{userId}
    ├── recipes/{recipeId}
    │     ├── name, description, source, sourceUrl, thumbnailUrl
    │     ├── prepTimeMinutes, cookTimeMinutes, servings, difficulty
    │     ├── tags (string[]), ingredients ({item, amount, unit}[]), instructions (string[])
    │     ├── rating (1-5), notes, timesMade, lastMadeAt, createdAt, updatedAt
    ├── mealPlans/{weekId}           # e.g. "2026-W35"
    │     ├── weekStart, createdAt
    │     └── meals { monday: { breakfast, lunch, dinner }, ... }
    ├── cookingLog/{logId}
    │     ├── recipeId, recipeName, cookedAt, rating
    └── [MISSING] shoppingList / shoppingLists
  ```

### 4.3 Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
      match /recipes/{recipeId} { allow read, write: if isOwner(userId); }
      match /mealPlans/{planId} { allow read, write: if isOwner(userId); }
      match /cookingLog/{logId} { allow read, write: if isOwner(userId); }
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```
- **Audit Findings**:
  - Security rules enforce strict user-level data isolation (`request.auth.uid == userId`).
  - **Gap**: When the **Shopping List** feature is added, `match /shoppingList/{itemId}` or `match /shoppingLists/{listId}` must be explicitly added to `firestore.rules`, otherwise client read/write operations will be denied by default.

### 4.4 Firestore Indexes (`firestore.indexes.json`)
- Includes composite index on `recipes` (`rating DESC`, `createdAt DESC`) and `cookingLog` (`cookedAt DESC`).

### 4.5 Firebase AI Logic Integration (`firebase/ai`)
- **Initialization**: `src/lib/firebase.ts` calls `getAI(app, { backend: new GoogleAIBackend() })`.
- **Model**: `src/lib/ai.ts` configures `recipeModel` with `model: 'gemini-2.5-flash'` and `generationConfig: { responseMimeType: 'application/json', responseSchema: recipeSchema, temperature: 0.3 }`.
- **Structured Schema**: Defines `recipeSchema` ensuring type-safe JSON returns (name, prepTimeMinutes, cookTimeMinutes, servings, difficulty, tags, ingredients, instructions).
- **Prompt Review**:
  - `YOUTUBE_RECIPE_PROMPT` & `IMAGE_RECIPE_PROMPT`: Currently only ask for generic tags. They need explicit instructions to automatically detect and tag standard dietary attributes (`Vegetarian`, `Vegan`, `Gluten-Free`, `Dairy-Free`, `Keto`, `Low-Carb`, `Pescatarian`, `Nut-Free`).

---

## 5. Detailed Component & Page Audit

### 5.1 Landing Page (`src/app/page.tsx`)
- **Status**: Functional and visually appealing.
- **Issues**:
  - ESLint unescaped quotes on line 108.
  - Buttons use hardcoded `bg-amber-600` while app theme tokens are inconsistent.

### 5.2 Login / Auth Page (`src/app/login/page.tsx`)
- **Status**: Functional email/password and Google login with comprehensive error handling.
- **Issues**:
  - Contains `@ts-ignore` and unused imports.
  - Form validation is functional.

### 5.3 Navigation (`src/components/layout/Navbar.tsx`)
- **Status**: Split desktop top bar and mobile bottom bar.
- **Issues**:
  - **Missing Shopping List**: `navItems` does not contain Shopping List.
  - **Mobile Logout / Profile Missing**: The user avatar and logout dropdown are only rendered in the desktop nav (`hidden md:flex`). Mobile users cannot access their profile, dietary settings, or sign out.

### 5.4 Dashboard (`src/app/(app)/dashboard/page.tsx`)
- **Status**: Displays greeting, quick action cards, Today's Menu, recently added recipes, and 3 stats cards.
- **Issues**:
  - "Snap a Photo" card links to `/extract?tab=photo`, but `extract/page.tsx` does not read `tab` query parameters.
  - If a meal slot is assigned in the meal plan but the recipe is still loading or missing, the card falls back to "No meal planned" instead of displaying slot info or a skeleton loader.

### 5.5 Recipe Catalog (`src/app/(app)/recipes/page.tsx`)
- **Status**: Search by name/tag and sort by newest, highest-rated, most-made, recently-made.
- **Issues**:
  - **Missing Dietary Filter**: There are no dietary category filter pills/chips (Requirement R4).
  - Unused imports and `prefer-const` lint errors.

### 5.6 Recipe Details (`src/app/(app)/recipes/[id]/page.tsx`)
- **Status**: Displays recipe thumbnail, metadata, rating stars, personal notes textarea, interactive ingredient checkboxes, step-by-step instructions, delete dialog, and "I Made This!" button.
- **Issues**:
  - **Mobile Viewport Bug**: Fixed bottom action bar (`z-10`) is overlapped by the fixed mobile bottom navigation (`z-50`).
  - ESLint unescaped quote in delete confirmation dialog.

### 5.7 Recipe Extraction (`src/app/(app)/extract/page.tsx`)
- **Status**: Dual tabs for YouTube URL extraction and Photo upload/camera.
- **Issues**:
  - **Bug: Image Thumbnail Not Saved**: When saving an image-extracted recipe, `thumbnailUrl` is not set from `selectedImage` (only `youtube` sets `thumbnailUrl`).
  - **Bug: Query Param Ignored**: Does not read `useSearchParams()` for `?tab=photo`.
  - **Error Feedback**: If `addRecipe` fails during save, no error alert or toast is presented to the user.

### 5.8 Weekly Meal Planner (`src/app/(app)/meal-plan/page.tsx` & `src/lib/meal-planner.ts`)
- **Status**: 7 days x 3 meals grid with week switcher, manual recipe picker modal, "Clear All", and "Auto-Fill Week".
- **Issues**:
  - **Missing Dietary Preference in Auto-Fill**: `generateMealPlan` does not filter candidate recipes against user dietary preferences.
  - Mobile responsiveness: 7-day grid on narrow screens (375px) renders in a single vertical column. Adding day selector tabs or day pill filter would significantly improve mobile usability.

---

## 6. Bugs, Functional Gaps & Edge Cases Matrix

| ID | Location | Description | Severity | Recommended Fix |
|---|---|---|---|---|
| **BUG-01** | `src/app/(app)/extract/page.tsx:163` | Recipe extracted from Photo does not save `thumbnailUrl` to Firestore (`thumbnailUrl` is undefined). | **High** | Set `thumbnailUrl: currentSource === 'image' ? selectedImage : thumbnailUrl` when saving. |
| **BUG-02** | `src/app/(app)/extract/page.tsx:200` | Ignores `?tab=photo` URL query parameter from Dashboard quick action link. | **Medium** | Wrap tabs with `useSearchParams()` or initialize active tab from search params. |
| **BUG-03** | `src/app/(app)/recipes/[id]/page.tsx:270` | Fixed bottom action bar on mobile (`z-10`) is overlapped by the mobile bottom navigation bar (`z-50`). | **High** | Add bottom padding (`bottom-16` / `pb-20`) on mobile or relocate actions above nav bar. |
| **BUG-04** | `src/components/layout/Navbar.tsx:63` | User profile avatar and Logout dropdown menu are missing on mobile viewport. | **Medium** | Add user profile / logout button to mobile header or navigation bar. |
| **BUG-05** | `src/app/globals.css:58` | Dark/monochrome primary theme (`--primary: oklch(0.205 0 0)`) conflicts with required warm orange/amber palette (R2). | **Medium** | Update CSS variables to warm orange/amber primary (`oklch(0.65 0.22 45)`) and consistent accents. |
| **GAP-01** | `src/app/(app)/shopping-list/page.tsx` (missing) | Requirement R3: Missing Shopping List page, navigation link, Firestore storage, and ingredient aggregation logic. | **Critical** | Implement `shopping-list` route, aggregation utility (combining quantities and units), and Firestore persistence. |
| **GAP-02** | `firestore.rules` | Firestore security rules do not include `shoppingList` / `shoppingLists` subcollection under `users/{userId}`. | **High** | Add `match /shoppingList/{itemId}` or `match /shoppingLists/{listId}` with `allow read, write: if isOwner(userId)`. |
| **GAP-03** | `src/app/(app)/profile/page.tsx` or `settings` | Requirement R4: Missing settings/profile area to view and update dietary preferences (Vegetarian, Vegan, Gluten-Free, etc.). | **High** | Add Profile / Settings modal or page allowing users to toggle dietary preferences saved in `users/{userId}`. |
| **GAP-04** | `src/app/(app)/recipes/page.tsx` | Requirement R4: Recipe collection cannot be filtered by dietary category tags. | **High** | Add dietary filter chips (e.g., All, Vegetarian, Vegan, Gluten-Free, Keto, etc.) to the search bar. |
| **GAP-05** | `src/lib/meal-planner.ts:21` | Requirement R4: Auto-Fill meal plan algorithm does not consider or filter by user dietary preferences. | **High** | Pass `dietaryPreferences` to `generateMealPlan` and prioritize/filter matching recipes. |
| **GAP-06** | `src/lib/ai.ts:48-70` | Requirement R4: Gemini extraction prompts do not explicitly instruct model to detect and assign standard dietary tags. | **Medium** | Enhance prompt templates to identify and tag dietary categories (`Vegetarian`, `Vegan`, `Gluten-Free`, `Dairy-Free`, `Keto`, `Pescatarian`, etc.). |
| **LINT-01** | `src/hooks/useRecipes.ts:28`, `useCookingLog.ts:18` | React 19 / ESLint `react-hooks/set-state-in-effect` errors triggered by setting state directly in effect body. | **Medium** | Guard state updates using subscription callbacks or ref-based synchronization. |
| **LINT-02** | `src/app/page.tsx`, `recipes/[id]/page.tsx` | Unescaped JSX quote entities (`"`) causing ESLint build warnings/errors. | **Low** | Replace with `&quot;` or `&apos;`. |
| **LINT-03** | `src/app/layout.tsx`, `login/page.tsx` | `@ts-ignore` comments and `any` types causing ESLint errors. | **Low** | Replace with proper TypeScript types and remove `@ts-ignore`. |
| **EDGE-01** | `src/lib/extract-recipe.ts:33` | AI response JSON parsing could fail if Gemini outputs surrounding markdown code blocks (` ```json `). | **Medium** | Add sanitization step to strip markdown code blocks before `JSON.parse`. |
| **EDGE-02** | `src/app/(app)/extract/page.tsx:153` | Recipe save action lacks user-facing error toast/banner if Firestore write fails. | **Low** | Add error state and toast notification on save failure. |

---

## 7. Implementation Roadmap & Blueprint

### Phase 1: Core Bug Fixes & Code Health
1. Fix ESLint errors (`react-hooks/set-state-in-effect`, unescaped entities, unused imports, `@ts-ignore`, explicit types).
2. Fix photo recipe thumbnail persistence (`extract/page.tsx`).
3. Fix query parameter handling (`extract/page.tsx?tab=photo`).
4. Fix mobile viewport bottom bar overlap on `recipes/[id]/page.tsx`.
5. Add mobile profile / logout button to navigation.
6. Add robust JSON markdown stripping to AI recipe extractors.

### Phase 2: Theme Polish & UI/UX Enhancement (Requirement R2)
1. Update `globals.css` with warm food-app theme tokens:
   - Primary: Amber/Orange (`oklch(0.65 0.22 45)`)
   - Accent: Warm gold/amber
   - Backgrounds: Warm stone (`bg-stone-50`)
2. Standardize button hover effects, loading skeletons, and empty state illustrations.
3. Verify mobile responsiveness at 375px width and desktop at 1440px width across all pages.

### Phase 3: Shopping List Feature (Requirement R3)
1. Create `src/lib/shopping-list.ts`:
   - Ingredient aggregator combining amounts and units across all planned meals for the selected week.
   - Intelligent quantity aggregation (e.g. `2 cloves garlic` + `3 cloves garlic` = `5 cloves garlic`, `1 cup` + `0.5 cup` = `1.5 cup`).
2. Create `src/hooks/useShoppingList.ts`:
   - Firestore hook syncing shopping list items (`item`, `amount`, `unit`, `checked`, `category`, `weekId`) at `users/{userId}/shoppingLists/{weekId}`.
3. Create `src/app/(app)/shopping-list/page.tsx`:
   - UI with "Generate from Meal Plan", categorized ingredient checklists (Produce, Dairy, Meat, Pantry, Spices), manual add item, clear completed, and progress bar.
4. Update `Navbar.tsx` (desktop and mobile) to include the Shopping List navigation item.
5. Update `firestore.rules` to allow `match /shoppingLists/{listId}` and `match /shoppingList/{itemId}` for authenticated owners.

### Phase 4: Dietary Preferences & Filtering (Requirement R4)
1. Update `src/types/index.ts`:
   - Add `dietaryPreferences: string[]` to `UserPreferences` and `UserProfile`.
   - Define standard dietary categories: `['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb', 'Pescatarian', 'Nut-Free']`.
2. Create Settings/Profile page or dialog (`src/app/(app)/settings/page.tsx` or modal):
   - Toggle buttons/checkboxes for dietary preferences, syncing with `users/{userId}` doc.
3. Update `src/app/(app)/recipes/page.tsx`:
   - Add dietary category filter pills along with search and sort.
4. Update `src/lib/meal-planner.ts`:
   - Auto-fill algorithm respects user dietary preferences when selecting candidate recipes.
5. Update `src/lib/ai.ts`:
   - Improve Gemini prompts to automatically detect and assign dietary category tags.

### Phase 5: Verification & Quality Assurance
1. Run `npx tsc --noEmit` -> Must pass with 0 errors.
2. Run `npm run build` -> Must pass with 0 errors.
3. Run `npm run lint` -> Must pass with 0 errors.
4. Verify all acceptance criteria from `ORIGINAL_REQUEST.md`.
