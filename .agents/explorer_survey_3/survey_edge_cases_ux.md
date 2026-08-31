# Comprehensive Survey: Edge Cases, UI/UX, Accessibility & Mobile Responsiveness

**Project**: PlateUp — AI-Powered Recipe Extraction & Smart Meal Planner  
**Date**: 2026-08-30  
**Auditor**: Explorer 3  
**Working Directory**: `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/explorer_survey_3`  
**Report File**: `survey_edge_cases_ux.md`  

---

## Executive Summary

PlateUp has undergone an in-depth code audit across all 10 target survey dimensions:
1. **Empty States & First-Time User Experience**
2. **Invalid Input & Edge Case Handling** (YouTube URLs, non-cooking videos, non-image files, large uploads)
3. **Freemium & Pro Quota Limits** (5 extraction limit, Stripe integration, Pro perks)
4. **Servings Adjuster & Fraction Scaling Logic**
5. **Search & Dietary Filter Zero-Match Handling**
6. **Double-Clicking Prevention on Action Buttons**
7. **Network & Offline Error Handling Across Client & API Routes**
8. **Auth Protection on Private Routes & Deep-Link 404s**
9. **Accessibility (a11y) & UX Polish** (alt text, aria-labels, contrast, focus rings, loading skeletons)
10. **Mobile Responsiveness at 375px Viewport Width**

All 1,057 test cases in the test suite pass, and `npx tsc --noEmit` and `npm run build` succeed with zero errors. This report documents verified implementations, observations with exact line numbers, logic chains, identified edge-case caveats, and actionable recommendations.

---

## Survey Findings by Area

### 1. Empty States Across All Pages

| Page / Component | Condition | Implemented Empty State UI | File & Line Reference | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** (`/dashboard`) | No meal planned today | Card displays "No meal planned" with "+ Add Meal" CTA button linking to `/meal-plan`. | `src/app/(app)/dashboard/page.tsx:174-183` | Verified ✅ |
| **Dashboard** (`/dashboard`) | No recipes saved | "Recently Added" section displays "No recipes added yet." with "Extract your first recipe" CTA button linking to `/extract`. | `src/app/(app)/dashboard/page.tsx:231-238` | Verified ✅ |
| **Dashboard** (`/dashboard`) | New user stats | Stats display `0` for total recipes, meals planned, and cooked this month without crashing or NaN. | `src/app/(app)/dashboard/page.tsx:253,265,277` | Verified ✅ |
| **Recipes** (`/recipes`) | Global 0 recipes | Dashed card with Sparkles icon, "No recipes yet", description, and "Extract Your First Recipe" CTA button. | `src/app/(app)/recipes/page.tsx:128-142` | Verified ✅ |
| **Recipes** (`/recipes`) | 0 search / filter matches | Zap icon, "No recipes found matching your filters", "Clear All Filters" button, and "Reset filters" quick link. | `src/app/(app)/recipes/page.tsx:227-246` | Verified ✅ |
| **Meal Plan** (`/meal-plan`) | Empty meal slots | Dashed card with `Plus` icon and "Add Meal" button that launches the recipe picker dialog. | `src/app/(app)/meal-plan/page.tsx:317-325` | Verified ✅ |
| **Meal Plan** (`/meal-plan`) | Auto-Fill with 0 recipes | Triggers warning toast: *"No Recipes Available: Save some recipes first to auto-fill your meal plan."* | `src/app/(app)/meal-plan/page.tsx:145-151` | Verified ✅ |
| **Meal Plan** (`/meal-plan`) | Auto-Fill with 0 compliant recipes | Triggers warning toast: *"No Compliant Recipes Found: You have active dietary restrictions (...), but no saved recipes match."* | `src/app/(app)/meal-plan/page.tsx:154-173` | Verified ✅ |
| **Meal Plan Picker** | My Recipes tab empty | ChefHat icon, "No saved recipes found.", and "Browse Discover recipes →" button that switches tab to Discover. | `src/app/(app)/meal-plan/page.tsx:569-581` | Verified ✅ |
| **Meal Plan Picker** | Discover tab 0 matches | ChefHat icon, "No recipes found. Try a different search." | `src/app/(app)/meal-plan/page.tsx:641-646` | Verified ✅ |
| **Shopping List** (`/shopping-list`) | Empty list | Dashed card with ShoppingBag icon, "Your shopping list is empty", with "Generate from Meal Plan" and "View Meal Planner" buttons. | `src/app/(app)/shopping-list/page.tsx:371-405` | Verified ✅ |
| **Shopping List** (`/shopping-list`) | 0 remaining / completed | Dynamic message: *"🎉 All items are checked off! Great shopping trip."* or *"No completed items yet. Check off items as you shop!"* | `src/app/(app)/shopping-list/page.tsx:408-414` | Verified ✅ |
| **Shopping List** (`/shopping-list`) | Generate from empty meal plan | Info toast: *"No Meals Planned: Your current meal plan has no recipes assigned."* | `src/app/(app)/shopping-list/page.tsx:104-110` | Verified ✅ |
| **Discover** (`/discover`) | 0 search results | Search icon, "No recipes found", and "Show Random Recipes" button calling `handleShuffle`. | `src/app/(app)/discover/page.tsx:282-293` | Verified ✅ |
| **Profile** (`/profile`) | New user state | Displays default profile (name 'Chef' or auth name, 0 active restrictions with explanatory caption, 5-day default repeat window). | `src/app/(app)/profile/page.tsx:494-496` | Verified ✅ |

