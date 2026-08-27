# PlateUp: Comprehensive Feature Specification & Requirements Survey

**Document Version:** 1.0.0  
**Target Release:** Production Polish & Feature Completion  
**Target Platform:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Firebase (Auth, Firestore, AI Logic with Gemini 2.5 Flash)  
**Author:** Specification Miner  
**Date:** 2026-08-27  

---

## 1. Executive Summary & Architecture Overview

PlateUp is an AI-powered smart recipe extraction, collection management, weekly meal planning, and automated grocery list application. The system enables users to:
1. Extract rich recipes from YouTube cooking videos (via transcript analysis) and food photos/camera captures (via multimodal AI vision).
2. Organize, rate, note, and track cooking history for their personal recipe collection.
3. Plan 7 days × 3 meals (21 slots) with an intelligent auto-fill planner that complies with dietary restrictions and avoids recent repeats.
4. Generate consolidated shopping lists with automated ingredient normalization, canonical unit conversion, quantity summing, and interactive check-off states.
5. Personalize dietary preferences (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Keto, etc.) with automatic AI recipe tagging, collection filtering, and compliant meal plan generation.

### System Architecture Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                           PLATEUP WEB APP                                          |
|                                                                                                    |
|  +------------------+  +------------------+  +-------------------+  +----------------------------+ |
|  |   Landing Page   |  |   Auth / Login   |  |     Dashboard     |  |   Navigation (Top/Bottom)  | |
|  +------------------+  +------------------+  +-------------------+  +----------------------------+ |
|                                                                                                    |
|  +------------------+  +------------------+  +-------------------+  +----------------------------+ |
|  | Recipe Extractor |  |  Recipe Library  |  |    Meal Planner   |  |       Shopping List        | |
|  | (YouTube/Photo)  |  | (CRUD/Filter/Tag)|  |  (7x3 / AutoFill) |  |   (Aggregator/Checklist)   | |
|  +--------+---------+  +--------+---------+  +---------+---------+  +-------------+--------------+ |
|           |                     |                      |                          |                |
+-----------|---------------------|----------------------|--------------------------|----------------+
            |                     |                      |                          |                 
            v                     v                      v                          v                 
+-----------------------+ +--------------------------------------------------------------------------+
|      API Routes       | |                        Firebase Client Services                          |
|                       | |                                                                          |
| POST /api/youtube-    | | +-------------------+  +-----------------------+  +--------------------+ |
|      recipe           | | |   Firebase Auth   |  |    Cloud Firestore    |  |  Firebase AI Logic | |
| (youtubei.js captions)| | | (Email/PW, Google)|  | (Users, Recipes, Plans|  | (Gemini 2.5 Flash,  | |
|                       | | |                   |  |  CookingLog, Shopping)|  |  Structured JSON)  | |
+-----------------------+ | +-------------------+  +-----------------------+  +--------------------+ |
                          +--------------------------------------------------------------------------+
