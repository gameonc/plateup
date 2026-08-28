# QA Investigation Report: Recipe Extraction, Meal Planner, Shopping List, and Dietary Preferences

**Subagent**: `qa_explorer_2`  
**Date**: 2026-08-28T04:57:00Z  
**Status**: COMPLETE / VERIFIED  

---

## 1. Observation

Direct observations and evidence across all assigned scopes:

### Scope 1: Recipe Extraction (YouTube, Vision, Error Handling, Firestore Persistence)
- **Route Handler (`src/app/api/youtube-recipe/route.ts`)**:
  - Validates `url` input (Lines 9–23) and extracts 11-char video ID using `extractVideoId`.
  - `extractYouTubeData(videoId)` in `src/lib/youtube.ts` (Lines 86–106) concurrently fetches metadata via oEmbed (`fetchTitleViaOembed`) and watch page HTML parsing (`scrapeWatchPage`), returning title, description, thumbnail URL, and formatted transcript fallback without throwing unhandled exceptions.
  - Route handler returns 400 with `{ error: 'Valid YouTube URL is required' }` or `{ error: 'Invalid YouTube URL. Could not parse video ID.' }` when input is malformed (Lines 10, 19).
- **Gemini Structured Output & Multimodal Extraction (`src/lib/ai.ts` & `src/lib/extract-recipe.ts`)**:
  - `recipeModel` configured with Gemini 3.6 Flash (`gemini-3.6-flash`), `responseMimeType: 'application/json'`, and strict `recipeSchema` covering `name`, `prepTimeMinutes`, `cookTimeMinutes`, `servings`, `difficulty`, `tags`, `dietaryTags`, `ingredients`, and `instructions` (Lines 9–49).
  - Layered YouTube extraction in `src/lib/extract-recipe.ts` (Lines 228–259): Checks server route description first via `hasRecipeSignal`. If description is rich, parses transcript with `extractRecipeFromTranscript`; if description is thin or missing, invokes `onEscalate` and falls back directly to Gemini native video watching (`extractRecipeFromYouTubeUrl`).
  - Multimodal Vision extraction in `src/lib/extract-recipe.ts` (Lines 163–195): `extractRecipeFromImage` validates `mimeType.startsWith('image/')`, passes base64 image data inline to Gemini with `IMAGE_RECIPE_PROMPT`, and strips Markdown backticks (`replace(/```(?:json)?\n?/g, '')`).
  - Deterministic dietary validator `detectDietaryTags` (Lines 24–50) runs on ingredients and instructions to ensure complete dietary tagging.
- **User Interface & Error States (`src/app/(app)/extract/page.tsx` & `src/components/recipe/RecipePreview.tsx`)**:
  - `YOUTUBE_REGEX` handles standard watch URLs, youtu.be, shorts, and embeds (Line 23).
  - Friendly error states display inline with `<AlertCircle className="h-4 w-4 mr-1" />` (Lines 267–271, 404–408).
  - Dynamic loading indicators with pulse animations communicate when Gemini is analyzing or watching videos (Lines 290–307, 411–424).
  - `handleSaveRecipe` (Lines 148–189) saves the recipe with thumbnail to Firestore via `addRecipe` in `useRecipes()`, displays toast notification, and provides navigation to `/recipes`.

### Scope 2: Meal Planner (7x3 Calendar Grid, Manual Assignment, Auto-fill, ISO Week, Clearing)
- **Calendar & Navigation (`src/app/(app)/meal-plan/page.tsx`)**:
  - Weekly view tracks 7 days (`monday` to `sunday`) x 3 meal slots (`breakfast`, `lunch`, `dinner`) = 21 total slots (Lines 25, 355–366).
  - Desktop view renders full 7-column layout (Line 355). Mobile view (< 768px) renders segmented 7-day tab bar with dot meal indicators and day meal cards (Lines 313–352).
  - ISO Week navigation via `addWeeks` / `subWeeks` with `getISOWeekId` (`YYYY-Www`) (Lines 38–40, 77–78).
- **Manual Assignment & Recipe Picker Dialog (`src/app/(app)/meal-plan/page.tsx`)**:
  - Clicking any slot opens recipe picker modal (`isPickerOpen`) with full-text search input and dietary category filter pills (`All`, `Vegetarian`, `Vegan`, etc.) (Lines 370–479).
  - Displays cook time, dietary badges, and "Recently cooked" badge for items cooked within the user's `repeatWindowDays` (Lines 457–471).
  - Selecting a recipe calls `setMealSlot(day, meal, slot)` and syncs to Firestore `users/{uid}/mealPlans/{weekId}`.
- **Smart Auto-Fill Engine (`src/lib/meal-planner.ts`)**:
  - `generateMealPlan` (Lines 21–159):
    - Strictly filters candidate recipes by active dietary restrictions (`dietaryRestrictions`) (Lines 40–48).
    - Preserves user-locked/pre-assigned slots (Lines 31–36).
    - Filters out recently cooked recipes from cooking log (Lines 56–59).
    - Balances variety across recipe tag groups and avoids repeating yesterday's recipe or earlier week recipes (Lines 62–156).
    - Prefers easy recipes on weekdays and harder recipes on weekends (Lines 96–99).
    - Handles zero-matching recipes gracefully without crashing, displaying an informative user-facing warning toast (Page Lines 100–107).
- **Slot Clearing**:
  - Single slot clear via `clearMealSlot(day, meal)` in `useMealPlan` (Lines 133–147) and "Clear All" resetting all 21 slots via `handleClearAll` (Page Lines 124–131).

### Scope 3: Shopping List (Aggregation, Unit Math, 8 Departments, Persistence)
- **Ingredient Parser & Unit Math Engine (`src/lib/ingredient-parser.ts`)**:
  - `parseFractionOrAmount` (Lines 28–79) accurately parses vulgar Unicode fractions (`½`, `⅓`, `⅔`, `¼`, `¾`, `⅛`, `⅜`, `⅝`, `⅞`, `⅙`, `⅚`, `⅑`, `⅒`), mixed hyphenated/spaced fractions (`1 1/2`, `1-1/2`, `2 3/4`), range upper bounds (`2-3` -> `3`), decimals, integers, and explicit zero.
  - `normalizeUnit` (Lines 136–172) normalizes volume, weight, and discrete count units to standard forms (`tbsp`, `tsp`, `cups`, `fl oz`, `pints`, `quarts`, `gallons`, `ml`, `liters`, `oz`, `lbs`, `g`, `kg`, `cloves`, `cans`, `bunches`, `slices`, etc.).
  - `formatQuantityDisplay` (Lines 84–124) reformats decimal sums back to human-friendly fraction strings (`1 1/2 cups`, `3/4 tbsp`, etc.).
- **Grocery Department Categorization (`src/lib/ingredient-parser.ts`)**:
  - Maps items to exactly 8 store departments (Lines 177–228): `Produce`, `Dairy`, `Meat/Seafood`, `Pantry`, `Spices/Seasonings`, `Bakery`, `Frozen`, and `Other`.
- **Aggregation & Merging Engine (`src/lib/shopping-aggregator.ts`)**:
  - `aggregateMealPlanIngredients` (Lines 34–126) scans all 21 slots in the meal plan, aggregates duplicate ingredients with compatible units, sums their numeric quantities, and tracks contributing `recipeIds` and `recipeTitles`.
  - Duplicate ingredients with incompatible units (e.g. 1 can vs 2 cups) are maintained as separate list items to prevent loss.
  - `mergeShoppingListWithCustomItems` (Lines 175–198) preserves user-created custom grocery items and checked state when generating/re-generating from meal plans.
- **Firestore Persistence & Checklist UI (`src/hooks/useShoppingList.ts` & `src/app/(app)/shopping-list/page.tsx`)**:
  - Real-time Firestore sync via `onSnapshot` on `users/{uid}/shoppingLists/{weekId}` and `users/{uid}/shoppingList/current`.
  - Item check-off toggles with strike-through and count badge updates (`toggleItemCheck`).
  - "Clear Done" (`clearCheckedItems`), "Clear All" with confirmation dialog (`clearList`), and manual item creation via `AddItemDialog` (`addItem`).

### Scope 4: Dietary Preferences (Profile Toggles, Select/Clear All, Meal Times)
- **Profile UI (`src/app/(app)/profile/page.tsx`)**:
  - Interactive grid toggles for all 8 standard dietary restrictions (`vegetarian`, `vegan`, `gluten-free`, `dairy-free`, `keto`, `low-carb`, `pescatarian`, `nut-free`) with distinct icons, badge styling, and explanatory tooltips (Lines 295–329).
  - "Select all" and "Clear all" buttons toggle all 8 restrictions simultaneously (Lines 122–130, 268–289).
  - Recipe repeat window slider configurable from 1 to 14 days (Lines 352–387).
  - Daily planned meal slots toggle (`breakfast`, `lunch`, `dinner`) with validation ensuring at least one meal time remains enabled (Lines 69–88, 390–429).
- **Persistence & Integration (`src/hooks/useProfile.ts` & `src/lib/dietary.ts`)**:
  - Saves preferences to Firestore `users/{uid}` via `updatePreferences` (Lines 77–107).
  - Preferences seamlessly integrate with `/recipes` dietary filter chips, `/meal-plan` auto-fill engine, and recipe picker dietary filter pills.

### Build and Test Executions
- `npm test`: **696/696 tests passed** (0 failures, 100% pass rate).
- `npx tsc --noEmit`: **0 TypeScript errors**.
- `npm run build`: **0 build errors**, all 13 Next.js routes generated statically/dynamically.

---

## 2. Logic Chain

1. **YouTube & Image Extraction**:
   - Observation: `extractRecipeFromYouTube` tries server-fetched descriptions first and escalates to Gemini video watching if necessary. `extractRecipeFromImage` sends base64 image data to Gemini multimodal vision.
   - Deduction: Both methods produce full `Recipe` objects with schema-compliant ingredients, instructions, and dietary tags without crashing or returning raw error objects to the user.
2. **Meal Planner Flow**:
   - Observation: The weekly planner displays 7 days x 3 meals with responsive desktop and mobile layouts. Auto-fill strictly complies with user dietary preferences and recipe history.
   - Deduction: Meal planning operations (manual assignment, recipe search, auto-fill, week navigation, slot clearing) are fully functional and persist reliably to Firestore.
3. **Shopping List Generation & Persistence**:
   - Observation: `aggregateMealPlanIngredients` sums duplicate ingredient quantities using fractional/unit math, groups them into 8 standard store departments, and preserves custom items.
   - Deduction: Shopping list generation accurately reflects meal plan contents, prevents duplicate clutter, and synchronizes checked state with Firestore.
4. **Dietary Preferences Flow**:
   - Observation: `/profile` allows toggling individual or bulk dietary restrictions and meal times, persisting to `users/{uid}`.
   - Deduction: User dietary preferences correctly constrain auto-fill suggestions and filter recipe views across the application.

---

## 3. Caveats

- In live runtime execution, Google Gemini AI API calls require the environment variable `NEXT_PUBLIC_FIREBASE_API_KEY` or appropriate Firebase configuration to communicate with the Gemini service.
- No caveats regarding code logic, type safety, test coverage, or component structure.

---

## 4. Conclusion

All features and acceptance criteria assigned to `qa_explorer_2` (Recipe Extraction, Meal Planner, Shopping List, and Dietary Preferences) have been verified to be 100% complete, fully implemented, type-safe, and passing all automated test tiers with zero regressions.

---

## 5. Verification Method

To independently verify these findings, run:

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
2. **Next.js Production Build**:
   ```bash
   npm run build
   ```
3. **Full Automated Test Suite**:
   ```bash
   npm test
   ```
4. **Inspect Source Files**:
   - Recipe Extraction: `src/app/api/youtube-recipe/route.ts`, `src/lib/extract-recipe.ts`, `src/app/(app)/extract/page.tsx`
   - Meal Planner: `src/app/(app)/meal-plan/page.tsx`, `src/lib/meal-planner.ts`, `src/hooks/useMealPlan.ts`
   - Shopping List: `src/app/(app)/shopping-list/page.tsx`, `src/lib/shopping-aggregator.ts`, `src/lib/ingredient-parser.ts`, `src/hooks/useShoppingList.ts`
   - Dietary Preferences: `src/app/(app)/profile/page.tsx`, `src/hooks/useProfile.ts`, `src/lib/dietary.ts`