---

### 2. Invalid Input & Edge Case Handling

#### A. Invalid YouTube URLs
- **Client-side**: `handleYoutubeUrlChange` validates URLs against `YOUTUBE_REGEX` (`/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([-\w]{11})/`) (`src/app/(app)/extract/page.tsx:26,59-75`).
  - If invalid, sets `youtubeVideoId = null`, displays inline error *"Please enter a valid YouTube URL"* with `AlertCircle` icon, and disables the "Extract Recipe" button (`src/app/(app)/extract/page.tsx:296`).
- **Server-side**: `POST /api/youtube-recipe` checks `!url || typeof url !== 'string'` (returns HTTP 400 `{ error: 'Valid YouTube URL is required' }`) and `extractVideoId(url)` (returns HTTP 400 `{ error: 'Invalid YouTube URL. Could not parse video ID.' }`) (`src/app/api/youtube-recipe/route.ts:9-23`).

#### B. Non-Cooking YouTube Videos
- `extractYouTubeData` in `src/lib/youtube.ts:120-150` scrapes/fetches video metadata.
- `hasRecipeSignal(text)` checks for culinary measurement keywords (`cups`, `tbsp`, `tsp`, `oz`, `lbs`, `cloves`, `grams`, `ml`, `sticks`, `pints`, `quarts`).
- When description lacks recipe signal or produces a thin extraction (`isThinRecipe`: < 3 ingredients or 0 instructions), `extractRecipeFromYouTube` escalates to Gemini video analysis (`src/lib/extract-recipe.ts:149-181`).
- `TRANSCRIPT_RECIPE_PROMPT` instructs Gemini: *"If the transcript does not contain a cooking recipe, still try to identify any food or dish mentioned and provide a reasonable recipe for it."* (`src/lib/ai-server.ts:80`).
- If Gemini cannot extract a recipe or returns non-JSON, `POST /api/extract-recipe` catches the parse error and returns HTTP 500 `{ error: 'Failed to parse the recipe from the AI response.' }` (`src/app/api/extract-recipe/route.ts:65-68`).
- The client receives this error and displays it in a red error alert box (`src/app/(app)/extract/page.tsx:110,313-317`).

#### C. Non-Image File Uploads
- File input uses `accept="image/*"` (`src/app/(app)/extract/page.tsx:380,401`).
- In `extractRecipeFromImage` (`src/lib/extract-recipe.ts:124-132`), `if (!mimeType.startsWith('image/'))` throws `'Invalid file type. Please provide an image.'`.
- In `POST /api/extract-recipe` (`src/app/api/extract-recipe/route.ts:37-39`), `if (!imageBase64 || !mimeType)` returns HTTP 400 `{ error: 'Image data and MIME type are required' }`.