```

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| **F-01** | Build & Core | Font / Asset Resolution | Build must succeed without internet dependency on Google Fonts CDN | `npm run build` | Zero-error production build | Fallback to local / system font stack if external font fetch fails | Codebase build inspection (`layout.tsx`) |
| **F-02** | Auth | Email/Password Registration | Creates new user account in Firebase Auth and profile in Firestore | Email, password, display name | Auth user session + Firestore profile doc | Field validation error, Firebase error banner (`auth/email-already-in-use`, `auth/weak-password`) | `useAuth.tsx`, `login/page.tsx` |
| **F-03** | Auth | Email/Password Sign-In | Authenticates existing user with Firebase Auth | Email, password | Auth session, redirect to `/dashboard` | Display error (`auth/invalid-credential`, `auth/wrong-password`) | `useAuth.tsx`, `login/page.tsx` |
| **F-04** | Auth | Google OAuth Popup | One-click popup authentication via Google provider | User popup interaction | Auth session + initial profile doc | Popup closed handling (`auth/popup-closed-by-user`) | `useAuth.tsx`, `login/page.tsx` |
| **F-05** | Auth | Auth State Guard | Route protection for private pages with loading spinner and redirect | Route navigation | Render child page or redirect `/login` | Gracefully retains redirect intent | `AuthGuard.tsx`, `(app)/layout.tsx` |
| **F-06** | Extraction | YouTube Caption Extractor | Backend route fetching metadata and captions using `youtubei.js` | YouTube URL (watch, shorts, youtu.be) | Title, description, thumbnail URL, transcript | 400 Bad Request if invalid URL; 404/500 if no captions available | `api/youtube-recipe/route.ts`, `youtube.ts` |
| **F-07** | Extraction | YouTube AI Recipe Parser | Gemini 2.5 Flash structured recipe extraction from transcript | Video title, description, transcript | Structured `ExtractedRecipe` JSON | Parse error catch with user-friendly retry message | `ai.ts`, `extract-recipe.ts` |
| **F-08** | Extraction | Photo AI Recipe Extractor | Multimodal vision recipe extraction from uploaded dish/menu image | Image file (Base64 string + MIME type) | Structured `ExtractedRecipe` JSON | 400 for unsupported MIME types, error alert on model failure | `extract-recipe.ts`, `extract/page.tsx` |
| **F-09** | Extraction | Tab Navigation Query Support | Query param `tab=photo` opens Photo tab directly from dashboard | URL query params (`?tab=photo`) | Active tab switched to photo | Default to YouTube tab if parameter missing or invalid | `extract/page.tsx`, `dashboard/page.tsx` |
| **F-10** | Recipe Mgmt | Recipe Persistence | Saves extracted or manual recipe to Firestore `users/{uid}/recipes` | `Recipe` data payload | Generated document ID, success state | Toast notification on failure, optimistic retry | `useRecipes.ts`, `RecipePreview.tsx` |
| **F-11** | Recipe Mgmt | 1-5 Star Rating System | User can rate recipes from 1 to 5 stars; displays filled stars | Recipe ID, integer rating (1-5) | Updated Firestore recipe document | Rejects ratings outside 1-5 with error | `useRecipes.ts`, `recipes/[id]/page.tsx` |
| **F-12** | Recipe Mgmt | "I Made This" Cook Tracker | Increments cook count and logs record to cooking history | Recipe ID, user click | `timesMade += 1`, `lastMadeAt: now()`, new `cookingLog` entry | Loading spinner on button; logs error if recipe missing | `useRecipes.ts`, `recipes/[id]/page.tsx` |
| **F-13** | Recipe Mgmt | Recipe Notes & Live Auto-save | User can write custom notes with auto-save on blur | Recipe ID, text notes | Updated `notes` field in Firestore | Silent fallback if text unchanged | `recipes/[id]/page.tsx` |
| **F-14** | Recipe Mgmt | In-Recipe Ingredient Checklist | Interactive toggle to check off ingredients while cooking | Click on ingredient item | Local UI toggle (strikethrough + checkbox) | Resets or preserves state per session | `recipes/[id]/page.tsx` |
| **F-15** | Recipe Mgmt | Recipe Deletion with Dialog | Deletes recipe document with confirmation modal | Recipe ID, user confirmation | Document removed, redirect to `/recipes` | Shows error in dialog if deletion fails | `recipes/[id]/page.tsx` |
| **F-16** | Recipe Mgmt | Search & Multi-criteria Sort | Filter by search query, sort by Newest, Rating, Most Made, Recent | Search string, sort dropdown value | Filtered and sorted recipe grid | Empty state when no matches found | `recipes/page.tsx` |
| **F-17** | Meal Planner | 7x3 Weekly Grid Display | Displays 7 days (Mon-Sun) × 3 meal times (Breakfast, Lunch, Dinner) | Current ISO Week ID | 21 meal slots with recipe cards / empty buttons | Empty week fallback initialization | `meal-plan/page.tsx`, `meal-planner.ts` |
| **F-18** | Meal Planner | ISO Week Navigation | Navigates forward/backward across calendar weeks using ISO IDs | Week increment/decrement click | Loads corresponding week's plan from Firestore | Correct ISO year calculation around year boundaries | `useMealPlan.ts`, `meal-plan/page.tsx` |
| **F-19** | Meal Planner | Manual Slot Assignment | Opens recipe picker dialog and assigns selected recipe to slot | Day, meal time, recipe selection | Slot populated with recipe name & thumbnail | Dialog closes, updates Firestore `mealPlans/{weekId}` | `meal-plan/page.tsx`, `useMealPlan.ts` |
| **F-20** | Meal Planner | Slot Clearing & Clear All | Removes individual meal slot or clears entire week | Slot `(day, meal)` or "Clear All" click | Slot/week reset to empty in Firestore | Optimistic UI update | `meal-plan/page.tsx`, `useMealPlan.ts` |
| **F-21** | Meal Planner | Smart Auto-Fill Engine | Fills empty slots avoiding recent repeats & balancing variety | Saved recipes, cooking logs, locked slots | Complete 21-slot meal plan | Fallback to relaxed constraints if library is small | `meal-planner.ts`, `meal-plan/page.tsx` |
| **F-22** | Dashboard | Today's Menu Live View | Extracts today's 3 meals from current week's meal plan | Current date & week plan | 3 cards for Breakfast, Lunch, Dinner | Empty state with "Add Meal" button if unassigned | `dashboard/page.tsx` |
| **F-23** | Dashboard | Live User Stats | Computes total recipes, meals planned this week, made this month | Recipe list, current plan, cooking logs | 3 live stat summary cards | Displays 0 if empty | `dashboard/page.tsx` |
| **F-24** | Dashboard | Recent Recipes Quick Access | Displays last 5 added recipes with source badges | Recipe list | Top 5 cards with thumbnail & source | Fallback empty state prompting recipe extraction | `dashboard/page.tsx` |
| **F-25** | UI / Theme | Warm Amber/Orange Theme | Unified OKLCH color palette with warm amber/orange primary | Tailwind v4 tokens & CSS variables | Consistent warm food aesthetic across app | High-contrast accessible text colors | `globals.css`, `ORIGINAL_REQUEST.md` (R2) |
| **F-26** | UI / Mobile | Mobile-First Bottom Nav | Responsive bottom navigation bar for mobile (<768px) | Viewport size | Fixed bottom bar with icons; top nav hidden | Safe-area padding preventing content overlap | `Navbar.tsx`, `(app)/layout.tsx` |
| **F-27** | UI / States | Comprehensive Loading UI | Skeleton loaders & spinners during all async fetches | Loading booleans | Non-blocking visual feedback | No layout shifts or flash of unstyled content | `ORIGINAL_REQUEST.md` (R2) |
| **F-28** | UI / States | Contextual Empty States | Clear illustrations & call-to-action buttons for empty collections | Empty array / null data | Actionable empty cards with link buttons | Prevents blank screens | `ORIGINAL_REQUEST.md` (R2) |
| **F-29** | Shopping | Main Navigation Entry | "Shopping List" link in desktop top nav and mobile bottom nav | Navigation clicks | Navigates to `/shopping-list` | Active link highlighting | `Navbar.tsx`, `ORIGINAL_REQUEST.md` (R3) |
| **F-30** | Shopping | Meal Plan Aggregator | Extracts ingredients from all assigned recipes in current week plan | Current `MealPlan` + `Recipe[]` | Consolidated raw ingredient list | Warning if meal plan is empty | `ORIGINAL_REQUEST.md` (R3) |
| **F-31** | Shopping | Intelligent Ingredient Merger | Combines duplicate ingredients with unit conversion & sum | Raw ingredients array | De-duplicated items with summed quantities | Retains distinct entries if units incompatible | `ORIGINAL_REQUEST.md` (R3) |
| **F-32** | Shopping | Department Categorization | Groups grocery items by store department (Produce, Dairy, etc.) | Ingredient items | Grouped accordion / section lists | Falls back to "Other" / "Pantry" | `ORIGINAL_REQUEST.md` (R3) |
| **F-33** | Shopping | Check-off & Item Toggling | User checks off items while shopping; moves to completed list | Checkbox click | Toggles `checked: boolean` on item | Retains checked state across sessions | `ORIGINAL_REQUEST.md` (R3) |
| **F-34** | Shopping | Custom Items & Item Editing | User can manually add, edit, or delete grocery items | Custom item form inputs | Added to shopping list | Validates non-empty item name | `ORIGINAL_REQUEST.md` (R3) |
| **F-35** | Shopping | Real-Time Firestore Sync | Persists shopping list to `users/{uid}/shoppingList/current` | Shopping list modifications | Instant cloud persistence & reload recovery | Firestore security rule match `/shoppingList/{id}` | `ORIGINAL_REQUEST.md` (R3), `firestore.rules` |
| **F-36** | Dietary | Profile Dietary Preferences | User can select active dietary restrictions in profile/settings | Settings checklist (Vegan, Gluten-Free, etc.) | Saved to `users/{uid}.preferences.dietaryRestrictions` | Validates known dietary taxonomy | `ORIGINAL_REQUEST.md` (R4) |
| **F-37** | Dietary | Standard Dietary Tag Taxonomy | Standard list of tags: Vegetarian, Vegan, Keto, Gluten-Free, etc. | Canonical tag definitions | Consistent badge colors and filters | Case-insensitive matching | `types/index.ts`, `ORIGINAL_REQUEST.md` (R4) |
| **F-38** | Dietary | AI Extraction Auto-Tagging | Prompts Gemini to analyze ingredients and assign dietary tags | Raw transcript / food photo | Extracted recipe with accurate dietary tags | Ensures tags conform to taxonomy | `ai.ts`, `ORIGINAL_REQUEST.md` (R4) |
| **F-39** | Dietary | Recipe Collection Filter | Filter recipe library by single or multi-tag dietary criteria | Tag selection buttons / dropdown | Filtered recipe card view | Shows empty state if 0 recipes match filter | `recipes/page.tsx`, `ORIGINAL_REQUEST.md` (R4) |
| **F-40** | Dietary | Dietary-Compliant Auto-Fill | Auto-fill algorithm strictly filters recipes by user preferences | User dietary preferences + recipes | Meal plan containing only compliant recipes | Informative alert if insufficient recipes in library | `meal-planner.ts`, `ORIGINAL_REQUEST.md` (R4) |

---

## 3. Deep-Dive Specification: R1 — Bug Fixes & Core End-to-End Functionality

### 3.1 Build & Offline Environment Safety
- **Issue Discovered**: `src/app/layout.tsx` imports `Geist` and `Geist_Mono` from `next/font/google`. In containerized or offline environments without Google Fonts access, `npm run build` fails with `Failed to fetch Geist from Google Fonts`.
- **Specification Requirement**: 
  - Provide a safe font fallback strategy using CSS system font stacks (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`) with font variables defined in CSS or local font declarations.
  - Fix any `@ts-ignore` in `layout.tsx` or UI components by ensuring all imported components export proper React 19 / TypeScript types.
  - Target: `npm run build` and `npx tsc --noEmit` must exit with return code `0`.

### 3.2 Authentication & User Profile Lifecycle
1. **Sign-Up Flow**:
   - Accepts `email`, `password` (min 6 characters), and `displayName`.
   - Calls `createUserWithEmailAndPassword(auth, email, password)`.
   - Executes `updateProfile(user, { displayName })`.
   - Idempotently creates or updates Firestore document `users/{userId}`:
     ```ts
     {
       uid: string,
       email: string,
       displayName: string,
       createdAt: serverTimestamp(),
       preferences: {
         repeatWindowDays: 5,
         mealsPerDay: ['breakfast', 'lunch', 'dinner'],
         dietaryRestrictions: []
       }
     }
     ```
   - Automatically redirects to `/dashboard`.
2. **Google OAuth Flow**:
   - Invokes `signInWithPopup(auth, new GoogleAuthProvider())`.
   - Creates Firestore document if `!userDoc.exists()`.
   - Redirects to `/dashboard`.
3. **Auth State Guard & Error Mapping**:
   - `AuthGuard` displays a warm centered loading state while `loading === true`.
   - When `!user && pathname !== '/login'`, routes to `/login`.
   - When `user && pathname === '/login'`, routes to `/dashboard`.
   - Handles all standard Firebase Auth error codes with human-readable error messages.

### 3.3 Recipe Extraction (YouTube & Photo)
1. **YouTube Extraction Flow**:
   - User inputs YouTube URL (`https://www.youtube.com/watch?v=...`, `https://youtu.be/...`, `https://youtube.com/shorts/...`).
   - Client sends POST request to `/api/youtube-recipe` with `{ url }`.
   - Server parses video ID using regex `/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([-\w]{11})/`.
   - Server calls `Innertube.create()` and `info.getTranscript()`.
   - Returns `{ title, description, thumbnailUrl, transcript }`.
   - Client invokes `extractRecipeFromTranscript(title, description, transcript)` with Gemini 2.5 Flash (`recipeModel`).
   - Renders `RecipePreview` with extracted fields, ingredients, instructions, and dietary tags.
   - User clicks "Save to My Recipes" -> writes to `users/{userId}/recipes`.