#### D. Large File Uploads (Identified Edge Case / Improvement)
- In `src/app/(app)/extract/page.tsx:117-130`, `FileReader.readAsDataURL(file)` converts any selected image directly to base64.
- **Finding**: There is no client-side file size guard (e.g. max 4MB) or client-side canvas downscaling. If a user uploads a high-resolution 12MB+ photo or HEIC image from an iPhone, the resulting base64 string (>16MB) will exceed the serverless payload limit (4.5MB on Vercel), resulting in HTTP 413 or fetch failure.
- **Recommendation**: Add a 4.5MB client-side check with an informative error toast or canvas downscaling before sending base64 to `/api/extract-recipe`.

---

### 3. Free User vs Pro Limits & Monetization

#### A. 5 Extractions Monthly Quota
- Defined in `src/lib/usage.ts:4` via `FREE_TIER_MONTHLY_LIMIT = 5`.
- `getExtractionUsage(profile, currentDate)` computes:
  - Current calendar month key: `getCurrentMonthKey()` (e.g., `'2026-08'`).
  - Automatic month rollover: If profile's `extractionMonth !== currentMonthKey`, usage resets to 0 with 5 remaining.
  - Quota calculation: `used = profile.extractionsThisMonth`, `remaining = Math.max(0, 5 - used)`, `isLimitReached = remaining <= 0`.
- Atomic Firestore increment in `recordExtractionUsage(userId)` uses `runTransaction(db, ...)` (`src/lib/usage.ts:70-125`) to prevent concurrent extraction race conditions.

#### B. Upgrade Prompts & Quota Enforcement
- In `src/app/(app)/extract/page.tsx:80-87,135-142`, client checks `if (isLimitReached && plan !== 'pro')` and displays a warning toast.
- In `src/app/(app)/extract/page.tsx:250-254`, if limit is reached, the extraction tabs are replaced with `<UpgradePrompt />`.
- In `src/app/(app)/profile/page.tsx:360-407`, free users see their monthly extraction allowance progress bar, remaining quota, reset date info, and a direct "Upgrade to Pro ($4.99/mo)" CTA.
- TheMealDB Discover recipes are **100% free and unlimited** for all users, explicitly documented in `/pricing` and `/profile`.

#### C. Pro User Unlimited Experience
- Pro users (`profile.plan === 'pro'`):
  - `limit: Infinity`, `remaining: Infinity`, `isLimitReached: false`.
  - In `/extract`: displays a golden Pro badge with "Unlimited AI Extractions" (`src/app/(app)/extract/page.tsx:236-240`).
  - In Navbar & Profile: displays the Pro Crown badge.
  - No extraction blocking screens or upgrade banners.

---

### 4. Servings Adjuster & Fraction Scaling Logic

#### A. Scaling Engine
- In `src/app/(app)/recipes/[id]/page.tsx:47-77`:
  - `originalServings = recipe?.servings || 4` (defaults safely to 4 if null or 0).
  - `scale = currentServings / originalServings`.
- `scaleAmount(amount: string)` handles:
  1. **Simple Fractions** (`1/2`, `3/4`, `1/4`): Evaluated via `(num / den) * scale`.
  2. **Mixed Fractions** (`1 1/2`, `2 3/4`): Evaluated via `(whole + num / den) * scale`.
  3. **Plain Numbers & Decimals** (`2`, `1.5`): Multiplied by scale.
  4. **Non-numeric strings** (`"pinch"`, `"to taste"`, `"a dash"`): `parseFloat` returns `NaN`, returned as-is.

#### B. Component Controls & Clamping
- Decrement button (`−`): Clamped with `Math.max(1, currentServings - 1)` (`src/app/(app)/recipes/[id]/page.tsx:284`), preventing 0 or negative servings.
- Increment button (`+`): `setAdjustedServings(currentServings + 1)` (`src/app/(app)/recipes/[id]/page.tsx:291`), cleanly scaling to 20+ servings.
- Reset button: Appears conditionally when `scale !== 1` (`src/app/(app)/recipes/[id]/page.tsx:298-306`).
- Complementary library in `src/lib/ingredient-parser.ts`: Extensive vulgar fraction support (`½`, `⅓`, `¼`, `¾`, `⅝`, `⅞`, etc.) and range support (`"2-3 cloves"`).

---

### 5. Search & Dietary Filter Zero-Match Handling