2. **Photo / Camera Extraction Flow**:
   - User uploads food photo (drag-and-drop or file selector) or snaps photo via camera (`capture="environment"`).
   - Client extracts Base64 payload and MIME type (`image/jpeg`, `image/png`, `image/webp`).
   - Client invokes `extractRecipeFromImage(base64Data, mimeType)` with Gemini 2.5 Flash.
   - Renders `RecipePreview`.
   - User clicks "Save to My Recipes" -> writes to `users/{userId}/recipes`.

### 3.4 Recipe Management, Rating & "I Made This" Tracker
1. **Rating System**:
   - 1 to 5 star rating interface on `RecipeDetailPage`.
   - Clicking a star calls `rateRecipe(id, rating)` -> executes `updateDoc(recipeRef, { rating })`.
   - Rating persists and is displayed on recipe cards in `/recipes` and `/dashboard`.
2. **"I Made This" Tracker**:
   - Primary action button on `RecipeDetailPage`.
   - Clicking calls `markAsMade(id)` which executes an atomic batch/transaction:
     - Increments `timesMade` by 1.
     - Sets `lastMadeAt: serverTimestamp()`.
     - Adds entry to `users/{userId}/cookingLog`:
       ```ts
       {
         recipeId: string,
         recipeName: string,
         cookedAt: serverTimestamp(),
         rating?: number
       }
       ```
3. **Notes Editing**:
   - Textarea on `RecipeDetailPage` initialized with `recipe.notes || ""`.
   - On `onBlur`, if content has changed, calls `updateRecipe(id, { notes })`.

### 3.5 7x3 Meal Planner & ISO Week Management
1. **Calendar Week Calculation**:
   - Day names: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`.
   - Meal slots: `breakfast`, `lunch`, `dinner` (21 slots total per week).
   - ISO Week ID format: `YYYY-Www` (e.g., `2026-W35`).
   - Critical Calculation Rule: Must use ISO week-year (e.g. `getISOWeekYear` or `format(date, "RRRR-'W'II")`) to prevent year boundary mismatch.
2. **Slot Operations**:
   - `setMealSlot(day, mealTime, { recipeId, recipeName, thumbnailUrl })`: persists to `users/{userId}/mealPlans/{weekId}`.
   - `clearMealSlot(day, mealTime)`: removes slot from day's meals object.
   - `clearAll()`: resets all 21 slots to empty.
3. **Auto-Fill Algorithm**:
   - Checks `useCookingLog(repeatWindowDays)` to get recently made recipe IDs (`recentRecipeIds`).
   - Filters `allRecipes` for candidate pool.
   - Preserves user-locked slots.
   - Ensures no duplicate recipe within the same day and avoids yesterday's recipes.
   - Prefers easy meals on weekdays and medium/hard on weekends.
   - In R4: Strictly enforces dietary restrictions filter.

---

## 4. Deep-Dive Specification: R2 — Modern UI/UX, Warm Theming & Mobile-First

### 4.1 Warm Color Palette & Theming (Tailwind v4)
All application surfaces must adhere to a cohesive, warm food aesthetic utilizing Amber, Orange, and Stone tones:

```css
/* Color Palette Token Specifications */
:root {
  --primary: oklch(0.65 0.22 45);              /* Warm Vibrant Orange (#EA580C) */
  --primary-foreground: oklch(0.99 0.01 45);   /* Warm White */
  --secondary: oklch(0.96 0.03 70);            /* Warm Amber-Stone Light */
  --secondary-foreground: oklch(0.25 0.05 45); /* Deep Warm Umber */
  --accent: oklch(0.93 0.06 75);               /* Soft Golden Amber */
  --accent-foreground: oklch(0.25 0.05 45);
  --background: oklch(0.985 0.01 70);          /* Off-white Warm Stone */
  --foreground: oklch(0.18 0.02 45);          /* Charcoal Warm Black */
  --card: oklch(1 0 0);                        /* Pure White Card */
  --card-foreground: oklch(0.18 0.02 45);
  --border: oklch(0.92 0.02 70);               /* Subtle Warm Border */
  --ring: oklch(0.65 0.22 45);
}
```

### 4.2 Mobile-First & Responsive Layout Rules
1. **Viewport Verification**:
   - Mobile: 375px width (iPhone SE / standard mobile) — zero horizontal scroll (`overflow-x: hidden`).
   - Tablet: 768px width.
   - Desktop: 1440px width — centered max-width containers (`max-w-6xl` or `max-w-7xl`).
2. **Navigation Bar**:
   - **Desktop (>=768px)**: Sticky top header with Logo, Nav Links (`Dashboard`, `Extract`, `Recipes`, `Meal Plan`, `Shopping List`), and User Avatar Dropdown with Dietary Settings and Logout.
   - **Mobile (<768px)**: Fixed bottom tab bar (`h-16`) with safe area inset padding (`pb-safe`), displaying 5 primary icons: Home, Extract, Recipes, Planner, Shopping List. User avatar/settings accessible from header or profile icon.
   - **Main Content Offset**: `pb-24 md:pb-10` to guarantee bottom navigation never obscures page buttons or forms.

### 4.3 Loading, Empty States & Micro-Interactions
1. **Loading Skeletons & Spinners**:
   - Skeleton recipe cards during initial recipe list fetch.
   - Skeleton grid during meal plan load.
   - Animated pulsing badge during AI extraction ("Gemini is analyzing video transcript...").
   - Button spinning indicators (`<Loader2 className="animate-spin" />`) during async operations (Save, Delete, Auto-Fill, Sign-In).
2. **Actionable Empty States**:
   - Recipe Library: Illustrated icon + "No recipes yet! Extract your first recipe from YouTube or photo." + Button to `/extract`.
   - Search Zero-State: "No recipes found matching '{query}'" + "Clear Search" button.
   - Meal Planner: Dashed border slot with "+" button opening quick recipe picker.
   - Shopping List: Basket icon + "Your shopping list is empty" + "Generate from Meal Plan" CTA.

---

## 5. Deep-Dive Specification: R3 — Shopping List & Intelligent Ingredient Aggregator

### 5.1 Architecture & Flow
The Shopping List feature enables users to generate an aggregated grocery list directly from their planned meals, manually add custom items, check off items while in the store, and have the list automatically persist in Firestore.

```
[ Meal Plan (21 Slots) ]
           │
           ▼
[ Extract All Recipe Ingredients ]
           │
           ▼
[ Canonical Item Normalizer & Alias Mapper ]  <─── (e.g. "onions" -> "onion", "garlic cloves" -> "garlic")
           │
           ▼
[ Unit Normalizer & Conversion Engine ]       <─── (e.g. "3 tsp" -> "1 tbsp", "16 tbsp" -> "1 cup")
           │
           ▼
[ Quantity Aggregator & Summing ]             <─── (e.g. 1 onion + 2 onions = 3 onions)
           │
           ▼
[ Department Categorizer ]                    <─── (Produce, Meat, Dairy, Pantry, Spices, Bakery, Other)
           │
           ▼
[ Interactive Shopping List UI & Firestore ]  <─── (Checked state, custom items, offline/live sync)
```

### 5.2 Ingredient Normalization & Canonical Lexicon Rules

#### Item Name Canonicalization:
1. **Trim & Lowercase**: Strip whitespace, punctuation, and transform to lowercase.
2. **Descriptor Stripping**: Strip preparation adjectives when grouping items (e.g., `chopped`, `diced`, `minced`, `sliced`, `grated`, `crushed`, `freshly ground`, `peeled`, `cooked`, `melted`, `to taste`, `divided`, `optional`).
3. **Plural-to-Singular Mapping**:
   - `onions` -> `onion`
   - `tomatoes` -> `tomato`
   - `potatoes` -> `potato`
   - `cloves of garlic` / `garlic cloves` -> `garlic`
   - `eggs` -> `egg`
   - `carrots` -> `carrot`
   - `bell peppers` -> `bell pepper`
   - `chicken breasts` -> `chicken breast`
   - `lemons` -> `lemon`
   - `limes` -> `lime`
   - `apples` -> `apple`
   - `avocados` -> `avocado`
   - `shallots` -> `shallot`
   - `mushrooms` -> `mushroom`
   - `scallions` / `green onions` -> `green onion`

#### Unit Canonicalization & Mapping:
| Raw String Variants | Canonical Unit | Unit Type |
|---------------------|----------------|-----------|
| `tbsp`, `tbs`, `tablespoon`, `tablespoons`, `T`, `tb` | `tbsp` | Volume |
| `tsp`, `teaspoon`, `teaspoons`, `t` | `tsp` | Volume |
| `cup`, `cups`, `c` | `cup` | Volume |
| `fl oz`, `fluid ounce`, `fluid ounces` | `fl oz` | Volume |
| `pint`, `pints`, `pt` | `pint` | Volume |
| `quart`, `quarts`, `qt` | `quart` | Volume |
| `gallon`, `gallons`, `gal` | `gallon` | Volume |
| `ml`, `milliliter`, `milliliters` | `ml` | Metric Volume |
| `l`, `liter`, `liters` | `l` | Metric Volume |
| `oz`, `ounce`, `ounces` | `oz` | Weight |
| `lb`, `lbs`, `pound`, `pounds` | `lb` | Weight |
| `g`, `gram`, `grams` | `g` | Metric Weight |
| `kg`, `kilogram`, `kilograms` | `kg` | Metric Weight |
| `clove`, `cloves` | `clove` | Discrete Unit |
| `can`, `cans` | `can` | Discrete Unit |
| `stalk`, `stalks` | `stalk` | Discrete Unit |
| `bunch`, `bunches` | `bunch` | Discrete Unit |
| `pinch`, `pinches` | `pinch` | Minor Measure |
| `dash`, `dashes` | `dash` | Minor Measure |
| `slice`, `slices` | `slice` | Discrete Unit |
| `piece`, `pieces`, `count`, `item`, `items`, `""` | `unit` | Discrete Unit |

#### Fraction Parsing & Numeric Conversion:
1. **Vulgar Fractions**:
   - `½` -> `0.5`
   - `⅓` -> `0.333`
   - `⅔` -> `0.667`
   - `¼` -> `0.25`
   - `¾` -> `0.75`
   - `⅛` -> `0.125`
   - `⅜` -> `0.375`
   - `⅝` -> `0.625`
   - `⅞` -> `0.875`
2. **String Fractions**:
   - `"1/2"` -> `0.5`
   - `"1 1/2"` / `"1-1/2"` -> `1.5`
   - `"3/4"` -> `0.75`
   - `"2 1/4"` -> `2.25`
3. **Ranges**:
   - `"2-3"` / `"2 to 3"` -> parse upper bound `3` (for shopping conservatism).
4. **Formatting Decimal to Human-Friendly Quantity**:
   - `0.25` -> `"1/4"`
   - `0.33` -> `"1/3"`
   - `0.5` -> `"1/2"`
   - `0.67` -> `"2/3"`
   - `0.75` -> `"3/4"`
   - `1.5` -> `"1 1/2"`
   - `2.0` -> `"2"`

#### Unit Conversion Table & Threshold Rules:
1. **Volume Hierarchy**:
   - Base: `1 tsp`
   - `3 tsp = 1 tbsp`
   - `16 tbsp = 1 cup` (or `48 tsp = 1 cup`)
   - `2 cups = 1 pint`
   - `2 pints = 1 quart` (4 cups)
   - `4 quarts = 1 gallon` (16 cups)
   - *Rule*: If sum in `tsp >= 3`, convert to `tbsp`. If sum in `tbsp >= 4`, convert to `cup` (or fraction of cup).
2. **Metric Volume**:
   - `1000 ml = 1 l`
   - *Rule*: If sum in `ml >= 1000`, convert to `l`.
3. **Weight Hierarchy**:
   - `16 oz = 1 lb`
   - *Rule*: If sum in `oz >= 16`, convert to `lb`.
4. **Metric Weight**:
   - `1000 g = 1 kg`
   - *Rule*: If sum in `g >= 1000`, convert to `kg`.
5. **Incompatible Units Fallback**:
   - If two recipes call for the same item in incompatible unit systems (e.g., Recipe A: `2 cups flour`, Recipe B: `250g flour`), the aggregator maintains separate quantity buckets or presents a combined formatted string: `"2 cups + 250g flour"`.

### 5.3 Department Categorization Taxonomy
Each ingredient item is automatically sorted into one of the following store categories:
1. **Produce**: Vegetables, fruits, fresh herbs, onions, garlic, potatoes, avocados, citrus.
2. **Meat & Seafood**: Chicken, beef, pork, bacon, turkey, fish, shrimp, salmon, sausage.
3. **Dairy & Refrigerated**: Milk, butter, heavy cream, yogurt, cheese, cheddar, mozzarella, eggs, tofu.
4. **Pantry & Baking**: Flour, sugar, olive oil, vegetable oil, rice, pasta, vinegar, soy sauce, honey, yeast, baking powder, cornstarch.
5. **Canned & Jarred**: Canned tomatoes, beans, chickpeas, coconut milk, chicken broth, vegetable stock, tomato paste.
6. **Spices & Seasonings**: Salt, black pepper, paprika, oregano, basil, cumin, garlic powder, chili powder, cinnamon.
7. **Bakery**: Bread, buns, tortillas, pita, rolls.
8. **Other**: Any unmatched items or custom user additions.

### 5.4 Shopping List Persistence Schema & Rules
- **Firestore Path**: `users/{userId}/shoppingList/current` (or `users/{userId}/shoppingLists/{weekId}`)
- **Security Rule**:
  ```firestore
  match /users/{userId} {
    match /shoppingList/{document=**} {
      allow read, write: if isOwner(userId);
    }
  }
  ```

---

## 6. Deep-Dive Specification: R4 — Dietary Preferences & Smart Recipe Filtering

### 6.1 Dietary Preferences Taxonomy
PlateUp supports the following standardized dietary categories:
- `vegetarian` — Contains no meat, poultry, or seafood.
- `vegan` — 100% plant-based; contains no animal products (meat, dairy, eggs, honey).
- `gluten-free` — Contains no wheat, barley, rye, or gluten-containing ingredients.
- `dairy-free` — Contains no milk, butter, cheese, cream, or dairy derivatives.
- `keto` — High-fat, low-carbohydrate (<15g net carbs per serving).
- `paleo` — Whole foods based on lean meats, fish, fruits, vegetables, nuts, and seeds.
- `pescatarian` — Vegetarian diet that includes seafood/fish.
- `nut-free` — Contains no peanuts or tree nuts.
- `low-carb` — Low total carbohydrate content.

### 6.2 AI Extraction Auto-Tagging Engine
The Gemini 2.5 Flash prompts and structured response schema must explicitly require dietary evaluation:

```ts
// Structured Schema in src/lib/ai.ts
const recipeSchema = Schema.object({
  properties: {
    name: Schema.string(),
    description: Schema.string(),
    prepTimeMinutes: Schema.integer(),
    cookTimeMinutes: Schema.integer(),
    servings: Schema.integer(),
    difficulty: Schema.enumString({ enum: ['easy', 'medium', 'hard'] }),
    tags: Schema.array({
      items: Schema.string(),
      description: "Tags including cuisine, meal type (breakfast, lunch, dinner, snack), and all applicable dietary tags: 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'pescatarian', 'nut-free', 'low-carb'."
    }),
    ingredients: Schema.array({
      items: Schema.object({
        properties: {
          item: Schema.string(),
          amount: Schema.string(),
          unit: Schema.string(),
        },
        optionalProperties: [],
      }),
    }),
    instructions: Schema.array({ items: Schema.string() }),
  },
  optionalProperties: ['description'],
});
```

#### Updated Prompt Directives:
In `YOUTUBE_RECIPE_PROMPT` and `IMAGE_RECIPE_PROMPT`:
> "Analyze all ingredients and preparation methods to accurately tag dietary attributes: assign 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'pescatarian', etc. whenever the recipe complies. Do not include false dietary claims."

### 6.3 Recipe Collection Multi-Filter
On `/recipes`:
1. **Dietary Filter Pills**:
   - `All`, `Vegetarian`, `Vegan`, `Gluten-Free`, `Dairy-Free`, `Keto`, `Pescatarian`, `Nut-Free`.
2. **"My Preferences" Quick Toggle**:
   - Automatically filters recipes to match all active dietary restrictions configured in the user's profile.
3. **Compound Search**:
   - Filters by `searchQuery` (name, ingredients, tags) AND active dietary filters AND source badge filter.

### 6.4 Dietary-Compliant Meal Planner Auto-Fill
In `generateMealPlan(allRecipes, recentRecipeIds, lockedSlots, repeatWindowDays, dietaryRestrictions)`:
1. **Initial Filter**:
   ```ts
   let candidateRecipes = allRecipes;
   if (dietaryRestrictions && dietaryRestrictions.length > 0) {
     candidateRecipes = allRecipes.filter(recipe => {
       const recipeTags = (recipe.tags || []).map(t => t.toLowerCase());
       return dietaryRestrictions.every(req => recipeTags.includes(req.toLowerCase()));
     });
   }
   ```
2. **Library Size Verification & User Feedback**:
   - If `candidateRecipes.length === 0`:
     - Return plan with locked slots preserved and return status/warning: `"No recipes in your library match your dietary preferences: [preferences]. Please extract or tag more recipes."`
3. **Slot Filling Execution**:
   - Auto-fill populates slots exclusively from `candidateRecipes`, honoring `repeatWindowDays` and weekend difficulty preferences.

---

## 7. Data Schemas & Interface Contracts

### 7.1 Complete TypeScript Interfaces (`src/types/index.ts`)

```typescript
// ==========================================
// 1. INGREDIENT & RECIPE SCHEMAS
// ==========================================