| Feature | Query / Filter | Behavior on 0 Matches | File Reference |
| :--- | :--- | :--- | :--- |
| **Recipe Collection Search** | Non-existent text / ingredient | Renders Zap empty state: *"No recipes found matching your filters"* with "Clear All Filters" button. | `src/app/(app)/recipes/page.tsx:227-246` |
| **Recipe Dietary Filter** | Filter with 0 matching recipes | Filter chip remains active, displays empty state with "Reset filters" and "Clear All Filters" CTAs. | `src/app/(app)/recipes/page.tsx:207-246` |
| **TheMealDB Discover Search** | Unknown query | Displays Search icon: *"No recipes found. Try a different search term or browse by category"* + "Show Random Recipes" button. | `src/app/(app)/discover/page.tsx:282-293` |
| **Meal Plan Recipe Picker** | Empty search in Saved/Discover | Displays ChefHat icon and prompts user to switch tabs or search differently. | `src/app/(app)/meal-plan/page.tsx:569-580,641-644` |
| **Meal Plan Auto-Fill** | Dietary restrictions with 0 matching saved recipes | Intercepts generation and shows warning toast: *"No Compliant Recipes Found: You have active dietary restrictions (...), but no saved recipes match."* | `src/app/(app)/meal-plan/page.tsx:154-173` |

---

### 6. Double-Clicking Prevention on Buttons

| Button Action | Loading / Disabled Guard | Spinner / Visual Feedback | File Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Extract Recipe (YouTube)** | `disabled={!youtubeUrl \|\| !youtubeVideoId \|\| isExtractingYoutube}` | `<Loader2 className="animate-spin" /> Analyzing...` | `src/app/(app)/extract/page.tsx:296-304` | Protected ✅ |
| **Extract Recipe (Photo)** | `disabled={isExtractingImage}` | `<Loader2 className="animate-spin" /> Analyzing...` | `src/app/(app)/extract/page.tsx:430-438` | Protected ✅ |
| **Save Extracted Recipe** | `disabled={isSaving}`, transitions to `isSaved` view | Spinner in button, changes to "Saved to your recipes" | `src/components/recipe/RecipePreview.tsx:125-141` | Protected ✅ |
| **"I Made This" (Cook Count)** | `disabled={isMarkingMade}` | `<Loader2 className="animate-spin" />` | `src/app/(app)/recipes/[id]/page.tsx:489-495` | Protected ✅ |
| **Delete Recipe** | `disabled={isDeleting}` on Confirm and Cancel | `<Loader2 className="animate-spin" />` | `src/app/(app)/recipes/[id]/page.tsx:449-455` | Protected ✅ |
| **Stripe Go Pro Checkout** | `disabled={isLoadingCheckout \|\| isPro}` | `<Loader2 className="animate-spin" /> Opening Stripe Checkout...` | `src/app/pricing/page.tsx:441-456` | Protected ✅ |
| **Shopping List: Generate from Plan** | `disabled={isGenerating}` | `<Loader2 className="animate-spin" />` | `src/app/(app)/shopping-list/page.tsx:220-229` | Protected ✅ |
| **Shopping List: Clear All** | Confirmation dialog with `disabled={isClearingAll}` | `<Loader2 className="animate-spin" />` | `src/app/(app)/shopping-list/page.tsx:273-276` | Protected ✅ |
| **Shopping List: Add Custom Item** | `disabled={submitting \|\| !name.trim()}` | `<Loader2 className="animate-spin" /> Adding...` | `src/components/shopping/AddItemDialog.tsx:172-182` | Protected ✅ |
| **Rate Recipe (Stars)** | `handleRate(star)` calls idempotent Firestore update | Immediate star highlight update | `src/app/(app)/recipes/[id]/page.tsx:234` | Safe (Idempotent) ✅ |
| **Meal Plan: Auto-Fill Week** | None (no `isAutoFilling` disabled state) | Standard button | `src/app/(app)/meal-plan/page.tsx:356` | Minor Issue ⚠️ |
| **Meal Plan: Clear All** | None (no confirmation dialog or disabled state) | Standard button | `src/app/(app)/meal-plan/page.tsx:352` | Minor Issue ⚠️ |

---

### 7. Network Error Handling