export type RecipeSource = 'youtube' | 'image' | 'manual';
export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export type IngredientCategory = 
  | 'produce'
  | 'meat'
  | 'dairy'
  | 'pantry'
  | 'spices'
  | 'canned'
  | 'bakery'
  | 'other';

export interface Ingredient {
  item: string;
  amount: string;
  unit: string;
  category?: IngredientCategory;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  source: RecipeSource;
  sourceUrl?: string;
  thumbnailUrl?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  rating?: number; // 1-5
  notes?: string;
  lastMadeAt?: Date;
  timesMade: number;
  createdAt: Date;
  updatedAt?: Date;
}

// ==========================================
// 2. MEAL PLANNER SCHEMAS
// ==========================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type MealTime = 'breakfast' | 'lunch' | 'dinner';

export interface MealSlot {
  recipeId: string;
  recipeName: string;
  thumbnailUrl?: string;
}

export type DayMeals = {
  [K in MealTime]?: MealSlot;
};

export type WeekMeals = {
  [K in DayOfWeek]: DayMeals;
};

export interface MealPlan {
  id: string; // ISO week format: "2026-W35"
  weekStart: Date;
  meals: WeekMeals;
  createdAt: Date;
  updatedAt?: Date;
}

// ==========================================
// 3. COOKING LOG & HISTORY SCHEMAS
// ==========================================

export interface CookingLogEntry {
  id: string;
  recipeId: string;
  recipeName: string;
  cookedAt: Date;
  rating?: number;
}

// ==========================================
// 4. USER PROFILE & DIETARY PREFERENCES
// ==========================================

export type DietaryRestriction = 
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'keto'
  | 'paleo'
  | 'pescatarian'
  | 'nut-free'
  | 'low-carb';

export interface UserPreferences {
  repeatWindowDays: number; // default: 5
  mealsPerDay: MealTime[];  // default: ['breakfast', 'lunch', 'dinner']
  dietaryRestrictions: DietaryRestriction[]; // R4
  allergies?: string[];
  favoriteCuisines?: string[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt?: Date;
}

// ==========================================
// 5. SHOPPING LIST SCHEMAS (R3)
// ==========================================

export interface ShoppingListItem {
  id: string;
  item: string;
  rawItem: string;
  amount: number | string;
  unit: string;
  displayAmount: string; // e.g. "3", "1 1/2", "500"
  category: IngredientCategory;
  checked: boolean;
  recipeIds?: string[];
  recipeNames?: string[];
  isCustom?: boolean;
  createdAt: Date;
}

export interface ShoppingList {
  id: string; // "current" or "2026-W35"
  weekId?: string;
  items: ShoppingListItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 6. API REQUEST / RESPONSE CONTRACTS
// ==========================================

export interface YouTubeRecipeRequest {
  url: string;
}

export interface YouTubeRecipeResponse {
  title: string;
  description: string;
  thumbnailUrl: string;
  transcript: string;
}

export interface ImageRecipeRequest {
  imageBase64: string;
  mimeType: string;
}

export interface ExtractedRecipe {
  name: string;
  description?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  tags: string[];
  ingredients: {
    item: string;
    amount: string;
    unit: string;
  }[];
  instructions: string[];
}
```

---

## 8. Edge Cases & Robustness Matrix

| # | Feature | Input / Condition | Expected / Observed Behavior | Recovery / Fallback Mechanism |
|---|---------|-------------------|------------------------------|-------------------------------|
| **E-01** | Build | Offline sandbox environment without Google Fonts access | Next.js build fails if fetching fonts from CDN | Use standard system fonts with CSS variables in `globals.css` |
| **E-02** | YouTube Extraction | YouTube video URL without captions/transcript | `getTranscript()` fails or returns empty | Fallback to parsing video description; if <50 chars, return clear user alert |
| **E-03** | YouTube Extraction | Malformed / invalid URL or non-YouTube link | Regex fails to find 11-char video ID | Show inline validation error: "Please enter a valid YouTube URL" |
| **E-04** | Photo Extraction | Non-image file or unsupported MIME type (e.g. PDF/TXT) | `mimeType.startsWith('image/')` check fails | Throw error with clear message: "Please upload a valid image file" |
| **E-05** | Photo Extraction | Oversized image (>10MB) | Base64 string causes memory pressure / payload limit | Resize / compress image on canvas before sending to Gemini API |
| **E-06** | Rating | Rapid double-click or rating <1 or >5 | API or state mutation error | Constrain rating between 1 and 5; debounce update call |
| **E-07** | "I Made This" | Deleted recipe referenced in cooking log | Log entry has missing recipe document | Safely display recipeName recorded in log entry |
| **E-08** | Meal Planner | End of calendar year week calculation (Dec 29 - Jan 3) | Calendar year vs ISO week-year mismatch | Use `getISOWeekYear` or `format(date, "RRRR-'W'II")` |
| **E-09** | Meal Planner Auto-Fill | Saved recipes count is fewer than empty slots (e.g. 3 recipes for 21 slots) | Strict no-repeat rule exhausts candidate recipes | Tiered fallback: relax repeat window, then permit same-week reuse with daily spacing |
| **E-10** | Meal Planner Auto-Fill | User has strict dietary preferences with 0 matching recipes | Auto-fill candidate list is empty | Retain existing plan; display toast: "No recipes match your dietary preferences" |
| **E-11** | Shopping List | Fractions in amounts (e.g. `1/2 cup` + `1/4 cup`) | String concatenation produces `"1/21/4"` | Parse fractions to numeric float `0.5 + 0.25 = 0.75`, format as `"3/4"` |
| **E-12** | Shopping List | Incompatible unit combinations (e.g. `2 cups` + `200g` flour) | Mathematical conversion between volume and weight is ambiguous | Combine as multi-unit entry: `"2 cups + 200g flour"` |
| **E-13** | Shopping List | Ingredient with no amount/unit (e.g. `"Salt to taste"`) | Number parsing yields `NaN` | Parse item as `"salt"`, amount as `"to taste"`, unit as `""` |
| **E-14** | Shopping List | Regenerating shopping list with existing checked items | Overwriting list erases user's in-store progress | Prompt confirmation modal or preserve checked states for matching items |
| **E-15** | Profile Settings | Unauthenticated user accessing `/settings` or `/shopping-list` | Unauthorized Firestore access | `AuthGuard` automatically redirects to `/login` |
| **E-16** | Mobile Layout | Screen width at 320px - 375px with long recipe titles | Text wraps or causes horizontal overflow | Use `truncate` or `line-clamp-2` with `break-words` |
| **E-17** | Recipe Notes | User types notes and closes browser without clicking outside | `onBlur` does not fire | Debounce save on `onChange` with 1000ms delay in addition to `onBlur` |

---

## 9. Verification & Acceptance Criteria Checklist

### 9.1 Core Functionality (R1)
- [x] `npm run build` completes with zero errors
- [x] `npx tsc --noEmit` completes with zero TypeScript errors
- [x] Sign up with email/password creates account and redirects to `/dashboard`
- [x] Google Sign-In popup completes and creates profile
- [x] Extracting recipe from YouTube URL returns complete ingredients and instructions
- [x] Uploading food photo extracts recipe via Gemini multimodal AI
- [x] Saving recipe persists to Firestore `users/{userId}/recipes` and displays in collection
- [x] Rating recipe (1-5 stars) updates Firestore and persists visually
- [x] "I Made This" button increments cook count and appends entry to `cookingLog`
- [x] Weekly meal planner displays 7 days × 3 meals (21 slots) and allows manual assignment/clearing
- [x] Auto-fill populates empty slots while avoiding recent cooking history
- [x] Dashboard shows today's 3 meals from current week's plan and live stats

### 9.2 UI Quality (R2)
- [x] Mobile viewport (375px) renders cleanly with no horizontal scroll
- [x] Desktop viewport (1440px) renders balanced wide layouts
- [x] Loading states and skeleton placeholders appear during all async transitions
- [x] Empty states provide clear instructions and primary action buttons
- [x] Consistent warm amber/orange color theme applied across all pages

### 9.3 Shopping List (R3)
- [x] "Shopping List" accessible from main navigation (Desktop top nav & Mobile bottom nav)
- [x] Generates consolidated shopping list from current meal plan's assigned recipes
- [x] Duplicates across recipes are normalized and summed with unit conversions
- [x] Individual grocery items can be checked off and toggled
- [x] Shopping list items and checked states persist across page reloads in Firestore

### 9.4 Dietary Preferences (R4)
- [x] Users can configure dietary preferences in profile/settings
- [x] Recipes display dietary badges (Vegetarian, Vegan, Gluten-Free, Keto, etc.)
- [x] AI extraction prompt automatically identifies and attaches dietary tags
- [x] Recipe collection is filterable by dietary category and "Matches My Preferences"
- [x] Meal planner auto-fill strictly complies with user's active dietary restrictions