- **API Route Error Handling**:
  - `POST /api/extract-recipe`: Validates input types, wraps Gemini generation in `try...catch`, sanitizes markdown code blocks from Gemini response (`cleanJson`), catches JSON parse errors, and returns HTTP 400/500 with descriptive error JSON (`src/app/api/extract-recipe/route.ts:5-73`).
  - `POST /api/youtube-recipe`: Validates URL and parsed ID; returns HTTP 400/404/500 with friendly message (`src/app/api/youtube-recipe/route.ts:5-40`).
  - `POST /api/stripe/checkout`, `POST /api/stripe/verify-session`, `POST /api/stripe/webhook`: Comprehensive validation and `try...catch` blocks (`src/app/api/stripe/...`).
- **Client Fetch Error Handling**:
  - `extractRecipeFromYouTube`: Falls back to Gemini video path if metadata description fetch fails (`src/lib/extract-recipe.ts:175-177`).
  - Recipe extraction errors on `/extract`: Displayed in red alert box with `AlertCircle` (`src/app/(app)/extract/page.tsx:313,449`).
  - TheMealDB calls in `src/lib/mealdb.ts`: All methods (`searchMealsByName`, `getRandomMeals`, `filterByCategory`, `getMealById`) have `try...catch` blocks returning empty fallback arrays or `null`.
- **Firebase Auth Errors**:
  - In `src/app/login/page.tsx:38-71`, `handleAuthError` translates raw Firebase codes (`auth/invalid-credential`, `auth/email-already-in-use`, `auth/weak-password`, `auth/network-request-failed`, `auth/too-many-requests`, `auth/popup-closed-by-user`) into clear, human-friendly guidance.
- **Firestore Hooks**:
  - `useRecipes`, `useMealPlan`, `useShoppingList`, `useProfile` all have snapshot/query error callbacks that update their local `error` state.

---

### 8. Auth Protection on Private Routes & Deep-Link 404s

- **Route Protection**:
  - All private application routes (`/dashboard`, `/recipes`, `/recipes/[id]`, `/meal-plan`, `/shopping-list`, `/extract`, `/discover`, `/profile`) reside under the `src/app/(app)/` route group.
  - `src/app/(app)/layout.tsx:10-20` wraps all children in `<AuthGuard>`.
  - `AuthGuard` (`src/components/auth/AuthGuard.tsx:13-17`) checks `!loading && !user && pathname !== '/login'` and automatically redirects to `/login?redirect=${encodeURIComponent(pathname)}`.
  - On successful login/signup, `src/app/login/page.tsx:26-29` redirects to the requested `redirectUrl` or defaults to `/dashboard`.
- **Deep-Link 404 Handling (`/recipes/[id]`)**:
  - In `src/app/(app)/recipes/[id]/page.tsx:38,164-176`, if the recipe ID is not found in the user's collection, a clean "Recipe not found" error card is displayed with a "Back to recipes" button.
- **Global 404 Page**:
  - `src/app/not-found.tsx` does not exist; unmapped URLs use the default Next.js 404 handler.

---

### 9. Accessibility (a11y) & UX Polish

| a11y & UX Dimension | Implementation Details | Status |
| :--- | :--- | :--- |
| **Image Alt Text** | `RecipeCard.tsx:43`, `RecipePreview.tsx`, `discover/page.tsx:304`, `recipes/[id]/page.tsx:193`, `extract/page.tsx:326`, `Navbar.tsx:82` all have descriptive `alt` text. (*Note: `dashboard/page.tsx` uses CSS `backgroundImage`*). | Mostly Compliant ⚠️ |
| **Aria-Labels on Icon Buttons** | Star ratings have `aria-label="Rate X stars"`; password toggle has `aria-label`. However, search clear (`X`), servings (`−`/`+`), meal slot remove (`X`), and week navigation (`<`/`>`) icon buttons lack explicit `aria-label`s. | Partial ⚠️ |
| **Color Contrast** | Primary text (`text-stone-900`, `text-stone-700`, `text-stone-600`) achieves > 4.5:1 ratio against light backgrounds (WCAG AA). Helper text (`text-stone-400`) has ~3.0:1 contrast. | Acceptable / Minor Polish ⚠️ |
| **Focus Rings** | Global `outline-ring/50` applied; UI components have `focus-visible:ring-2` and `focus-visible:ring-primary`. | Compliant ✅ |
| **Loading Skeletons** | Dedicated skeleton components for Dashboard (`DashboardSkeleton`), Recipe Grid (`RecipeGridSkeleton`), Recipe Detail (`RecipeDetailSkeleton`), and Meal Plan (`MealPlanSkeleton`). | Compliant ✅ |
| **Error Messages** | User-friendly notifications through the `@base-ui/react/toast` notification system and clear inline alert banners. | Compliant ✅ |

---

### 10. Mobile Responsiveness at 375px Viewport Width

- **Mobile Navigation (`src/components/layout/Navbar.tsx`)**:
  - Top header (h-14) with PlateUp logo and user avatar dropdown menu.
  - Fixed bottom navigation bar (h-16) with 6 core navigation items (Home, Extract, Discover, Recipes, Plan, Shop).
  - Main content padding: `pb-20 md:pb-8` in `src/app/(app)/layout.tsx` guarantees content is never obscured by the bottom bar.
- **Segmented Day Selector for Meal Plan on Mobile**:
  - `src/app/(app)/meal-plan/page.tsx:400-440` implements a dedicated 7-day tab bar (`grid-cols-7`) with day abbreviations (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`) and meal indicator dots. Clicking a day reveals the 3 meals for that single day, perfectly formatted for a 375px screen.
- **Responsive Stacking & Padding**:
  - Grid columns use responsive Tailwind classes (`grid-cols-1 md:grid-cols-3`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
  - Action buttons and hero layouts stack vertically (`flex-col sm:flex-row`).
  - Pricing feature comparison table is wrapped in an `overflow-x-auto` container to prevent viewport overflow.
  - Dialogs and modals use mobile-friendly sizing (`rounded-2xl`, `p-4 sm:p-6`, flexible widths).

---

## Complete Findings & Actionable Recommendations

| ID | Category | Severity | Finding / Bug Description | Affected File & Lines | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Input / Upload | Medium | Large image uploads (>4.5MB) are read directly as base64 without client-side file size validation or downscaling, risking HTTP 413 serverless body payload errors on Vercel. | `src/app/(app)/extract/page.tsx:117-130` | Add a 4.5MB file size check or client-side canvas downscaling in `handleImageSelect`. |
| **BUG-02** | UI / Double-Click | Low | "Auto-Fill Week" and "Clear All" buttons on the Meal Plan page lack loading/disabled states (`isAutoFilling`) and "Clear All" lacks a confirmation dialog. | `src/app/(app)/meal-plan/page.tsx:352-360` | Add `isAutoFilling` state to "Auto-Fill Week" and a confirmation dialog to "Clear All". |
| **BUG-03** | Accessibility | Low | Several icon-only buttons (search clear `X`, servings `−`/`+`, week navigation chevrons, meal slot remove `X`) lack explicit `aria-label` attributes. | `src/app/(app)/recipes/page.tsx:157`, `src/app/(app)/recipes/[id]/page.tsx:284,290`, `src/app/(app)/meal-plan/page.tsx:286,389,395`, `src/app/(app)/shopping-list/page.tsx:290,304` | Add descriptive `aria-label` attributes to all icon-only buttons. |
| **BUG-04** | Accessibility | Low | Dashboard page uses CSS `backgroundImage: url(...)` for recipe thumbnails instead of semantic `<img alt="...">` tags. | `src/app/(app)/dashboard/page.tsx:147-150,206-210` | Use semantic `<img src={...} alt={recipe.name} />` tags with `object-cover`. |
| **BUG-05** | Routing / UX | Low | Missing dedicated custom 404 page (`src/app/not-found.tsx`), falling back to default unstyled Next.js 404 for arbitrary invalid routes. | `src/app/not-found.tsx` (missing) | Create `src/app/not-found.tsx` matching PlateUp brand styling. |

---

## Verification & Independent Reproducibility

1. **TypeScript Type Safety**:
   ```bash
   npx tsc --noEmit
   # Result: 0 errors
   ```

2. **Automated Test Suite**:
   ```bash
   npm test
   # Result: 1057 / 1057 tests passed (34 test files, 100% passing)
   ```

3. **Production Next.js Build**:
   ```bash
   npm run build
   # Result: Successfully compiled all 20 static & dynamic routes
   ```
